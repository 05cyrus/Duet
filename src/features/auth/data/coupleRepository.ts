import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, set as rtdbSet } from 'firebase/database';
import { db, rtdb } from '@/core/firebase/client';
import type { Couple, CoupleInvite, UserProfile } from '@/types/models';

/**
 * Couple linking + invite system. This is the trickiest consistency operation
 * in the app, so it runs in a Firestore transaction:
 *   1. create couple   2. write invite code   3. point user at couple
 * Joining consumes the invite atomically and adds the second member.
 *
 * We also mirror membership into RTDB `coupleMembers/{coupleId}/{uid}` because
 * RTDB rules can't do Firestore lookups — that mirror is what gates location /
 * mood / heartbeat reads.
 */

function randomCode(): string {
  // 6 chars, unambiguous alphabet
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

export const coupleRepository = {
  async getCouple(coupleId: string): Promise<Couple | null> {
    const snap = await getDoc(doc(db, 'couples', coupleId));
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as Couple) : null;
  },

  /** Create a couple for a single user + an invite code to share. */
  async createCoupleWithInvite(user: UserProfile): Promise<{ coupleId: string; code: string }> {
    const newCoupleRef = doc(db, 'couples', cryptoRandomId());
    const code = randomCode();
    const expiresAt = nowPlusDays(7);

    await runTransaction(db, async (tx) => {
      tx.set(newCoupleRef, {
        memberIds: [user.uid],
        status: 'dating',
        anniversary: null,
        inviteCode: code,
        createdAt: serverTimestamp(),
        members: {
          [user.uid]: { displayName: user.displayName, avatarUrl: user.avatarUrl },
        },
      });
      tx.set(doc(db, 'invites', code), {
        code,
        coupleId: newCoupleRef.id,
        createdBy: user.uid,
        expiresAt,
        consumed: false,
      } satisfies Omit<CoupleInvite, never>);
      tx.update(doc(db, 'users', user.uid), { coupleId: newCoupleRef.id });
    });

    await rtdbSet(ref(rtdb, `coupleMembers/${newCoupleRef.id}/${user.uid}`), true);
    return { coupleId: newCoupleRef.id, code };
  },

  /** Join an existing couple by invite code. Atomically links both partners. */
  async joinByCode(user: UserProfile, code: string): Promise<string> {
    const inviteRef = doc(db, 'invites', code.toUpperCase());

    const coupleId = await runTransaction(db, async (tx) => {
      const inviteSnap = await tx.get(inviteRef);
      if (!inviteSnap.exists()) throw new Error('Invalid invite code.');
      const invite = inviteSnap.data() as CoupleInvite;
      if (invite.consumed) throw new Error('This code was already used.');
      if (invite.expiresAt < Date.now()) throw new Error('This code has expired.');

      const coupleRef = doc(db, 'couples', invite.coupleId);
      const coupleSnap = await tx.get(coupleRef);
      if (!coupleSnap.exists()) throw new Error('Couple no longer exists.');
      const couple = coupleSnap.data() as Couple;
      if (couple.memberIds.includes(user.uid)) return invite.coupleId; // idempotent
      if (couple.memberIds.length >= 2) throw new Error('This relationship is already full.');

      const partnerId = couple.memberIds[0]!;
      tx.update(coupleRef, {
        memberIds: [partnerId, user.uid],
        inviteCode: null,
        [`members.${user.uid}`]: { displayName: user.displayName, avatarUrl: user.avatarUrl },
      });
      tx.update(inviteRef, { consumed: true });
      // Only write OUR OWN user doc — rules forbid writing the partner's doc.
      // The partner sets their own `partnerId` via the bootstrap self-heal once
      // the couple shows two members.
      tx.update(doc(db, 'users', user.uid), { coupleId: invite.coupleId, partnerId });
      return invite.coupleId;
    });

    await rtdbSet(ref(rtdb, `coupleMembers/${coupleId}/${user.uid}`), true);
    return coupleId;
  },

  /** Issue a fresh invite code for an EXISTING couple (partner not yet linked). */
  async regenerateInvite(coupleId: string, user: UserProfile): Promise<string> {
    const code = randomCode();
    await setDoc(doc(db, 'invites', code), {
      code,
      coupleId,
      createdBy: user.uid,
      expiresAt: nowPlusDays(7),
      consumed: false,
    } satisfies CoupleInvite);
    await updateDoc(doc(db, 'couples', coupleId), { inviteCode: code });
    return code;
  },

  async setAnniversary(coupleId: string, anniversary: string): Promise<void> {
    await updateDoc(doc(db, 'couples', coupleId), { anniversary });
  },
};

/* Local helpers — kept here to avoid extra imports in the data layer. */
function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2, 6);
}
function nowPlusDays(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}
