# Crowdbeats V2 — Integration Field Reference & Safe Schemas

**Document Status:** Permanent Architecture Specification  
**Code Reference:** `packages/contracts/src/integrations/integrationSchemas.ts`  

---

## 1. Non-Secret Metadata Schema

```typescript
export interface IntegrationSummaryCard {
  readonly id: string;
  readonly providerType: IntegrationProviderType;
  readonly name: string;
  readonly icon: string;
  readonly purpose: string;
  readonly environment: DeploymentEnvironment; // LOCAL | DEVELOPMENT | STAGING | PRODUCTION
  readonly healthStatus: IntegrationHealthStatus;
  readonly configurationStatus: 'CONFIGURED' | 'PARTIAL' | 'UNCONFIGURED';
  readonly lastSuccessfulRequest?: string;
  readonly lastFailedRequest?: string;
  readonly lastWebhookDelivery?: string;
  readonly configOwner: string;
  readonly lastChangedAt: string;
  readonly rotationStatus: 'CURRENT' | 'DUE_SOON' | 'EXPIRED' | 'ROTATING';
  readonly isEnabled: boolean;
  readonly configRoute: string;
  readonly docsUrl: string;
}
```

---

## 2. Prohibited Fields in Client Payloads & Firestore
- `rawSecret`, `secretKey`, `apiKey`, `clientSecret`, `privateKey`, `webhookSigningSecret`, `serviceAccountJson`.
- All such values are ingested write-only, committed to Secret Manager, and immediately zeroed from memory.
