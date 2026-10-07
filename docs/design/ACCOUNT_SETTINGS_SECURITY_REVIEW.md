# Crowdbeats V2 — Account Settings Security & Privacy Review

**Audit Date:** August 29, 2026  
**Security Rating Target:** 5/5 (Zero Trust & Privacy By Design)  

---

## 1. Security & Authorization Invariants

1. **Server-Authoritative Role & Claim Enforcement:**
   - Client applications never write directly to custom claims, verified badges, monetization status, or platform roles.
   - Persona switching changes the user's active client perspective, but server-side authorization checks query Firestore ownership records (`artistProfiles/{uid}`, `bands/{bandId}/members/{uid}`) before executing any privileged mutation.

2. **PCI-DSS Compliance (Zero Raw Financial Storage):**
   - No raw Primary Account Numbers (PAN), CVV/CVC, or magnetic stripe data is ever stored in Firestore, cached on mobile devices, or sent to Crowdbeats backend servers.
   - Payment method entry utilizes Stripe SDK (PaymentSheet / Elements) directly communicating with `api.stripe.com`.
   - Firestore stores only Stripe Customer IDs (`cus_...`), SetupIntent references, and safe display metadata (`brand`, `last4`, `exp_month`, `exp_year`).

3. **Stripe Connect & Payout Security:**
   - Solo musicians and band founders manage bank routing and identity documentation via Stripe Express Onboarding hosted flows (`createConnectLink`).
   - Payout requests (`requestPayout`) enforce minimum withdrawal thresholds ($10.00 / 1000 cents), check for active dispute/compliance holds (`payoutHolds`), and execute idempotently.

4. **Re-Authentication for Sensitive Account Mutations:**
   - Password changes, email updates, and account deletion require recent user authentication within the last 5 minutes.
   - If the Firebase Auth token is stale (`auth/requires-recent-login`), the UI prompts for password confirmation or re-authentication with Google/Apple before proceeding.

5. **GDPR / CCPA Data Export & Deletion Cascade:**
   - **Data Export (`requestPrivacyExport`):** Rate-limited to 1 request per 48 hours. Generates an encrypted archive of user profile data, tipping logs, and followed artists without exposing internal fraud scores.
   - **Account Deletion Safeguards:**
     - Checks if user is the sole `BAND_FOUNDER` of an active band (requires ownership transfer first).
     - Checks if user has pending payout balances or open customer disputes.
     - Performs a server-authoritative soft-delete (`deletedAt: serverTimestamp()`), revokes all active auth refresh tokens, and retains required financial ledger records for statutory 7-year anti-money-laundering (AML) retention.

6. **Log Redaction & Analytics Privacy:**
   - Privacy-reviewed event telemetry (`account_settings_opened`, `active_persona_changed`, `preference_updated`) logs only opaque, randomized IDs.
   - PII (emails, phone numbers, real names, card numbers, precise live GPS coordinates) is strictly excluded from analytics pipelines.
