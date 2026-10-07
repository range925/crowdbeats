# Crowdbeats V2 — Onboarding Schema Migration Plan

---

## 1. Schema Versioning
- **Active Schema Version:** `2.0.0`
- **Legacy Invariant Handling:**
  - Existing users without `onboardingStatus: 'completed'` will be routed to the universal wizard upon next authentication.
  - Existing completed users maintain their existing persona without disruption.
  - Multi-persona array `activePersonas: ['fan', 'artist']` is backfilled automatically upon first persona switch.
