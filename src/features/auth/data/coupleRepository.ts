import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, set as rtdbSet, remove as rtdbRemove } from 'firebase/database';
import { db, rtdb } from '@/core/firebase/client';
import type { Couple, CoupleInvite, UserProfile } from '@/types/models';

/** Every couple-scoped subcollection (see docs/DATABASE_SCHEMA.md). */
const COUPLE_SUBCOLLECTIONS = [
  'moods', 'geofences', 'capsules', 'posts', 'snaps', 'wheelSpins',
  'fantasies', 'mediations', 'letters', 'meta', 'radars', 'loveLanguages',
  'compatibility', 'timeline', 'taps', 'dreamPins', 'dreamCollections', 'games',
];

/** Delete every doc in a collection path, batched (max 450 ops/commit). */
async function wipeCollection(path: string): Promise<void> {
  const snap = await getDocs(collection(db, path));
  if (snap.empty) return;
  let batch = writeBatch(db);
  let n = 0;
  for (const d of snap.docs) {
    batch.delete(d.ref);
    if (++n % 450 === 0) {
      await batch.commit();
      batch = writeBatch(db);
    }
  }
  if (n % 450 !== 0) await batch.commit();
}

/** Remove this user's own RTDB nodes for a couple (rules forbid the partner's). */
async function wipeOwnRtdb(coupleId: string, uid: string): Promise<void> {
  await Promise.allSettled(
    ['location', 'mood', 'heartbeat', 'missingYou'].map((k) =>
      rtdbRemove(ref(rtdb, `${k}/${coupleId}/${uid}`)),
    ).concat(rtdbRemove(ref(rtdb, `coupleMembers/${coupleId}/${uid}`))),
  );
}

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

  /**
   * Remove the partner and DELETE all shared data (irreversible). Initiator side:
   * wipes every couple subcollection (incl. nested post comments), resets our
   * OWN user doc, then deletes the couple doc LAST (so isMember stays true during
   * the wipe), and clears our own RTDB nodes. The partner's app self-cleans via
   * the bootstrap when it detects the couple is gone — rules only let each user
   * reset their own user doc + RTDB, so cleanup is cooperative.
   */
  async unlinkAndWipe(coupleId: string, uid: string): Promise<void> {
    // Nested comments first (posts/{id}/comments).
    const posts = await getDocs(collection(db, `couples/${coupleId}/posts`));
    for (const p of posts.docs) {
      await wipeCollection(`couples/${coupleId}/posts/${p.id}/comments`).catch(() => {});
    }
    // Every top-level subcollection.
    for (const sub of COUPLE_SUBCOLLECTIONS) {
      await wipeCollection(`couples/${coupleId}/${sub}`).catch(() => {});
    }
    // Reset our own user doc, then delete the couple doc LAST.
    await updateDoc(doc(db, 'users', uid), { coupleId: null, partnerId: null });
    await deleteDoc(doc(db, 'couples', coupleId));
    await wipeOwnRtdb(coupleId, uid);
  },

  /** Partner-side cleanup once the other person deleted the couple. */
  async leaveDissolvedCouple(coupleId: string, uid: string): Promise<void> {
    await updateDoc(doc(db, 'users', uid), { coupleId: null, partnerId: null }).catch(() => {});
    await wipeOwnRtdb(coupleId, uid);
  },
};

/* Local helpers — kept here to avoid extra imports in the data layer. */
function cryptoRandomId(): string {
  return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2, 6);
}
function nowPlusDays(days: number): number {
  return Date.now() + days * 24 * 60 * 60 * 1000;
}
