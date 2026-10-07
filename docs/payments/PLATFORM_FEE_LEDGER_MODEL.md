# Crowdbeats V2 — Append-Only Double-Entry Financial Ledger Model

**Document Status:** Permanent Ledger Architecture Specification  
**Collection:** `/paymentLedger`  

---

## 1. Ledger Entry Types & Flow

- `GROSS_PAYMENT_DEBIT`: Debits the payer's card for the full authorized tip amount.
- `PLATFORM_FEE_CREDIT`: Credits Crowdbeats LLC with the approved application fee.
- `CREATOR_TRANSFER_CREDIT`: Credits the performing creator's Connected Account with net proceeds.
- `BAND_MEMBER_SPLIT_CREDIT`: Credits individual member Connected Accounts via Largest Remainder.
- `FEE_REFUND_DEBIT`: Debits Crowdbeats platform fee revenue upon customer refund.
- `DISPUTE_HOLD_DEBIT`: Places temporary hold on creator balance during active chargeback dispute.
