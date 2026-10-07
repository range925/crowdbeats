# CROWDBEATS V2 — STRIPE OBJECT & WEBHOOK EVENT MAPPING

| Stripe Webhook Event | Trigger / Context | Handler Function | Subledger & State Mutation |
| :--- | :--- | :--- | :--- |
| `payment_intent.succeeded` | Fan completes card/wallet tip | `webhookHandler.ts` | Updates tip status to `succeeded`; creates fan debit & creator credit in `/paymentLedger`. |
| `payment_intent.payment_failed` | Card declined or 3DS failure | `webhookHandler.ts` | Updates tip status to `failed`; logs error code. |
| `account.updated` | Connect Express KYC/status update | `connectWebhookHandlers.ts` | Synchronizes `chargesEnabled`, `payoutsEnabled`, `requirementsDue`. |
| `account.application.deauthorized`| Creator disconnects Stripe | `connectWebhookHandlers.ts` | Freezes monetization; sets `monetizationStatus: 'RESTRICTED'`. |
| `charge.dispute.created` | Cardholder opens chargeback | `connectWebhookHandlers.ts` | Applies automatic compliance payout hold (`reason: 'DISPUTE'`). |
| `charge.refunded` | Admin or fan refund processed | `connectWebhookHandlers.ts` | Writes reverse double-entry ledger rows; decrements net balance. |
| `payout.paid` | Bank transfer completes | `webhookHandler.ts` | Sets payout status to `paid`; records settled ledger entry. |
| `payout.failed` | Bank transfer rejected | `webhookHandler.ts` | Sets payout status to `failed`; restores available balance. |
| `customer.subscription.deleted` | Recurring fan patronage ends | `webhookHandler.ts` | Updates membership record. |
