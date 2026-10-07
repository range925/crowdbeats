# Crowdbeats V2 — Payments, Marketplace Architecture & Money Transmission Review

**Document Status:** Permanent Architecture Specification  
**Regulatory Review:** FinCEN MSB Regulations & State Money Transmitter Licensing (MTL)  

---

## 1. Non-Stored Value Wallet Architecture (Anti-Custody Invariant)

> [!IMPORTANT]
> **Core Financial Invariant:** Crowdbeats **is NOT a stored-value digital wallet**. Crowdbeats **never custodies, holds in escrow, or freely transmits user funds**. 

```mermaid
sequenceDiagram
    autonumber
    actor Fan as Fan App (Payer)
    participant Stripe as Stripe Gateway (PCI SAQ-A)
    participant Functions as Crowdbeats Cloud Functions
    participant Connect as Stripe Express Connect (Creator Bank)

    Fan->>Functions: createTipIntent(recipientId, amountCents, 500)
    Functions->>Stripe: createPaymentIntent(destination: ConnectId, application_fee_amount: 25)
    Stripe-->>Functions: client_secret
    Functions-->>Fan: SendTipResponse(clientSecret)
    Fan->>Stripe: Authorize Card via Stripe SDK
    Stripe->>Connect: Direct Split (Net to Creator, Fee to Platform)
    Stripe->>Functions: payment_intent.succeeded (Webhook)
    Functions->>Functions: Append Internal Ledger Entry (Double-Entry Log)
```

---

## 2. Agent-of-the-Payee Statutory Exemption

Crowdbeats operates strictly under the **Agent-of-the-Payee exemption** recognized under FinCEN guidance (FIN-2014-R009) and state Money Transmission Licensing laws:
1. **Contractual Appointment:** In the Creator Monetization Agreement, the performing musician expressly appoints Crowdbeats and Stripe as their authorized collection agent.
2. **Satisfaction of Debt:** When a fan pays the agent (Stripe), the fan's obligation to the creator is legally satisfied immediately, regardless of when funds settle to the creator's bank account.
3. **No Direct Intermediary Balance:** Fan funds do not sit in a commingled Crowdbeats operating account. Settlement routes directly from the fan's card to the creator's Stripe Express account.
