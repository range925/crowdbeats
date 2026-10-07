# Crowdbeats V2 — Platform Fee Rule Schema & Lifecycle Model

**Document Status:** Permanent Data Schema  

---

## 1. Typed Schema Definition

```typescript
export interface PlatformFeeRule {
  readonly id: string;
  readonly name: string;
  readonly environment: 'DEVELOPMENT' | 'STAGING' | 'PRODUCTION';
  readonly feeBasisPoints: number; // 0 to 1000 (0.00% to 10.00%)
  readonly minFeeCents?: number;
  readonly maxFeeCents?: number;
  readonly currency: 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD';
  readonly transactionType: PaymentTransactionType;
  readonly chargeType: StripeChargeType;
  readonly state: FeeRuleState;
  readonly effectiveStart: string;
  readonly effectiveEnd?: string;
  readonly legalDisclosureVersion: string;
  readonly termsVersion: string;
  readonly refundPolicy: 'PROPORTIONAL' | 'FULL' | 'RETAINED';
  readonly authorUid: string;
  readonly primaryReviewerUid?: string;
  readonly secondaryApproverUid?: string;
  readonly reasonForChange: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}
```
