# CROWDBEATS V2 — FINANCIAL SUBLEDGER & RECONCILIATION DESIGN

---

## 1. Append-Only Operational Subledger Schema
Every financial mutation produces matching double-entry style records in `/paymentLedger/{ledgerId}`:
- `ledgerId`: Unique UUID.
- `transactionType`: `TIP_CHARGE`, `PLATFORM_FEE`, `STRIPE_FEE`, `PAYOUT`, `REFUND`, `DISPUTE_HOLD`, `ADJUSTMENT`.
- `entryType`: `DEBIT` or `CREDIT`.
- `entityType`: `FAN`, `ARTIST`, `BAND`, `PLATFORM`, `STRIPE`.
- `entityId`: User UID or Band ID.
- `amountCents`: Integer minor units (e.g. 500 = $5.00).
- `currency`: ISO 4217 code (`USD`, `EUR`, `GBP`).
- `paymentIntentId` / `payoutId`: External Stripe reference.
- `createdAt`: Server timestamp.

---

## 2. Daily Automated Reconciliation Algorithm
1. **Fetch Internal Totals:** Aggregate all subledger credits, debits, refunds, and fees for the target 24-hour UTC window.
2. **Fetch Stripe Balance Transactions:** Query Stripe `/v1/balance_transactions` for the matching window.
3. **Compare Line-by-Line:** Match by `source` (PaymentIntent, Charge, Payout, Refund ID).
4. **Flag Mismatches:** If gross or fee amounts differ, record an item in `/reconciliationExceptions/{exceptionId}` without modifying the original subledger entry.
5. **Audited Adjustment:** Correcting a discrepancy requires an explicit `ADJUSTMENT` ledger entry executed by authorized finance staff with step-up MFA.
