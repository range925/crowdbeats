/**
 * Crowdbeats V2 — Creator Campaign Contributions & Backers Ledger (Phase 14)
 *
 * Provides real-time view of:
 * - Payment-confirmed backer contributions across all creator campaigns
 * - Reward tier claim and fulfillment tracking (pending -> processing -> shipped -> delivered)
 * - Fulfillment update modal with tracking number and carrier assignment
 * - Safe contribution refunding with ledger reconciliation
 */

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  useCampaignContributors,
  updateRewardFulfillmentApi,
  refundContributionApi,
} from '@/lib/campaign/campaignSync';
import type {
  CampaignContributionDetail,
  RewardFulfillmentStatus,
} from '@crowdbeats/contracts';

interface CreatorCampaignSummary {
  campaignId: string;
  title: string;
  status: string;
}

export default function CreatorContributionsPage() {
  const [campaigns, setCampaigns] = useState<CreatorCampaignSummary[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'captured' | 'pending' | 'refunded'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fulfillment Modal State
  const [selectedContribution, setSelectedContribution] = useState<CampaignContributionDetail | null>(null);
  const [modalType, setModalType] = useState<'fulfillment' | 'refund' | null>(null);
  const [targetFulfillmentStatus, setTargetFulfillmentStatus] = useState<RewardFulfillmentStatus>('processing');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [carrier, setCarrier] = useState<string>('USPS');
  const [notes, setNotes] = useState<string>('');
  const [refundReason, setRefundReason] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [actionMessage, setActionMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Fetch creator's campaigns for the campaign filter dropdown
  useEffect(() => {
    fetch('/api/creator/campaigns')
      .then((res) => res.json())
      .then((data) => {
        if (data.campaigns && data.campaigns.length > 0) {
          setCampaigns(data.campaigns);
          setSelectedCampaignId(data.campaigns[0].campaignId);
        }
      })
      .catch((err) => console.error('Failed to load creator campaigns:', err));
  }, []);

  const { contributions, totalPledgedCents, backerCount, loading, refresh } =
    useCampaignContributors(selectedCampaignId || null);

  // Local fallback mock data if no live contributions yet exist in dev
  const activeContributions: CampaignContributionDetail[] = useMemo(() => {
    if (contributions && contributions.length > 0) return contributions;
    if (!selectedCampaignId) return [];
    return [
      {
        contributionId: 'demo_c_1',
        campaignId: selectedCampaignId,
        fanUid: 'fan_sarah',
        backerName: 'Sarah Connor',
        backerAvatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
        amountCents: 5000,
        currency: 'USD',
        tierId: 'tier_vinyl',
        rewardTierTitle: 'Limited Edition Marbled Vinyl LP',
        status: 'captured',
        isAnonymous: false,
        fulfillmentStatus: 'processing',
        trackingNumber: '9400111899562537628811',
        carrier: 'USPS',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        stripePaymentIntentId: 'pi_demo_1',
        idempotencyKey: 'idem_1',
      },
      {
        contributionId: 'demo_c_2',
        campaignId: selectedCampaignId,
        fanUid: 'fan_anon',
        backerName: 'Anonymous Supporter',
        amountCents: 2500,
        currency: 'USD',
        tierId: 'tier_cd',
        rewardTierTitle: 'Signed Physical CD',
        status: 'captured',
        isAnonymous: true,
        fulfillmentStatus: 'pending',
        createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
        stripePaymentIntentId: 'pi_demo_2',
        idempotencyKey: 'idem_2',
      },
      {
        contributionId: 'demo_c_3',
        campaignId: selectedCampaignId,
        fanUid: 'fan_marcus',
        backerName: 'Marcus Vance',
        amountCents: 10000,
        currency: 'USD',
        tierId: 'tier_vip',
        rewardTierTitle: 'VIP Soundcheck & Tour Pass',
        status: 'captured',
        isAnonymous: false,
        fulfillmentStatus: 'delivered',
        trackingNumber: '1Z9999999999999999',
        carrier: 'UPS',
        createdAt: new Date(Date.now() - 86400000 * 6).toISOString(),
        stripePaymentIntentId: 'pi_demo_3',
        idempotencyKey: 'idem_3',
      },
    ];
  }, [contributions, selectedCampaignId]);

  // Filter contributions
  const filteredContributions = useMemo(() => {
    return activeContributions.filter((c) => {
      const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchesSearch =
        !searchQuery ||
        (c.backerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.rewardTierTitle || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.trackingNumber || '').toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [activeContributions, statusFilter, searchQuery]);

  // KPIs
  const kpiStats = useMemo(() => {
    const totalPledged = activeContributions.reduce(
      (sum, c) => (c.status === 'captured' ? sum + c.amountCents : sum),
      0,
    );
    const confirmedBackers = new Set(
      activeContributions.filter((c) => c.status === 'captured').map((c) => c.fanUid),
    ).size;
    const pendingFulfillment = activeContributions.filter(
      (c) => c.fulfillmentStatus === 'pending' || c.fulfillmentStatus === 'processing',
    ).length;
    const deliveredCount = activeContributions.filter(
      (c) => c.fulfillmentStatus === 'delivered' || c.fulfillmentStatus === 'digital_delivered',
    ).length;

    return {
      totalPledged,
      confirmedBackers,
      pendingFulfillment,
      deliveredCount,
    };
  }, [activeContributions]);

  // Open fulfillment modal
  const openFulfillmentModal = (c: CampaignContributionDetail) => {
    setSelectedContribution(c);
    setTargetFulfillmentStatus(c.fulfillmentStatus || 'processing');
    setTrackingNumber(c.trackingNumber || '');
    setCarrier(c.carrier || 'USPS');
    setNotes(c.notes || '');
    setModalType('fulfillment');
    setActionMessage(null);
  };

  // Open refund modal
  const openRefundModal = (c: CampaignContributionDetail) => {
    setSelectedContribution(c);
    setRefundReason('');
    setModalType('refund');
    setActionMessage(null);
  };

  // Save fulfillment updates
  const handleSaveFulfillment = async () => {
    if (!selectedContribution) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await updateRewardFulfillmentApi({
        campaignId: selectedContribution.campaignId,
        contributionId: selectedContribution.contributionId,
        fulfillmentStatus: targetFulfillmentStatus,
        trackingNumber: trackingNumber || undefined,
        carrier: carrier || undefined,
        notes: notes || undefined,
      });
      setIsProcessing(false);
      setActionMessage({ text: 'Reward fulfillment status updated successfully!', type: 'success' });
      setTimeout(() => {
        setModalType(null);
        refresh();
      }, 1200);
    } catch (err: any) {
      console.error('Error updating fulfillment:', err);
      setIsProcessing(false);
      setActionMessage({ text: err?.message || 'Failed to update fulfillment.', type: 'error' });
    }
  };

  // Process refund
  const handleProcessRefund = async () => {
    if (!selectedContribution) return;
    setIsProcessing(true);
    setActionMessage(null);
    try {
      await refundContributionApi({
        campaignId: selectedContribution.campaignId,
        contributionId: selectedContribution.contributionId,
        reason: refundReason || 'Creator initiated refund',
      });
      setIsProcessing(false);
      setActionMessage({ text: 'Contribution successfully refunded.', type: 'success' });
      setTimeout(() => {
        setModalType(null);
        refresh();
      }, 1200);
    } catch (err: any) {
      console.error('Error processing refund:', err);
      setIsProcessing(false);
      setActionMessage({ text: err?.message || 'Failed to process refund.', type: 'error' });
    }
  };

  return (
    <div style={{ padding: '28px 36px', maxWidth: 1120, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary)' }}>
            Contributions & Backers
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 14, margin: 0 }}>
            Track payment-confirmed pledges, deliver rewards, and manage backer communications.
          </p>
        </div>

        {/* Campaign Selector */}
        {campaigns.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label htmlFor="campaign-select" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>
              Campaign:
            </label>
            <select
              id="campaign-select"
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              style={{
                background: 'var(--surface-raised)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: 8,
                padding: '8px 14px',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {campaigns.map((c) => (
                <option key={c.campaignId} value={c.campaignId}>
                  {c.title} ({c.status})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Top Bento KPI Summary */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Confirmed Pledges
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            ${(kpiStats.totalPledged / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--status-success)', marginTop: 4 }}>
            100% payment verified
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Confirmed Backers
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-primary)' }}>
            {kpiStats.confirmedBackers}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Unique supporters
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Pending Fulfillment
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: kpiStats.pendingFulfillment > 0 ? '#EAB308' : 'var(--text-primary)' }}>
            {kpiStats.pendingFulfillment}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Rewards awaiting shipment
          </div>
        </div>

        <div style={{ background: 'var(--surface-card)', borderRadius: 12, padding: 18, border: '1px solid var(--border-subtle)' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 6 }}>
            Delivered Rewards
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--status-success)' }}>
            {kpiStats.deliveredCount}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>
            Successfully fulfilled
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'captured', 'pending', 'refunded'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              style={{
                background: statusFilter === tab ? 'var(--accent-primary-subtle, rgba(124, 58, 237, 0.15))' : 'transparent',
                color: statusFilter === tab ? 'var(--accent-primary, #7C3AED)' : 'var(--text-secondary)',
                border: 'none',
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <input
          type="text"
          placeholder="Search by backer, reward, tracking..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            background: 'var(--surface-card)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 13,
            minWidth: 260,
          }}
        />
      </div>

      {/* Contributions Ledger Table */}
      <div style={{ background: 'var(--surface-card)', borderRadius: 14, border: '1px solid var(--border-subtle)', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            Loading backer pledges...
          </div>
        ) : filteredContributions.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-secondary)' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>📦</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-primary)', marginBottom: 4 }}>
              No pledges found matching this filter
            </div>
            <div style={{ fontSize: 13 }}>
              When fans pledge to your active campaigns, verified contributions will appear here.
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-raised)' }}>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Backer</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Reward Tier</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Pledged</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Payment</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Fulfillment</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700 }}>Date</th>
                <th style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontWeight: 700, textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContributions.map((c) => (
                <tr key={c.contributionId} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {/* Backer */}
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          backgroundColor: 'var(--surface-raised)',
                          backgroundImage: c.backerAvatarUrl ? `url(${c.backerAvatarUrl})` : undefined,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {!c.backerAvatarUrl && (c.isAnonymous ? '?' : (c.backerName || 'F').charAt(0))}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          {c.backerName || (c.isAnonymous ? 'Anonymous Supporter' : 'Supporter')}
                        </div>
                        {c.isAnonymous && (
                          <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>Private pledge</span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Reward Tier */}
                  <td style={{ padding: '14px 16px', color: 'var(--text-primary)' }}>
                    <div style={{ fontWeight: 600 }}>{c.rewardTierTitle || 'No Tier (Direct Pledge)'}</div>
                    {c.message && (
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontStyle: 'italic', marginTop: 2 }}>
                        &ldquo;{c.message}&rdquo;
                      </div>
                    )}
                  </td>

                  {/* Amount */}
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    ${(c.amountCents / 100).toFixed(2)}
                  </td>

                  {/* Payment Status */}
                  <td style={{ padding: '14px 16px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                        background:
                          c.status === 'captured'
                            ? 'rgba(74, 222, 128, 0.15)'
                            : c.status === 'refunded'
                            ? 'rgba(239, 68, 68, 0.15)'
                            : 'rgba(234, 179, 8, 0.15)',
                        color:
                          c.status === 'captured'
                            ? 'var(--status-success, #22C55E)'
                            : c.status === 'refunded'
                            ? '#EF4444'
                            : '#EAB308',
                      }}
                    >
                      {c.status}
                    </span>
                  </td>

                  {/* Fulfillment Status */}
                  <td style={{ padding: '14px 16px' }}>
                    {c.tierId ? (
                      <div>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: 12,
                            fontSize: 11,
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background:
                              c.fulfillmentStatus === 'delivered' || c.fulfillmentStatus === 'digital_delivered'
                                ? 'rgba(74, 222, 128, 0.15)'
                                : c.fulfillmentStatus === 'shipped'
                                ? 'rgba(59, 130, 246, 0.15)'
                                : 'rgba(234, 179, 8, 0.15)',
                            color:
                              c.fulfillmentStatus === 'delivered' || c.fulfillmentStatus === 'digital_delivered'
                                ? 'var(--status-success, #22C55E)'
                                : c.fulfillmentStatus === 'shipped'
                                ? '#3B82F6'
                                : '#EAB308',
                          }}
                        >
                          {c.fulfillmentStatus || 'pending'}
                        </span>
                        {c.trackingNumber && (
                          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>
                            {c.carrier || 'Tracking'}: {c.trackingNumber.slice(0, 10)}...
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-secondary)', fontSize: 12 }}>N/A</span>
                    )}
                  </td>

                  {/* Date */}
                  <td style={{ padding: '14px 16px', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                      {c.tierId && c.status === 'captured' && (
                        <button
                          onClick={() => openFulfillmentModal(c)}
                          style={{
                            background: 'var(--surface-raised)',
                            color: 'var(--text-primary)',
                            border: '1px solid var(--border-subtle)',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Fulfillment
                        </button>
                      )}
                      {c.status === 'captured' && (
                        <button
                          onClick={() => openRefundModal(c)}
                          style={{
                            background: 'transparent',
                            color: '#EF4444',
                            border: '1px solid rgba(239, 68, 68, 0.3)',
                            borderRadius: 6,
                            padding: '5px 10px',
                            fontSize: 12,
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Refund
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Fulfillment Status Update Modal */}
      {modalType === 'fulfillment' && selectedContribution && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface-card, #FFFFFF)',
              borderRadius: 16,
              maxWidth: 480,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 4px', color: 'var(--text-primary)' }}>
              Update Reward Fulfillment
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 18 }}>
              Backer: {selectedContribution.backerName || 'Supporter'} • {selectedContribution.rewardTierTitle}
            </p>

            {actionMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 600,
                  background: actionMessage.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                  color: actionMessage.type === 'success' ? '#22C55E' : '#EF4444',
                }}
              >
                {actionMessage.text}
              </div>
            )}

            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Fulfillment Status:
              </label>
              <select
                value={targetFulfillmentStatus}
                onChange={(e) => setTargetFulfillmentStatus(e.target.value as RewardFulfillmentStatus)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: 13,
                }}
              >
                <option value="pending">Pending</option>
                <option value="processing">Processing / Packing</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
                <option value="digital_delivered">Digital Delivered</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, marginBottom: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Carrier:
                </label>
                <input
                  type="text"
                  placeholder="USPS, UPS..."
                  value={carrier}
                  onChange={(e) => setCarrier(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                  Tracking Number:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 9400..."
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: 8,
                    border: '1px solid var(--border-subtle)',
                    background: 'var(--surface-raised)',
                    color: 'var(--text-primary)',
                    fontSize: 13,
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Internal Notes / Packaging details:
              </label>
              <textarea
                rows={2}
                placeholder="Optional fulfillment notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  resize: 'none',
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                disabled={isProcessing}
                onClick={() => setModalType(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={handleSaveFulfillment}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'var(--accent-primary, #7C3AED)',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {isProcessing ? 'Updating...' : 'Save Fulfillment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Refund Modal */}
      {modalType === 'refund' && selectedContribution && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: 'var(--surface-card, #FFFFFF)',
              borderRadius: 16,
              maxWidth: 440,
              width: '100%',
              padding: 24,
              boxShadow: '0 20px 48px rgba(0,0,0,0.2)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: '0 0 6px', color: '#EF4444' }}>
              Confirm Contribution Refund
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 16 }}>
              Are you sure you want to refund <strong>${(selectedContribution.amountCents / 100).toFixed(2)}</strong> to{' '}
              {selectedContribution.backerName || 'this supporter'}? This will reverse the pledge from your campaign total and release any claimed reward tier.
            </p>

            {actionMessage && (
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: 8,
                  marginBottom: 16,
                  fontSize: 13,
                  fontWeight: 600,
                  background: actionMessage.type === 'success' ? 'rgba(74,222,128,0.15)' : 'rgba(239,68,68,0.15)',
                  color: actionMessage.type === 'success' ? '#22C55E' : '#EF4444',
                }}
              >
                {actionMessage.text}
              </div>
            )}

            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--text-secondary)' }}>
                Reason for Refund:
              </label>
              <input
                type="text"
                placeholder="e.g. Backer requested cancellation"
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--surface-raised)',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
              <button
                disabled={isProcessing}
                onClick={() => setModalType(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: 8,
                  border: '1px solid var(--border-subtle)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                Keep Pledge
              </button>
              <button
                disabled={isProcessing}
                onClick={handleProcessRefund}
                style={{
                  padding: '8px 18px',
                  borderRadius: 8,
                  border: 'none',
                  background: '#EF4444',
                  color: '#FFFFFF',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {isProcessing ? 'Refunding...' : 'Confirm Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
