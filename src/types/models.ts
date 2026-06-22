/**
 * Duet — shared domain models.
 *
 * These are the canonical entities persisted in Firebase. Timestamps are stored
 * as epoch milliseconds (number) at the domain layer; repositories convert
 * to/from Firestore `Timestamp` at the data boundary so the rest of the app
 * stays serializable and test-friendly.
 */

export type ID = string;
export type Millis = number;
export type ISODate = string;

/* ────────────────────────────── Identity ────────────────────────────── */

export type RelationshipStatus =
  | 'dating'
  | 'engaged'
  | 'married'
  | 'long_distance'
  | 'complicated';

export interface UserPreferences {
  themeMode: 'system' | 'light' | 'dark';
  notifications: {
    location: boolean;
    mood: boolean;
    heartbeat: boolean;
    bereal: boolean;
    capsules: boolean;
  };
  locationSharing: 'on' | 'paused';
  language: string; // BCP-47
}

export interface UserProfile {
  uid: ID;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  birthday: ISODate | null;
  partnerId: ID | null;
  coupleId: ID | null;
  pushTokens: string[]; // FCM device tokens
  preferences: UserPreferences;
  createdAt: Millis;
  updatedAt: Millis;
}

/** The single relationship doc that both partners share. */
export interface Couple {
  id: ID;
  memberIds: [ID, ID] | [ID]; // [ID] while pending second partner
  status: RelationshipStatus;
  anniversary: ISODate | null;
  inviteCode: string | null; // active invite code, null once linked
  createdAt: Millis;
  // denormalized for cheap reads
  members: Record<ID, { displayName: string; avatarUrl: string | null }>;
}

export interface CoupleInvite {
  code: string; // 6-char, doc id
  coupleId: ID;
  createdBy: ID;
  expiresAt: Millis;
  consumed: boolean;
}

/* ─────────────────────────── F1 Location ─────────────────────────── */

export interface LivePosition {
  latitude: number;
  longitude: number;
  timestamp: Millis;
  batteryPercentage: number; // 0..1
  isCharging: boolean;
  speed: number | null; // m/s
  accuracy: number | null;
}

export type GeofenceKind = 'home' | 'office' | 'gym' | 'custom';

export interface Geofence {
  id: ID;
  coupleId: ID;
  ownerId: ID; // whose place it is
  kind: GeofenceKind;
  label: string;
  latitude: number;
  longitude: number;
  radiusM: number; // meters
  notifyOnArrive: boolean;
  notifyOnLeave: boolean;
}

export interface EtaEstimate {
  distanceM: number;
  drivingSeconds: number;
  walkingSeconds: number;
  computedAt: Millis;
}

/* ───────────────────────────── F2 Mood ───────────────────────────── */

export type MoodKey =
  | 'happy'
  | 'sad'
  | 'sleepy'
  | 'angry'
  | 'need_attention'
  | 'missing_you';

export interface MoodEntry {
  id: ID;
  coupleId: ID;
  userId: ID;
  mood: MoodKey;
  note: string | null;
  createdAt: Millis;
}

/* ──────────────────────────── F3 Capsules ─────────────────────────── */

export type CapsuleUnlock =
  | { type: 'tomorrow' }
  | { type: 'next_week' }
  | { type: 'anniversary' }
  | { type: 'birthday' }
  | { type: 'custom'; date: ISODate };

export interface LoveCapsule {
  id: ID;
  coupleId: ID;
  authorId: ID;
  recipientId: ID;
  /** Ciphertext while locked; plaintext only released by server at unlock. */
  bodyCipher: string;
  mediaRefs: MediaRef[];
  unlockAt: Millis;
  unlocked: boolean;
  createdAt: Millis;
}

export interface MediaRef {
  storagePath: string;
  kind: 'image' | 'video' | 'audio';
  width?: number;
  height?: number;
  durationMs?: number;
}

/* ───────────────────────── F4 Feed / F5 Camera ────────────────────── */

export interface Post {
  id: ID;
  coupleId: ID;
  authorId: ID;
  caption: string | null;
  media: MediaRef[];
  reactions: Record<ID, string>; // userId -> emoji
  commentCount: number;
  createdAt: Millis;
}

export interface Comment {
  id: ID;
  postId: ID;
  authorId: ID;
  text: string;
  createdAt: Millis;
}

export interface InstantSnap {
  id: ID;
  coupleId: ID;
  authorId: ID;
  media: MediaRef;
  expiresAt: Millis | null; // null = permanent
  viewedAt: Millis | null; // view receipt
  reaction: string | null;
  screenshotByPartner: boolean;
  createdAt: Millis;
}

/* ─────────────────────────────── Chat ─────────────────────────────── */

export type ChatMessageKind = 'text' | 'snap';

/**
 * An "instant snap" sent inside chat: an expiring photo with a view receipt
 * and an optional reaction. Ephemerality is enforced on the recipient side —
 * once `viewedAt` is set the snap can't be reopened, and the recipient
 * best-effort deletes the Storage object after viewing (Storage rules allow a
 * signed-in member to delete under their couple path).
 */
export interface ChatSnap {
  /**
   * Key under RTDB `snaps/{coupleId}` holding the ephemeral base64 image. The
   * image is NOT stored in the Firestore message (keeps the chat stream light
   * and free); the recipient fetches it on open and it's deleted after viewing.
   */
  snapId: string;
  /** Seconds the snap stays open after the recipient first views it. */
  viewSeconds: number;
  /** When the recipient first opened it (view receipt). Null until opened. */
  viewedAt: Millis | null;
  /** Recipient's emoji reaction, if any. */
  reaction: string | null;
}

/**
 * A single message in the couple's private chat space. Stored under
 * `couples/{coupleId}/messages`. Kept deliberately small: free chatting for
 * two people is a handful of tiny writes and a single live listener, so it
 * stays comfortably inside the Firebase Spark free tier.
 */
export interface ChatMessage {
  id: ID;
  coupleId: ID;
  senderId: ID;
  kind: ChatMessageKind;
  /** Body for `text` messages; optional caption for `snap` messages. */
  text: string;
  /** Present only when `kind === 'snap'`. */
  snap: ChatSnap | null;
  createdAt: Millis;
}

/* ───────────────────────────── F6 BeReal ──────────────────────────── */

export interface BeRealRound {
  id: ID; // yyyy-mm-dd
  coupleId: ID;
  promptAt: Millis;
  responses: Record<ID, { media: MediaRef; postedAt: Millis; late: boolean }>;
  completed: boolean;
}

export interface BeRealStreak {
  coupleId: ID;
  current: number;
  longest: number;
  lastCompletedDate: ISODate | null;
}

/* ─────────────────────── F7 Cards / F17 Games ─────────────────────── */

export type CardCategory = 'cute' | 'romantic' | 'spicy' | 'wild';
export type CardType =
  | 'kiss'
  | 'truth'
  | 'dare'
  | 'fantasy'
  | 'romantic_challenge';

export interface ChallengeCard {
  id: ID;
  category: CardCategory;
  type: CardType;
  text: string;
  enabled: boolean;
}

export type GameKind =
  | 'this_or_that'
  | 'who_knows_me'
  | 'trivia'
  | 'never_have_i_ever'
  | 'future_planning';

export interface GameQuestion {
  id: ID;
  game: GameKind;
  prompt: string;
  options?: string[];
  category?: string;
}

export interface GameSession {
  id: ID;
  coupleId: ID;
  game: GameKind;
  answers: Record<ID, Record<ID, string>>; // userId -> questionId -> answer
  overlapPct: number | null;
  createdAt: Millis;
  completedAt: Millis | null;
}

/* ───────────────────────────── F8 Wheel ───────────────────────────── */

export interface WheelReward {
  id: ID;
  label: string;
  emoji: string;
  weight: number;
}

export interface WheelSpin {
  id: ID;
  coupleId: ID;
  spinnerId: ID;
  rewardId: ID;
  rewardLabel: string;
  createdAt: Millis;
  fulfilled: boolean;
}

/* ──────────────────────────── F9 Fantasy ──────────────────────────── */

export interface FantasyItem {
  id: ID;
  coupleId: ID;
  ownerId: ID;
  tag: string; // canonical tag used for matching
  text: string;
  private: boolean;
  matched: boolean; // true once both partners share the tag
  createdAt: Millis;
}

/* ─────────────────── F10 Mediator / F12 Letters (AI) ──────────────── */

export interface MediationCase {
  id: ID;
  coupleId: ID;
  perspectives: Partial<Record<ID, string>>; // each partner's submission
  result: MediationResult | null;
  status: 'awaiting_partner' | 'ready' | 'processing' | 'done' | 'failed';
  createdAt: Millis;
}

export interface MediationResult {
  userSummary: string;
  partnerSummary: string;
  misunderstandings: string[];
  emotionalNeeds: { userId: ID; needs: string[] }[];
  commonGround: string[];
  fairSolution: string;
  actionItems: string[];
  provider: string; // which AI provider produced this (or "offline")
}

export type LetterStyle =
  | 'romantic'
  | 'cute'
  | 'anniversary'
  | 'long_distance'
  | 'appreciation';

export interface LoveLetter {
  id: ID;
  coupleId: ID;
  authorId: ID;
  style: LetterStyle;
  body: string;
  provider: string;
  createdAt: Millis;
}

/* ─────────── F11 Health / F13 Radar / F14 Compat / F15 LL ─────────── */

export type HealthFactor =
  | 'communication'
  | 'affection'
  | 'time_together'
  | 'conflict_frequency'
  | 'trust'
  | 'support';

export interface HealthSnapshot {
  coupleId: ID;
  factors: Record<HealthFactor, number>; // 0..100 trend value (NOT a verdict score)
  strengths: string[];
  suggestions: string[];
  computedAt: Millis;
}

export type RadarTrait =
  | 'affection'
  | 'communication'
  | 'humor'
  | 'adventure'
  | 'romance'
  | 'spontaneity'
  | 'emotional_openness';

export interface PersonalityRadar {
  userId: ID;
  coupleId: ID;
  traits: Record<RadarTrait, number>; // 0..100
  updatedAt: Millis;
}

export type LoveLanguage =
  | 'words_of_affirmation'
  | 'acts_of_service'
  | 'gifts'
  | 'physical_touch'
  | 'quality_time';

export interface LoveLanguageProfile {
  userId: ID;
  coupleId: ID;
  scores: Record<LoveLanguage, number>; // dynamic, sums tracked
  updatedAt: Millis;
}

export type ConflictStyle =
  | 'avoidant'
  | 'competitive'
  | 'collaborative'
  | 'accommodating'
  | 'compromising';

export interface CompatibilityProfile {
  userId: ID;
  coupleId: ID;
  quizAnswers: Record<ID, string>;
  loveLanguages: LoveLanguage[];
  conflictStyle: ConflictStyle | null;
  updatedAt: Millis;
}

/* ──────────────────────────── F16 Timeline ────────────────────────── */

export type TimelineKind =
  | 'first_chat'
  | 'first_date'
  | 'first_trip'
  | 'first_gift'
  | 'anniversary'
  | 'custom';

export interface TimelineEvent {
  id: ID;
  coupleId: ID;
  kind: TimelineKind;
  title: string;
  date: ISODate;
  note: string | null;
  media: MediaRef[];
  createdAt: Millis;
}

/* ──────────────── F19 Heartbeat / F20 Missing-You ─────────────────── */

export interface TapCounters {
  coupleId: ID;
  userId: ID;
  date: ISODate; // daily rollup doc id
  heartbeats: number;
  missingYou: number;
}

/* ─────────────────────────── F21 Dream Board ──────────────────────── */

export type DreamCategory =
  | 'house'
  | 'travel'
  | 'wedding'
  | 'goals'
  | 'family';

export interface DreamPin {
  id: ID;
  coupleId: ID;
  authorId: ID;
  category: DreamCategory;
  collectionId: ID | null;
  imageUrl: string | null; // external url (0 storage) or storage path
  storagePath: string | null;
  note: string | null;
  reactions: Record<ID, string>;
  createdAt: Millis;
}

export interface DreamCollection {
  id: ID;
  coupleId: ID;
  name: string;
  category: DreamCategory;
  coverPinId: ID | null;
  createdAt: Millis;
}
