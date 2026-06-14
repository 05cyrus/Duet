import {
  FirestoreDataConverter,
  Timestamp,
  serverTimestamp,
  QueryDocumentSnapshot,
  WithFieldValue,
  DocumentData,
} from 'firebase/firestore';

/**
 * Build a converter that:
 *  - maps Firestore `Timestamp` fields → epoch millis (number) on read,
 *  - stamps the doc `id` from the snapshot,
 *  - leaves the rest of the domain object untouched.
 *
 * `timestampFields` lists the entity keys that are stored as Firestore
 * Timestamps so the domain layer can stay plain serializable numbers.
 */
export function makeConverter<T extends { id: string }>(
  timestampFields: (keyof T)[] = [],
): FirestoreDataConverter<T> {
  return {
    toFirestore(model: WithFieldValue<T>): DocumentData {
      const out: DocumentData = { ...(model as object) };
      delete out.id; // id is the doc key, not a field
      for (const f of timestampFields) {
        const v = out[f as string];
        if (typeof v === 'number') out[f as string] = Timestamp.fromMillis(v);
        if (v === undefined) out[f as string] = serverTimestamp();
      }
      return out;
    },
    fromFirestore(snap: QueryDocumentSnapshot): T {
      const data = snap.data();
      const out: DocumentData = { ...data, id: snap.id };
      for (const f of timestampFields) {
        const v = data[f as string];
        if (v instanceof Timestamp) out[f as string] = v.toMillis();
      }
      return out as T;
    },
  };
}
