# Database Schema

Two databases, by data temperature:
- **Firestore** = durable, structured, rule-protected (profiles, content, AI results).
- **Realtime Database (RTDB)** = ephemeral, high-frequency, overwrite-in-place (location, presence, taps).

Everything couple-scoped carries `coupleId`; rules enforce membership.

## Firestore collections

```
users/{uid}                                 UserProfile
couples/{coupleId}                          Couple
invites/{code}                              CoupleInvite          (6-char code = doc id)

couples/{coupleId}/moods/{moodId}           MoodEntry             (history; current lives in RTDB)
couples/{coupleId}/geofences/{id}           Geofence
couples/{coupleId}/capsules/{id}            LoveCapsule           (bodyCipher; server unlocks)
couples/{coupleId}/posts/{postId}           Post
couples/{coupleId}/posts/{postId}/comments/{id}   Comment
couples/{coupleId}/snaps/{id}               InstantSnap          (instant camera; TTL cleanup)
couples/{coupleId}/bereal/{yyyy-mm-dd}      BeRealRound
couples/{coupleId}/meta/berealStreak        BeRealStreak
couples/{coupleId}/wheelSpins/{id}          WheelSpin
couples/{coupleId}/fantasies/{id}           FantasyItem
couples/{coupleId}/mediations/{id}          MediationCase + MediationResult
couples/{coupleId}/letters/{id}             LoveLetter
couples/{coupleId}/meta/health              HealthSnapshot
couples/{coupleId}/radars/{uid}             PersonalityRadar
couples/{coupleId}/loveLanguages/{uid}      LoveLanguageProfile
couples/{coupleId}/compatibility/{uid}      CompatibilityProfile
couples/{coupleId}/timeline/{id}            TimelineEvent
couples/{coupleId}/taps/{uid}_{yyyy-mm-dd}  TapCounters           (daily rollup from RTDB)
couples/{coupleId}/dreamPins/{id}           DreamPin
couples/{coupleId}/dreamCollections/{id}    DreamCollection
couples/{coupleId}/games/{sessionId}        GameSession

gameContent/cards/{id}                      ChallengeCard         (global, read-only to clients)
gameContent/questions/{id}                  GameQuestion          (global, read-only)
wheelRewards/{id}                           WheelReward           (global, read-only)
```

**Read-cost notes:** subcollections under `couples/{coupleId}` let us attach a single listener per feature scoped to the couple. Global `gameContent` is read-only and also bundled in-app (`assets/content/*.json`) so the app rarely reads it.

## Realtime Database tree

```
/presence/{uid}                 { online: bool, lastSeen: ts }      # onDisconnect-managed
/location/{coupleId}/{uid}      LivePosition                        # overwrite each update
/mood/{coupleId}/{uid}          { mood, note, at }                  # current mood, instant
/heartbeat/{coupleId}/{uid}     { total, today, lastAt }            # incremented per tap
/missingYou/{coupleId}/{uid}    { total, today, lastAt }
/audioSignal/{coupleId}/{sessionId}   { offer, answer, ice: [...] } # WebRTC signaling, TTL
/typing/{coupleId}/{uid}        bool
```

RTDB nodes are **overwritten**, so stored size is ~`2 users × small object` ≈ a few KB. Downloads are the only metered axis and stay far under 10 GiB/mo.

## Firestore composite indexes

See `firebase/firestore.indexes.json`. Needed for: posts by `createdAt desc`, moods by `createdAt desc`, timeline by `date desc`, fantasies by `tag` (match queries).
