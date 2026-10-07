/**
 * Crowdbeats V2 — Dispute & Chargeback Evidence Aggregation Contracts (Phase 11)
 *
 * Defines models for dispute records, compiled evidence dictionaries,
 * and automated submission payloads.
 */

export interface CompiledDisputeEvidence {
  readonly productDescription: string;
  readonly customerCommunication?: string;
  readonly accessActivityLog: string;
  readonly cancellationPolicyDisclosure: string;
  readonly serviceDocumentation: string;
  readonly refundPolicyUrl: string;
  readonly termsOfServiceUrl: string;
  readonly uncategorizedText?: string;
}

export interface DisputeRecord {
  readonly disputeId: string;
  readonly chargeId?: string;
  readonly stripePaymentIntentId?: string;
  readonly tipId?: string;
  readonly recipientId?: string;
  readonly amountCents: number;
  readonly reason: string;
  readonly status: string;
  readonly compiledEvidence?: CompiledDisputeEvidence;
  readonly evidenceSubmittedAt?: string;
  readonly evidenceSubmittedByUid?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface CompileDisputeEvidenceRequest {
  readonly disputeId: string;
}

export interface SubmitDisputeEvidenceRequest {
  readonly disputeId: string;
  readonly evidenceOverrides?: Partial<CompiledDisputeEvidence>;
}
