# Crowdbeats V2 — Children’s Online Privacy & Age Eligibility Policy

**Document Status:** Permanent Safety Policy  
**Statutory Basis:** 15 U.S.C. §§ 6501–6506 (COPPA), California Age-Appropriate Design Code Act (AB 2273)  

---

## 1. Age Eligibility Invariants

1. **Adult Eligibility Gate (18+):**
   - Financial features (sending tips, receiving payouts, crowdfunding campaigns, Stripe Express registration) are strictly limited to legal adults aged 18 or older.
2. **Onboarding Gate:**
   - All users must affirmatively accept the 18+ age eligibility confirmation during onboarding (`apps/mobile/lib/ui/onboarding/consent_screen.dart`).
3. **No Minor Data Harvesting:**
   - Crowdbeats **does not solicit, collect, or store dates of birth** from standard fans.
   - Crowdbeats **does not perform automated facial or photo age-estimation algorithms**.
4. **COPPA Safe Harbor Protocol:**
   - If Crowdbeats obtains actual knowledge that an account belongs to a child under 13, the account is immediately terminated and all associated PII is permanently purged from active databases.
