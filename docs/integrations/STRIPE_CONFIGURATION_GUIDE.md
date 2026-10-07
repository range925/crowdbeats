# Crowdbeats V2 — Stripe Configuration & Webhook Guide

**Document Status:** Permanent Configuration Guide  
**Dashboard Route:** `/admin/integrations/stripe`  

---

## 1. Key Separation & Permissions
- **Publishable Key (`pk_test_...` / `pk_live_...`):** Provided to client web & mobile bundles. Only permitted to tokenize payment methods.
- **Restricted Server Key (`rk_test_...` / `rk_live_...`):** Stored exclusively in Google Cloud Secret Manager. Restricted only to `PaymentIntents:write`, `Transfers:write`, `Refunds:write`, `Accounts:read`.
- **Webhook Signing Secret (`whsec_...`):** Stored in Secret Manager. Used by Cloud Functions to cryptographically verify `Stripe-Signature` headers on raw incoming request bytes.

---

## 2. Idempotent Webhook Processing
- Webhook requests verify signatures against raw request buffers.
- Processed Stripe event IDs are persisted in `/processedWebhookEvents/{eventId}` within a Firestore transaction.
- Duplicate events return `200 OK` immediately without re-crediting creator balances or writing duplicate ledger rows.
