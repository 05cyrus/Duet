import { addDoc, doc, limit, orderBy, updateDoc } from 'firebase/firestore';
import {
  deleteObject,
  getDownloadURL,
  ref as storageRef,
  uploadBytes,
} from 'firebase/storage';
import { FirestoreRepository, Unsubscribe } from '@/core/data/Repository';
import { makeConverter } from '@/core/data/converters';
import { storage } from '@/core/firebase/client';
import type { ChatMessage } from '@/types/models';

const converter = makeConverter<ChatMessage>(['createdAt']);

/** Default lifetime a snap stays open after the recipient first views it. */
export const DEFAULT_SNAP_VIEW_SECONDS = 5;

/**
 * Read a local file URI into a real React Native Blob via XMLHttpRequest. This
 * is the one upload path that works in Expo: `fetch().blob()` + `uploadBytes`
 * and `uploadString('base64')` both end up asking RN to build a Blob from an
 * ArrayBuffer, which it doesn't support ("Creating blobs from 'ArrayBuffer'…").
 * The XHR-produced blob is native-backed, so Firebase uploads it directly.
 */
function uriToBlob(uri: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Could not read the captured photo.'));
    xhr.responseType = 'blob';
    xhr.open('GET', uri, true);
    xhr.send(null);
  });
}

/**
 * Couple chat storage (cost-optimized):
 *  - Messages live under `couples/{coupleId}/messages`, one doc per message.
 *  - Reads happen through ONE live listener on the most recent N messages, so
 *    chatting for two people is a trickle of tiny writes + a single open
 *    subscription — well inside the Firebase Spark free tier.
 *  - Snap photos upload to `couples/{coupleId}/snaps/**`; the recipient deletes
 *    the object after viewing so expiring photos don't accrue Storage quota.
 */
export class ChatRepository extends FirestoreRepository<ChatMessage> {
  constructor(private readonly coupleId: string) {
    super(`couples/${coupleId}/messages`, converter);
  }

  /** Append a text message. `createdAt` is stamped server-side by the converter. */
  async send(senderId: string, text: string): Promise<void> {
    await addDoc(this.col(), {
      coupleId: this.coupleId,
      senderId,
      kind: 'text',
      text,
      snap: null,
    } as unknown as ChatMessage);
  }

  /**
   * Upload a captured photo (local file URI) and post it as an instant snap.
   * The snap is unopened until the recipient views it.
   */
  async sendSnap(
    senderId: string,
    localUri: string,
    opts: { caption?: string; viewSeconds?: number } = {},
  ): Promise<void> {
    const path = `couples/${this.coupleId}/snaps/${senderId}_${Date.now()}.jpg`;
    const blob = await uriToBlob(localUri);
    try {
      await uploadBytes(storageRef(storage, path), blob, { contentType: 'image/jpeg' });
    } finally {
      // RN blobs hold a native allocation until closed.
      (blob as { close?: () => void }).close?.();
    }

    await addDoc(this.col(), {
      coupleId: this.coupleId,
      senderId,
      kind: 'snap',
      text: opts.caption ?? '',
      snap: {
        media: { storagePath: path, kind: 'image' },
        viewSeconds: opts.viewSeconds ?? DEFAULT_SNAP_VIEW_SECONDS,
        viewedAt: null,
        reaction: null,
      },
    } as unknown as ChatMessage);
  }

  /** Resolve a Storage path to a temporary download URL (recipient-only fetch). */
  resolveUrl(storagePath: string): Promise<string> {
    return getDownloadURL(storageRef(storage, storagePath));
  }

  /**
   * Mark a snap opened (view receipt). Stored as a client epoch — kept a plain
   * number so it survives the converter, which only maps top-level timestamps.
   */
  async markViewed(messageId: string): Promise<void> {
    await updateDoc(doc(this.db, this.path, messageId), { 'snap.viewedAt': Date.now() });
  }

  /** Recipient reacts to a snap with an emoji. */
  async reactToSnap(messageId: string, reaction: string): Promise<void> {
    await updateDoc(doc(this.db, this.path, messageId), { 'snap.reaction': reaction });
  }

  /** Best-effort delete of the snap's Storage object once it has expired. */
  async deleteSnapMedia(storagePath: string): Promise<void> {
    try {
      await deleteObject(storageRef(storage, storagePath));
    } catch {
      // Already gone, or a transient error — harmless; the view lock already
      // makes the snap unreachable in the UI.
    }
  }

  /**
   * Live subscription to the most recent messages, newest-first (ready to feed
   * an inverted FlatList). `max` caps both the listener payload and read cost.
   */
  subscribeRecent(
    onChange: (messages: ChatMessage[]) => void,
    onError?: (e: Error) => void,
    max = 50,
  ): Unsubscribe {
    return this.subscribe(onChange, onError, orderBy('createdAt', 'desc'), limit(max));
  }
}
