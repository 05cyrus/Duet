import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  QueryConstraint,
  CollectionReference,
  DocumentData,
  Firestore,
  FirestoreDataConverter,
} from 'firebase/firestore';
import { db } from '@/core/firebase/client';

export type Unsubscribe = () => void;

/**
 * Generic Firestore repository. Every feature repo extends this so that the
 * ONLY place that talks to Firestore is the data layer. Centralizing here lets
 * us enforce read-cost discipline (subscribe-once, share) in one spot.
 *
 * `T` is the domain entity; converters map to/from Firestore documents.
 */
export abstract class FirestoreRepository<T extends { id: string }> {
  protected readonly db: Firestore = db;

  protected constructor(
    /** Absolute collection path, e.g. `couples/abc/moods`. */
    protected readonly path: string,
    protected readonly converter: FirestoreDataConverter<T>,
  ) {}

  protected col(): CollectionReference<T, DocumentData> {
    return collection(this.db, this.path).withConverter(this.converter);
  }

  async get(id: string): Promise<T | null> {
    const snap = await getDoc(doc(this.col(), id));
    return snap.exists() ? snap.data() : null;
  }

  async list(...constraints: QueryConstraint[]): Promise<T[]> {
    const snap = await getDocs(query(this.col(), ...constraints));
    return snap.docs.map((d) => d.data());
  }

  async upsert(entity: T): Promise<void> {
    await setDoc(doc(this.col(), entity.id), entity, { merge: true });
  }

  async update(id: string, patch: Partial<T>): Promise<void> {
    await updateDoc(doc(this.col(), id), patch as DocumentData);
  }

  async remove(id: string): Promise<void> {
    await deleteDoc(doc(this.col(), id));
  }

  /**
   * Live subscription. Prefer this over polling — a single open listener is far
   * cheaper than repeated reads and is how we stay deep inside the free quota.
   */
  subscribe(
    onChange: (items: T[]) => void,
    onError?: (e: Error) => void,
    ...constraints: QueryConstraint[]
  ): Unsubscribe {
    return onSnapshot(
      query(this.col(), ...constraints),
      (snap) => onChange(snap.docs.map((d) => d.data())),
      (err) => onError?.(err),
    );
  }

  subscribeDoc(
    id: string,
    onChange: (item: T | null) => void,
    onError?: (e: Error) => void,
  ): Unsubscribe {
    return onSnapshot(
      doc(this.col(), id),
      (snap) => onChange(snap.exists() ? snap.data() : null),
      (err) => onError?.(err),
    );
  }
}
