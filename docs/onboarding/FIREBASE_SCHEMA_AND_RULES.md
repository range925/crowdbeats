# Crowdbeats V2 — Firebase Schema & Security Rules Specification

---

## 1. Firestore Collections & Access Rules

1. `/onboardingDrafts/{uid}`:
   - Read/Write: Caller UID == doc UID.
   - Purpose: Store transient in-progress onboarding state.
2. `/users/{uid}`:
   - Read: Public for non-sensitive fields; Private for identity fields.
   - Write: Server-only via `completeUniversalOnboarding` or authenticated user updates to allowed profile fields.
3. `/artistProfiles/{uid}`:
   - Read: Public.
   - Write: Server-only / verified creator.
4. `/bands/{bandId}`:
   - Read: Public.
   - Write: Band members only.
5. `/sponsorProfiles/{uid}`:
   - Read: Public.
   - Write: Verified sponsor representative.
6. `/handles/{handle}`:
   - Read: Public.
   - Write: Server-only race-safe reservation.
7. `/auditEvents/{eventId}`:
   - Read: Admin only.
   - Write: Server-only (Append-only immutable ledger).
