/**
 * Crowdbeats V2 — BigQuery Export Schemas & Analytics Types
 *
 * Defines BigQuery table schemas for automated financial, telemetry, and audit reporting.
 */

export interface BigQueryField {
  readonly name: string;
  readonly type: 'STRING' | 'INTEGER' | 'FLOAT' | 'BOOLEAN' | 'TIMESTAMP' | 'RECORD';
  readonly mode: 'REQUIRED' | 'NULLABLE' | 'REPEATED';
  readonly description: string;
  readonly fields?: readonly BigQueryField[];
}

export interface BigQueryTableSchema {
  readonly tableName: string;
  readonly description: string;
  readonly partitionField?: string;
  readonly clusteringFields?: readonly string[];
  readonly schema: readonly BigQueryField[];
}

/**
 * BigQuery Schema for Payment Ledger (`payment_ledger`)
 */
export const BigQueryPaymentLedgerSchema: BigQueryTableSchema = {
  tableName: 'payment_ledger',
  description: 'Double-entry append-only immutable financial ledger',
  partitionField: 'created_at',
  clusteringFields: ['entry_type', 'currency', 'account_uid'],
  schema: [
    { name: 'ledger_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique ledger entry ID' },
    { name: 'account_uid', type: 'STRING', mode: 'REQUIRED', description: 'UID of the debited/credited account' },
    { name: 'entry_type', type: 'STRING', mode: 'REQUIRED', description: 'DEBIT or CREDIT' },
    { name: 'amount_cents', type: 'INTEGER', mode: 'REQUIRED', description: 'Amount in integer minor units (cents)' },
    { name: 'currency', type: 'STRING', mode: 'REQUIRED', description: 'ISO 4217 Currency code' },
    { name: 'reference_type', type: 'STRING', mode: 'REQUIRED', description: 'tip, payout, match, refund' },
    { name: 'reference_id', type: 'STRING', mode: 'REQUIRED', description: 'ID of the related document' },
    { name: 'correlation_id', type: 'STRING', mode: 'NULLABLE', description: 'Trace correlation ID' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Creation timestamp' },
  ],
};

/**
 * BigQuery Schema for Tips (`tips_fact`)
 */
export const BigQueryTipsFactSchema: BigQueryTableSchema = {
  tableName: 'tips_fact',
  description: 'Tip transactions fact table',
  partitionField: 'created_at',
  clusteringFields: ['status', 'recipient_type', 'recipient_id'],
  schema: [
    { name: 'tip_id', type: 'STRING', mode: 'REQUIRED', description: 'Tip unique ID' },
    { name: 'fan_uid', type: 'STRING', mode: 'REQUIRED', description: 'Fan UID' },
    { name: 'recipient_id', type: 'STRING', mode: 'REQUIRED', description: 'Artist or Band ID' },
    { name: 'recipient_type', type: 'STRING', mode: 'REQUIRED', description: 'artist or band' },
    { name: 'amount_cents', type: 'INTEGER', mode: 'REQUIRED', description: 'Gross tip amount in cents' },
    { name: 'platform_fee_cents', type: 'INTEGER', mode: 'REQUIRED', description: 'Platform fee (500 bps)' },
    { name: 'net_amount_cents', type: 'INTEGER', mode: 'REQUIRED', description: 'Net amount credited to recipient' },
    { name: 'currency', type: 'STRING', mode: 'REQUIRED', description: 'Currency code' },
    { name: 'status', type: 'STRING', mode: 'REQUIRED', description: 'pending, succeeded, failed, refunded' },
    { name: 'session_id', type: 'STRING', mode: 'NULLABLE', description: 'Live session ID if tipped during show' },
    { name: 'is_anonymous', type: 'BOOLEAN', mode: 'REQUIRED', description: 'Whether tipper elected anonymity' },
    { name: 'created_at', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Tip initiation timestamp' },
    { name: 'processed_at', type: 'TIMESTAMP', mode: 'NULLABLE', description: 'Stripe settlement timestamp' },
  ],
};

/**
 * BigQuery Schema for Audit Events (`audit_events`)
 */
export const BigQueryAuditEventsSchema: BigQueryTableSchema = {
  tableName: 'audit_events',
  description: 'Immutable high-risk administrative and security audit trail',
  partitionField: 'timestamp',
  clusteringFields: ['action_type', 'actor_uid', 'target_entity_type'],
  schema: [
    { name: 'event_id', type: 'STRING', mode: 'REQUIRED', description: 'Unique audit event ID' },
    { name: 'action_type', type: 'STRING', mode: 'REQUIRED', description: 'Action classification' },
    { name: 'actor_uid', type: 'STRING', mode: 'REQUIRED', description: 'UID of the staff or user actor' },
    { name: 'target_entity_type', type: 'STRING', mode: 'REQUIRED', description: 'user, band, venue, sponsor' },
    { name: 'target_entity_id', type: 'STRING', mode: 'REQUIRED', description: 'ID of the affected entity' },
    { name: 'reason', type: 'STRING', mode: 'NULLABLE', description: 'Typed justification reason' },
    { name: 'correlation_id', type: 'STRING', mode: 'NULLABLE', description: 'Trace correlation ID' },
    { name: 'ip_address', type: 'STRING', mode: 'NULLABLE', description: 'Client IP address' },
    { name: 'timestamp', type: 'TIMESTAMP', mode: 'REQUIRED', description: 'Event timestamp' },
  ],
};

/**
 * Helper to map a Firestore ledger document to a BigQuery row
 */
export function mapLedgerDocToBigQueryRow(docData: Record<string, any>, docId: string): Record<string, any> {
  return {
    ledger_id: docId,
    account_uid: docData.accountUid || docData.fanUid || docData.creatorUid || 'unknown',
    entry_type: docData.entryType || (docData.type === 'debit' ? 'DEBIT' : 'CREDIT'),
    amount_cents: Number(docData.amountCents) || 0,
    currency: docData.currency || 'USD',
    reference_type: docData.referenceType || 'tip',
    reference_id: docData.referenceId || docData.tipId || docId,
    correlation_id: docData.correlationId || null,
    created_at: docData.createdAt?.toDate ? docData.createdAt.toDate().toISOString() : new Date().toISOString(),
  };
}
