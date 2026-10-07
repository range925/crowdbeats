# CROWDBEATS V2 — ADMIN MENU & PERMISSION MATRIX

---

## 1. 24 Finance Control Plane Sections

| # | Section Name | Route | Required Permission |
| :--- | :--- | :--- | :--- |
| 1 | Finance Command Center | `/admin/finance` | `finance.view_summary` |
| 2 | Gross Payment Volume | `/admin/finance/volume` | `finance.view_transactions` |
| 3 | Tips & Supporter Payments | `/admin/finance/tips` | `finance.view_transactions` |
| 4 | PaymentIntents & Charges | `/admin/finance/charges` | `finance.view_transactions` |
| 5 | Stripe Connected Accounts | `/admin/finance/connected-accounts` | `stripe.accounts.view` |
| 6 | Connected Account Requirements| `/admin/finance/requirements` | `stripe.accounts.view` |
| 7 | Musician & Band Balances | `/admin/finance/balances` | `finance.view_transactions` |
| 8 | Transfers & Band Splits | `/admin/finance/transfers` | `finance.view_transactions` |
| 9 | Payouts & Withdrawals | `/admin/finance/payouts` | `payouts.view` |
| 10| Payout Destinations | `/admin/finance/destinations` | `payouts.view` |
| 11| Crowdbeats Platform Fees | `/admin/finance/platform-fees` | `finance.view_summary` |
| 12| Stripe Processing Fees | `/admin/finance/stripe-fees` | `finance.view_summary` |
| 13| Refunds & Adjustments | `/admin/finance/refunds` | `refunds.create` |
| 14| Disputes & Evidence | `/admin/finance/disputes` | `finance.view_transactions` |
| 15| Failed & Canceled Payments | `/admin/finance/failed-payments` | `finance.view_transactions` |
| 16| Reserves & Payout Holds | `/admin/finance/holds` | `payouts.hold` |
| 17| Receipts & Documents | `/admin/finance/receipts` | `finance.view_transactions` |
| 18| Daily Reconciliation | `/admin/finance/reconciliation` | `finance.reconcile` |
| 19| Reconciliation Exceptions | `/admin/finance/exceptions` | `finance.adjust_ledger` |
| 20| Webhook Health & Dead-Letters | `/admin/finance/webhooks` | `finance.view_summary` |
| 21| Tax-Reporting Status | `/admin/finance/tax` | `finance.export` |
| 22| Financial Exports & Reports | `/admin/finance/exports` | `finance.export` |
| 23| Immutable Finance Audit Log | `/admin/finance/audit` | `audit.view` |
| 24| Configuration & Fee History | `/admin/finance/configuration` | `finance.reconcile` |
