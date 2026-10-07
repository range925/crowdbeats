# Crowdbeats V2 — Privacy & Security Review Checklist

---

## 1. Security Invariants Verified

1. **Zero Fake Autofill:** No demographic, role, or contact data is fabricated or pre-populated.
2. **Server-Authoritative Onboarding:** Client applications cannot directly write to `/users/{uid}` privileged fields; all account activations occur via `completeUniversalOnboarding`.
3. **No Administrative Self-Selection:** Public onboarding strictly prevents selecting administrative or staff roles.
4. **Audit Trail:** Every completed onboarding generates an immutable record in `/auditEvents`.
