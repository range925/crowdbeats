# Crowdbeats V2 — Integration Catalog & Provider Inventory

**Document Status:** Permanent Architecture Specification  
**Scope:** Core Infrastructure, Payment, Mapping, AI, Messaging, and Monitoring Integrations.

---

## 1. Approved Provider Catalog

| Provider | Category | Purpose | Ingestion Method | Secret Storage |
| :--- | :--- | :--- | :--- | :--- |
| **Stripe** | Payments & Connect | Marketplace fan tips, Connect payouts, splits, 1099-K | PaymentSheet / REST API | Secret Manager |
| **Google Maps Platform** | Location & Radar | Live Stage Radar, venue geofencing, server geocoding | Mobile SDK / REST API | Secret Manager (Server) / Key Restrictions |
| **Firebase / GCP** | Core Platform | Auth, Multi-tenant Firestore, Cloud Storage, Functions v2 | Admin SDK / ADC | Workload Identity / ADC |
| **Gemini / Vertex AI** | Generative AI | Multimodal music summaries, toxicity screening | Vertex AI REST | Secret Manager / IAM |
| **SendGrid / Resend** | Email Gateway | Transactional receipts, password resets, digests | HTTPS Webhook / REST | Secret Manager |
| **Twilio** | SMS (10DLC) | Security verification codes, live stage alerts | 10DLC Webhook / REST | Secret Manager |
| **Firebase FCM** | Push Notifications | Real-time tip alerts, stage go-live broadcasts | FCM / APNs p8 | Secret Manager |
| **Firebase Crashlytics** | Diagnostics | Native mobile fatal/non-fatal crash traces | Client SDK (Zero PII) | Client Configuration |
| **Google Cloud Logging** | Observability | Structured JSON application & audit logs | Stackdriver API | IAM Attached Role |
