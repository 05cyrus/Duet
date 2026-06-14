import { FirestoreRepository } from '@/core/data/Repository';
import { makeConverter } from '@/core/data/converters';
import type { UserProfile } from '@/types/models';

class UserRepository extends FirestoreRepository<UserProfile> {
  constructor() {
    super('users', makeConverter<UserProfile>(['createdAt', 'updatedAt']));
  }
}

export const userRepository = new UserRepository();
