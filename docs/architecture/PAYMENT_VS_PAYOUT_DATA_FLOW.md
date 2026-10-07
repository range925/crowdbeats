# CROWDBEATS V2 — PAYMENT VS. PAYOUT DATA FLOW

```mermaid
flowchart TD
    subgraph INFLOW["FAN PAYMENT (INFLOW)"]
        FanClient["Fan Mobile / Web App"] -->|1. Request Tip Intent| CreateTip["createTipIntent (Cloud Function)"]
        CreateTip -->|2. Eligibility Check| Gate["assertCreatorMayMonetize()"]
        Gate -->|3. Create PaymentIntent| StripeAPI["Stripe API"]
        StripeAPI -->|4. Return client_secret| FanClient
        FanClient -->|5. Confirm Payment (Stripe Elements)| StripeGateway["Stripe Processing"]
        StripeGateway -->|6. Webhook: payment_intent.succeeded| WebhookHandler["stripeWebhook (Cloud Function)"]
        WebhookHandler -->|7. Write Debit & Credit| Subledger["/paymentLedger & /tips"]
    end

    subgraph OUTFLOW["CREATOR PAYOUT (OUTFLOW)"]
        CreatorClient["Musician / Band Manager"] -->|1. Request Payout| RequestPayout["requestPayout (Cloud Function)"]
        RequestPayout -->|2. Verify Balance & Holds| PayoutHoldCheck["payoutHoldService & Balances"]
        PayoutHoldCheck -->|3. Initiate Stripe Payout| StripeConnectAPI["Stripe Connect API"]
        StripeConnectAPI -->|4. Return Payout Object| RequestPayout
        StripeGateway -->|5. Webhook: payout.paid / payout.failed| WebhookHandler
        WebhookHandler -->|6. Update Status & Ledger| Subledger
    end
```
