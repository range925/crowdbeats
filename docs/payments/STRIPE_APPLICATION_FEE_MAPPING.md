# Crowdbeats V2 — Stripe Application Fee Webhook Mapping

**Document Status:** Permanent Webhook Architecture Specification  

---

## 1. Webhook Lifecycle Mapping

| Webhook Event | Stripe Payload Fields | Crowdbeats Internal Ledger Action | Reconciled Collection |
| :--- | :--- | :--- | :--- |
| `application_fee.created` | `id`, `amount`, `currency`, `charge`, `account` | Creates append-only `PLATFORM_FEE_CREDIT` ledger row | `/stripeApplicationFeeEvents` & `/paymentLedger` |
| `application_fee.refunded` | `id`, `amount`, `fee`, `currency` | Creates append-only `FEE_REFUND_DEBIT` ledger row | `/stripeApplicationFeeEvents` & `/paymentLedger` |
| `application_fee.refund.updated`| `id`, `status`, `amount` | Updates fee refund reconciliation status | `/stripeApplicationFeeEvents` |
| `transfer.created` | `id`, `amount`, `destination`, `source_transaction` | Records individual member disbursement | `/bandTransfers` & `/paymentLedger` |
| `transfer.reversed` | `id`, `amount`, `transfer` | Reverses band member split disbursement | `/bandTransfers` & `/paymentLedger` |
