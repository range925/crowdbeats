# Crowdbeats V2 — Privacy-Conscious Onboarding Analytics Event Dictionary

**Compliance Rule:** Never log email addresses, phone numbers, full names, precise GPS coordinates, or passwords.

---

## 1. Event Definitions

| Event Name | Trigger | Payload Properties | Privacy Safeguards |
| :--- | :--- | :--- | :--- |
| `onboarding_started` | User enters Step 0 | `{ source: 'web' | 'mobile', platform_version }` | No PII |
| `auth_method_selected` | User clicks OAuth or Email | `{ method: 'google' | 'apple' | 'email' }` | No email addresses |
| `legal_agreements_accepted` | User confirms ToS & Privacy | `{ tos_version: '2026-08-25', privacy_version: '2026-08-25', marketing_opt_in: boolean }` | Boolean flag only |
| `persona_selected` | User chooses primary role | `{ persona_type: 'fan' | 'artist' | 'band' | 'sponsor' }` | Role identifier only |
| `step_completed` | User finishes a step | `{ step_number: number, step_name: string, duration_seconds: number }` | Coarse duration |
| `onboarding_completed` | Profile finalization succeeds | `{ persona_type: string, total_time_seconds: number }` | Aggregated analytics |
