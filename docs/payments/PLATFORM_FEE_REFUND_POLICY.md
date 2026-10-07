# Crowdbeats V2 — Platform Fee Refund & Reversal Policy

**Document Status:** Permanent Operations Specification  

---

## 1. Refund Rules by Charge Type

1. **Destination Charges (Live Tips):**
   - Full refund within 24 hours reverses the creator transfer (`reverse_transfer=true`) and refunds the Stripe application fee (`refund_application_fee=true`).
   - For partial refunds, the platform fee is refunded proportionally using integer minor unit math.
2. **Separate Charges & Transfers (Band Splits):**
   - Refunds execute transfer reversals against all member accounts according to their original basis-point split ratio.
   - Retained platform fees are credited back to the fan proportionally.
