import { create } from 'zustand';
import type { UserProfile, Couple } from '@/types/models';

/**
 * Ephemeral session state (not persisted — rehydrated from Firebase on launch).
 * `status` drives the auth gate in app/_layout.tsx.
 */
type SessionStatus = 'loading' | 'signedOut' | 'needsPartner' | 'ready';

interface SessionState {
  status: SessionStatus;
  uid: string | null;
  profile: UserProfile | null;
  couple: Couple | null;
  setProfile: (profile: UserProfile | null) => void;
  setCouple: (couple: Couple | null) => void;
  setStatus: (status: SessionStatus) => void;
  reset: () => void;
}

export const useSession = create<SessionState>((set) => ({
  status: 'loading',
  uid: null,
  profile: null,
  couple: null,
  setProfile: (profile) => set({ profile, uid: profile?.uid ?? null }),
  setCouple: (couple) => set({ couple }),
  setStatus: (status) => set({ status }),
  reset: () => set({ status: 'signedOut', uid: null, profile: null, couple: null }),
}));

/** Convenience selector — the active coupleId or null if not linked. */
export function useCoupleId(): string | null {
  return useSession((s) => s.couple?.id ?? null);
}

/**
 * The partner's uid, DERIVED from the couple's memberIds (the member that
 * isn't me). This is robust: it's correct the moment the couple has two
 * members, independent of whether the stored `partnerId` field has synced.
 * Falls back to the stored profile.partnerId if the couple isn't loaded yet.
 */
export function usePartnerId(): string | null {
  return useSession((s) => {
    // Guard: without our own uid, "the member that isn't me" could wrongly
    // resolve to ourselves. Fall back to the stored partnerId until uid loads.
    if (!s.uid) return s.profile?.partnerId ?? null;
    const fromCouple = (s.couple?.memberIds ?? []).find((id) => id !== s.uid);
    return fromCouple ?? s.profile?.partnerId ?? null;
  });
}
