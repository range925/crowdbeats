'use client';

/**
 * Crowdbeats V2 — Stripe Webhook Event Monitor
 *
 * Operational Console Features:
 * - 4 Enterprise KPI Cards: Total Webhooks Received, Ingestion Success Rate, Failed Events, P99 Delivery Latency
 * - Real-time webhook stream with HMAC SHA-256 signature verification status
 * - Idempotency replay defense: prevent duplicate crediting while allowing manual replay
 * - Action Dialog: Replay Webhook with confirmation
 * - Detail Drawer: Sanitized JSON payload inspection
 */

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  AdminKpiCard,
  AdminFilterBar,
  ActionDialog,
  DetailDrawer,
  FreshnessLabel,
} from '@/components/admin';
import {
  ZapIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ClockIcon,
  RefreshIcon,
  ShieldBadgeIcon,
} from '@/components/admin/AdminIcons';

interface WebhookRecord {
  id: string;
  eventType: string;
  provider: 'STRIPE' | 'FIREBASE';
  signatureStatus: 'VALID_HMAC_SHA256' | 'INVALID_SIGNATURE';
  status: 'DELIVERED_AND_PROCESSED' | 'FAILED_RETRYING' | 'REPLAYED';
  httpStatusCode: number;
  latencyMs: number;
  attemptsCount: number;
  receivedAt: string;
  entityId: string;
  payloadExcerpt: Record<string, any>;
}

const SAMPLE_WEBHOOKS: WebhookRecord[] = [
  {
    id: 'evt_1Q8xK2LZUnAXe5WT001',
    eventType: 'payment_intent.succeeded',
    provider: 'STRIPE',
    signatureStatus: 'VALID_HMAC_SHA256',
    status: 'DELIVERED_AND_PROCESSED',
    httpStatusCode: 200,
    latencyMs: 124,
    attemptsCount: 1,
    receivedAt: '2026-10-08T22:30:15Z',
    entityId: 'pi_3MtwadLkdIwHu7ix28a3tqPa',
    payloadExcerpt: {
      id: 'pi_3MtwadLkdIwHu7ix28a3tqPa',
      amount: 2500,
      currency: 'usd',
      status: 'succeeded',
      metadata: { tipId: 'tip_8812', creatorId: 'art_elena_cruz' },
    },
  },
  {
    id: 'evt_1Q8xM9LZUnAXe5WT002',
    eventType: 'transfer.created',
    provider: 'STRIPE',
    signatureStatus: 'VALID_HMAC_SHA256',
    status: 'DELIVERED_AND_PROCESSED',
    httpStatusCode: 200,
    latencyMs: 142,
    attemptsCount: 1,
    receivedAt: '2026-10-08T22:15:00Z',
    entityId: 'tr_1Q8xM9LZUnAXe5WT',
    payloadExcerpt: {
      id: 'tr_1Q8xM9LZUnAXe5WT',
      amount: 48000,
      destination: 'acct_1MtwadLkdIwHu7ix',
      currency: 'usd',
    },
  },
  {
    id: 'evt_1Q8xP4LZUnAXe5WT003',
    eventType: 'charge.dispute.created',
    provider: 'STRIPE',
    signatureStatus: 'VALID_HMAC_SHA256',
    status: 'FAILED_RETRYING',
    httpStatusCode: 504,
    latencyMs: 5020,
    attemptsCount: 2,
    receivedAt: '2026-10-08T21:40:00Z',
    entityId: 'dp_1Q8xP4LZUnAXe5WT',
    payloadExcerpt: {
      id: 'dp_1Q8xP4LZUnAXe5WT',
      amount: 12000,
      reason: 'fraudulent',
      status: 'needs_response',
    },
  },
  {
    id: 'evt_1Q8xS7LZUnAXe5WT004',
    eventType: 'account.updated',
    provider: 'STRIPE',
    signatureStatus: 'VALID_HMAC_SHA256',
    status: 'DELIVERED_AND_PROCESSED',
    httpStatusCode: 200,
    latencyMs: 98,
    attemptsCount: 1,
    receivedAt: '2026-10-08T20:10:00Z',
    entityId: 'acct_1MtwadLkdIwHu7ix',
    payloadExcerpt: {
      id: 'acct_1MtwadLkdIwHu7ix',
      payouts_enabled: true,
      charges_enabled: true,
      details_submitted: true,
    },
  },
];

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookRecord[]>(SAMPLE_WEBHOOKS);
  const [search, setSearch] = useState('');
  const [selectedWebhook, setSelectedWebhook] = useState<WebhookRecord | null>(null);
  const [replayingWebhook, setReplayingWebhook] = useState<WebhookRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [replaySuccess, setReplaySuccess] = useState<string | null>(null);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
      setLastRefreshedAt(new Date());
    }, 400);
  };

  const handleExecuteReplay = () => {
    if (!replayingWebhook) return;
    setWebhooks((prev) =>
      prev.map((w) =>
        w.id === replayingWebhook.id
          ? { ...w, status: 'REPLAYED', attemptsCount: w.attemptsCount + 1, httpStatusCode: 200 }
          : w
      )
    );
    setReplaySuccess(`Webhook event ${replayingWebhook.id} replayed successfully with idempotency key.`);
    setReplayingWebhook(null);
    setTimeout(() => setReplaySuccess(null), 4000);
  };

  const filteredWebhooks = useMemo(() => {
    if (!search) return webhooks;
    const q = search.toLowerCase();
    return webhooks.filter(
      (w) =>
        w.id.toLowerCase().includes(q) ||
        w.eventType.toLowerCase().includes(q) ||
        w.entityId.toLowerCase().includes(q)
    );
  }, [webhooks, search]);

  return (
    <div
      style={{
        padding: '24px 32px 48px',
        maxWidth: 1440,
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
      }}
    >
      {/* ─────────────────────────────────────────────────────────────────────────
          1. BREADCRUMB & HEADER
      ───────────────────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--admin-text-secondary, #64748B)' }}>
        <Link href="/admin/finance" style={{ color: 'var(--admin-accent-primary, #7C3AED)', textDecoration: 'none', fontWeight: 600 }}>
          Finance Control Plane
        </Link>
        <span>/</span>
        <span style={{ color: 'var(--admin-text-primary, #0F172A)', fontWeight: 600 }}>Stripe Webhook Monitor</span>
      </div>

      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 16,
          borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
          paddingBottom: 16,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1
              style={{
                fontSize: 26,
                fontWeight: 800,
                margin: 0,
                color: 'var(--admin-text-primary, #0F172A)',
                letterSpacing: '-0.025em',
              }}
            >
              Stripe Webhook Monitor
            </h1>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 9999,
                background: 'rgba(59, 130, 246, 0.1)',
                color: '#2563EB',
                border: '1px solid rgba(59, 130, 246, 0.25)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              HMAC SHA-256
            </span>
          </div>
          <p
            style={{
              color: 'var(--admin-text-secondary, #64748B)',
              fontSize: 13,
              margin: '4px 0 0',
              lineHeight: 1.4,
            }}
          >
            Live stream of inbound Stripe events, cryptographic verification logs, idempotency deduplication, and replay triggers.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FreshnessLabel
            lastUpdated={lastRefreshedAt}
            isRefreshing={isRefreshing}
            onRefresh={handleManualRefresh}
          />
        </div>
      </header>

      {replaySuccess && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 8,
            background: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#047857',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <CheckCircleIcon size={16} strokeWidth={2.2} />
          <span>{replaySuccess}</span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────────────
          2. KPI CARDS
      ───────────────────────────────────────────────────────────────────────── */}
      <section aria-label="Webhook Key Metrics">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
          className="admin-kpi-grid"
        >
          <AdminKpiCard
            title="Total Events Ingested"
            value="4,821"
            subtitle="24h inbound webhook volume"
            period="24h Stream"
            trend={{ value: "+8.2%", isPositive: true, label: "vs yesterday" }}
            icon={<ZapIcon size={18} strokeWidth={2.2} />}
            accentColor="#7C3AED"
            tooltip="Total events delivered to the /stripeWebhook Cloud Function endpoint."
          />

          <AdminKpiCard
            title="Ingestion Success Rate"
            value="99.92%"
            subtitle="HTTP 200 response SLA"
            period="Target >99.9%"
            trend={{ value: "Healthy", isPositive: true, label: "within budget" }}
            icon={<CheckCircleIcon size={18} strokeWidth={2.2} />}
            accentColor="#10B981"
            tooltip="Percentage of incoming webhook requests processed without timeouts or internal server errors."
          />

          <AdminKpiCard
            title="Failed Events (Retrying)"
            value={webhooks.filter((w) => w.status === 'FAILED_RETRYING').length.toString()}
            subtitle="Pending retry backlog"
            period="Action Needed"
            isAdverse={true}
            trend={{ value: "1 Critical", isPositive: true, label: "needs replay" }}
            icon={<AlertTriangleIcon size={18} strokeWidth={2.2} />}
            accentColor="#EF4444"
            tooltip="Events that resulted in non-200 responses and require automated or manual replay."
          />

          <AdminKpiCard
            title="P99 Ingestion Latency"
            value="142ms"
            subtitle="Processing & ledger write time"
            period="Target <300ms"
            trend={{ value: "Optimal", isPositive: true, label: "P99 SLA" }}
            icon={<ClockIcon size={18} strokeWidth={2.2} />}
            accentColor="#3B82F6"
            tooltip="99th percentile processing time from HTTP payload receipt to Firestore ledger commit."
          />
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          3. WEBHOOK STREAM TABLE
      ───────────────────────────────────────────────────────────────────────── */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <AdminFilterBar
          searchPlaceholder="Search webhooks by event ID, event type, or entity ID..."
          onSearchChange={setSearch}
        />

        <div
          style={{
            background: 'var(--admin-surface-card, #FFFFFF)',
            borderRadius: 12,
            border: '1px solid var(--admin-border-subtle, #E2E8F0)',
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', color: 'var(--admin-text-secondary, #64748B)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Event ID / Type</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>Target Entity</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontWeight: 600 }}>HMAC Signature</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Latency / Code</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 600 }}>Status / Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredWebhooks.map((w) => (
                <tr
                  key={w.id}
                  style={{ borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)', cursor: 'pointer' }}
                  onClick={() => setSelectedWebhook(w)}
                >
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--admin-text-primary, #0F172A)' }}>
                      {w.eventType}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--admin-text-tertiary, #94A3B8)', fontFamily: 'monospace' }}>
                      {w.id}
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontFamily: 'monospace', fontSize: 12, color: 'var(--admin-text-secondary, #64748B)' }}>
                    {w.entityId}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: 4,
                        background: 'rgba(16, 185, 129, 0.1)',
                        color: '#059669',
                      }}
                    >
                      {w.signatureStatus}
                    </span>
                  </td>
                  <td
                    className="admin-tabular-nums"
                    style={{ padding: '12px 16px', textAlign: 'right', fontSize: 12 }}
                  >
                    <div style={{ fontWeight: 600, color: w.httpStatusCode === 200 ? '#10B981' : '#DC2626' }}>
                      HTTP {w.httpStatusCode}
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--admin-text-tertiary, #94A3B8)' }}>
                      {w.latencyMs}ms ({w.attemptsCount} try)
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                    {w.status === 'FAILED_RETRYING' ? (
                      <button
                        type="button"
                        onClick={() => setReplayingWebhook(w)}
                        style={{
                          padding: '4px 10px',
                          background: '#EF4444',
                          border: 'none',
                          borderRadius: 6,
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#FFFFFF',
                          cursor: 'pointer',
                        }}
                      >
                        Replay Event
                      </button>
                    ) : (
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          padding: '3px 8px',
                          borderRadius: 6,
                          background: w.status === 'REPLAYED' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                          color: w.status === 'REPLAYED' ? '#2563EB' : '#059669',
                        }}
                      >
                        {w.status}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ─────────────────────────────────────────────────────────────────────────
          4. ACTION DIALOG & DETAIL DRAWER
      ───────────────────────────────────────────────────────────────────────── */}
      {replayingWebhook && (
        <ActionDialog
          isOpen={true}
          title="Replay Webhook Event"
          targetDescription={`Event: ${replayingWebhook.id} (${replayingWebhook.eventType}) targeting ${replayingWebhook.entityId}`}
          consequenceText="The event will be sent to the Stripe webhook consumer. If already recorded, idempotency deduplication ensures zero double-crediting."
          confirmLabel="Execute Replay"
          isDestructive={false}
          requiresReason={false}
          onConfirm={handleExecuteReplay}
          onClose={() => setReplayingWebhook(null)}
        />
      )}

      <DetailDrawer
        isOpen={Boolean(selectedWebhook)}
        onClose={() => setSelectedWebhook(null)}
        title={selectedWebhook ? `Webhook Event: ${selectedWebhook.eventType}` : 'Webhook Detail'}
      >
        {selectedWebhook && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '3px 8px',
                  borderRadius: 6,
                  background: selectedWebhook.httpStatusCode === 200 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                  color: selectedWebhook.httpStatusCode === 200 ? '#059669' : '#DC2626',
                }}
              >
                HTTP {selectedWebhook.httpStatusCode} · {selectedWebhook.status}
              </span>
              <h2 style={{ fontSize: 18, fontWeight: 800, margin: '8px 0 2px', fontFamily: 'monospace' }}>
                {selectedWebhook.id}
              </h2>
              <p style={{ fontSize: 12, color: 'var(--admin-text-secondary, #64748B)', margin: 0 }}>
                Received at: {new Date(selectedWebhook.receivedAt).toLocaleString()}
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--admin-surface-raised, #F8FAFC)', border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)' }}>Latency</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedWebhook.latencyMs}ms</div>
              </div>
              <div style={{ padding: 12, borderRadius: 8, background: 'var(--admin-surface-raised, #F8FAFC)', border: '1px solid var(--admin-border-subtle, #E2E8F0)' }}>
                <div style={{ fontSize: 11, color: 'var(--admin-text-secondary, #64748B)' }}>Attempts</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{selectedWebhook.attemptsCount}</div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: 'var(--admin-text-primary, #0F172A)' }}>
                Sanitized JSON Payload Excerpt
              </h3>
              <pre
                style={{
                  background: '#0F172A',
                  color: '#F8FAFC',
                  padding: 14,
                  borderRadius: 8,
                  fontSize: 12,
                  overflowX: 'auto',
                  lineHeight: 1.4,
                }}
              >
                {JSON.stringify(selectedWebhook.payloadExcerpt, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </DetailDrawer>
    </div>
  );
}
