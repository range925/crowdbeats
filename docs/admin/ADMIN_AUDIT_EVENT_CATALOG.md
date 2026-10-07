# Crowdbeats V2 — Immutable Audit Event Catalog

**Document Status:** Permanent Architecture Specification  
**Storage Destination:** Firestore `/auditEvents/{eventId}` (Immutable append-only)  

---

## 1. Event Payload Schema

```typescript
interface AuditEventRecord {
  readonly id: string;
  readonly eventType: AuditEventType;
  readonly actorUid: string;
  readonly actorRole: PlatformRole;
  readonly targetType: 'USER' | 'CREATOR' | 'BAND' | 'TRANSACTION' | 'COMPLIANCE_OBLIGATION' | 'DMCA_NOTICE' | 'CAMPAIGN';
  readonly targetId: string;
  readonly correlationId: string;
  readonly clientIpHash: string;
  readonly userAgent: string;
  readonly previousState?: Record<string, unknown>;
  readonly newState?: Record<string, unknown>;
  readonly reasonCode?: string;
  readonly timestamp: FirebaseFirestore.Timestamp;
}
```

---

## 2. Catalog of Standard Audit Event Types

| Event Type | Triggering Action | Actor Role | Retention Period |
| :--- | :--- | :--- | :--- |
| `USER_ACCOUNT_SUSPENDED` | Moderator / Security Admin suspends an account | `MODERATOR` / `SECURITY_ADMIN` | 7 Years |
| `USER_ACCOUNT_DELETED` | User or Compliance Admin executes GDPR erasure | System / `COMPLIANCE_ADMIN` | 7 Years |
| `CREATOR_VERIFICATION_APPROVED` | Musician/Band verified badge issued | `MODERATOR` / `SUPER_ADMIN` | 7 Years |
| `CREATOR_VERIFICATION_REVOKED` | Verification badge revoked | `MODERATOR` / `SUPER_ADMIN` | 7 Years |
| `FINANCIAL_LARGE_REFUND_APPROVED` | Refund > $100 signed off | `FINANCE_ADMIN` + `SUPER_ADMIN` | 7 Years |
| `PAYOUT_HOLD_RELEASED` | Compliance hold on creator payouts cleared | `COMPLIANCE_ADMIN` | 7 Years |
| `DMCA_TAKEDOWN_EXECUTED` | Copyright infringing content removed | `MODERATOR` | 7 Years |
| `DMCA_CONTENT_RESTORED` | Content restored after 14-day counter notice | `MODERATOR` / `LEGAL` | 7 Years |
| `COMPLIANCE_OBLIGATION_UPDATED` | Status updated in 28-subject register | `COMPLIANCE_ADMIN` | 7 Years |
| `STAFF_ROLE_MODIFIED` | User promoted to Administrator | `SUPER_ADMIN` (Dual signoff) | 7 Years |
| `FINANCIAL_RECONCILIATION_RUN` | Daily automated ledger vs Stripe balance run | `FINANCE_ADMIN` / Cron Probe | 7 Years |
