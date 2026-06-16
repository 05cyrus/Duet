import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { firebaseAuth, db } from '@/core/firebase/client';
import { useSession } from '@/core/state/session';
import { ensureProfile } from './authService';
import { coupleRepository } from '../data/coupleRepository';
import type { UserProfile, Couple } from '@/types/models';

/**
 * Drives the auth gate. We use LIVE listeners (not one-time reads) because:
 *  1. On signup, onAuthStateChanged fires before the profile doc finishes
 *     writing — a one-time read would return null and strand the user with a
 *     null profile. A snapshot fires again the moment the doc lands.
 *  2. When the partner links, both the user doc (partnerId) and couple doc
 *     (memberIds) change; listeners flip status → 'ready' automatically.
 * Mount once in app/_layout.tsx.
 */
export function useAuthBootstrap() {
  const { setProfile, setCouple, setStatus, reset } = useSession();

  useEffect(() => {
    let unsubUser: (() => void) | null = null;
    let unsubCouple: (() => void) | null = null;
    const clearDocs = () => {
      unsubUser?.();
      unsubUser = null;
      unsubCouple?.();
      unsubCouple = null;
    };

    const unsubAuth = onAuthStateChanged(firebaseAuth, (fbUser) => {
      clearDocs();
      if (!fbUser) {
        reset();
        return;
      }
      setStatus('loading');
      let healing = false;

      unsubUser = onSnapshot(
        doc(db, 'users', fbUser.uid),
        (snap) => {
          // Self-heal: if a signed-in user has no profile doc (e.g. account
          // created before Firestore existed, or a failed first write), create
          // it. The write re-triggers this same listener with the real doc.
          if (!snap.exists()) {
            if (!healing) {
              healing = true;
              ensureProfile(fbUser.uid, fbUser.email ?? '', fbUser.displayName ?? 'Me')
                .catch((e) => __DEV__ && console.warn('[auth] ensureProfile failed:', e.message))
                .finally(() => {
                  healing = false;
                });
            }
            setProfile(null);
            setStatus('loading');
            return;
          }

          const profile = { ...snap.data(), uid: snap.id } as UserProfile;
          setProfile(profile);

          // (Re)wire the couple listener to the current coupleId.
          unsubCouple?.();
          unsubCouple = null;
          if (!profile?.coupleId) {
            setStatus('needsPartner');
            return;
          }
          // Resolve status OPTIMISTICALLY the moment we have a profile + couple
          // id. Being authenticated must always get us off the sign-in screen —
          // the couple listener below only REFINES this (→ needsPartner if the
          // couple turns out to be gone). Previously status stayed 'loading'
          // until the couple read returned, so any couple error stranded the
          // user on sign-in.
          setStatus('ready');
          unsubCouple = onSnapshot(
            doc(db, 'couples', profile.coupleId),
            (cs) => {
              // The couple was deleted (partner ran "Remove partner"). Clean up
              // our own side (rules only let us reset our own doc + RTDB) and
              // return to the link screen.
              if (!cs.exists()) {
                coupleRepository.leaveDissolvedCouple(profile.coupleId!, fbUser.uid).catch(() => {});
                setCouple(null);
                setStatus('needsPartner');
                return;
              }

              const couple = { id: cs.id, ...cs.data() } as Couple;
              setCouple(couple);

              // Self-heal partnerId on our OWN doc once both partners are linked.
              // (joinByCode can't write the partner's doc, so each side does this.)
              if (couple.memberIds.length === 2) {
                const other = couple.memberIds.find((id) => id !== fbUser.uid) ?? null;
                if (other && profile.partnerId !== other) {
                  updateDoc(doc(db, 'users', fbUser.uid), { partnerId: other }).catch(
                    (e) => __DEV__ && console.warn('[auth] partnerId heal failed:', e.message),
                  );
                }
              }
              // A couple exists (1 or 2 members) → enter the app.
              setStatus('ready');
            },
            (e) => {
              // Reading a now-deleted couple is denied — treat as dissolved and
              // clean up our side so a reload after the partner unlinked recovers.
              if ((e as { code?: string }).code === 'permission-denied' && profile.coupleId) {
                coupleRepository.leaveDissolvedCouple(profile.coupleId, fbUser.uid).catch(() => {});
                setCouple(null);
                setStatus('needsPartner');
              } else if (__DEV__) {
                console.warn('[auth] couple listener error:', e.message);
              }
            },
          );
        },
        (e) => {
          if (__DEV__) console.warn('[auth] profile listener error:', e.message);
        },
      );
    });

    return () => {
      clearDocs();
      unsubAuth();
    };
  }, [reset, setCouple, setProfile, setStatus]);
}
