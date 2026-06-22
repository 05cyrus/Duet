import { addDoc, doc, limit, orderBy, updateDoc } from 'firebase/firestore';
import {
  get as rtdbGet,
  push,
  ref as rtdbRef,
  remove as rtdbRemove,
  set as rtdbSet,
} from 'firebase/database';
import { FirestoreRepository, Unsubscribe } from '@/core/data/Repository';
import { makeConverter } from '@/core/data/converters';
import { rtdb } from '@/core/firebase/client';
import type { ChatMessage } from '@/types/models';

const converter = makeConverter<ChatMessage>(['createdAt']);

/** Default lifetime a snap stays open after the recipient first views it. */
export const DEFAULT_SNAP_VIEW_SECONDS = 5;

/**
 * Couple chat storage (cost-optimized, ₹0):
 *  - Messages live under `couples/{coupleId}/messages` in Firestore, one doc
 *    per message, read through ONE live listener on the most recent N.
 *  - Snap PHOTOS are stored as base64 in Realtime Database under
 *    `snaps/{coupleId}/{snapId}` — NOT in Firestore. This keeps the chat stream
 *    light (the listener never downloads image bytes), avoids Cloud Storage
 *    (which now requires the paid Blaze plan), and stays on the free Spark
 *    tier. The recipient fetches the image only when opening the snap, and it's
 *    deleted right after — so stored bytes and bandwidth stay near zero.
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
   * Post an instant snap: stash the base64 image in RTDB, then write a light
   * Firestore message pointing at it. Unopened until the recipient views it.
   */
  async sendSnap(
    senderId: string,
    base64: string,
    opts: { caption?: string; viewSeconds?: number } = {},
  ): Promise<void> {
    const snapRef = push(rtdbRef(rtdb, `snaps/${this.coupleId}`));
    const snapId = snapRef.key as string;
    await rtdbSet(snapRef, base64);

    await addDoc(this.col(), {
      coupleId: this.coupleId,
      senderId,
      kind: 'snap',
      text: opts.caption ?? '',
      snap: {
        snapId,
        viewSeconds: opts.viewSeconds ?? DEFAULT_SNAP_VIEW_SECONDS,
        viewedAt: null,
        reaction: null,
      },
    } as unknown as ChatMessage);
  }

  /** Fetch a snap's base64 image at view time. Null if it's already gone. */
  async loadSnapImage(snapId: string): Promise<string | null> {
    const snap = await rtdbGet(rtdbRef(rtdb, `snaps/${this.coupleId}/${snapId}`));
    return snap.exists() ? (snap.val() as string) : null;
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

  /** Delete the ephemeral image once the snap has been viewed/expired. */
  async deleteSnapImage(snapId: string): Promise<void> {
    try {
      await rtdbRemove(rtdbRef(rtdb, `snaps/${this.coupleId}/${snapId}`));
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
