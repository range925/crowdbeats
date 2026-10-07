/**
 * Crowdbeats V2 — Multi-step Campaign Creator Wizard (Phase 7)
 * 'use client' wizard: Step 1 Basics -> Step 2 Reward Tiers -> Step 3 Review & Create.
 */

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

interface RewardTierInput {
  tierId: string;
  title: string;
  description: string;
  amountCents: number;
}

export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goalDollar, setGoalDollar] = useState('100');
  const [deadlineDays, setDeadlineDays] = useState('30');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Step 2 state
  const [tiers, setTiers] = useState<RewardTierInput[]>([
    { tierId: 't1', title: 'Supporter Digital Download', description: 'Early access digital MP3/FLAC download of the new release.', amountCents: 1000 },
  ]);
  const [newTierTitle, setNewTierTitle] = useState('');
  const [newTierDesc, setNewTierDesc] = useState('');
  const [newTierAmount, setNewTierAmount] = useState('25');

  const addTier = () => {
    if (!newTierTitle.trim()) return;
    const amount = Math.max(1, parseInt(newTierAmount, 10) || 1) * 100;
    setTiers([...tiers, { tierId: `t_${Date.now()}`, title: newTierTitle.trim(), description: newTierDesc.trim(), amountCents: amount }]);
    setNewTierTitle('');
    setNewTierDesc('');
    setNewTierAmount('25');
  };

  const removeTier = (id: string) => {
    setTiers(tiers.filter((t) => t.tierId !== id));
  };

  const validateStep1 = () => {
    if (!title.trim() || title.trim().length > 120) return 'Title must be between 1 and 120 characters.';
    if (!description.trim() || description.trim().length < 50) return 'Description must be at least 50 characters long.';
    const goal = parseInt(goalDollar, 10);
    if (isNaN(goal) || goal < 10) return 'Goal must be at least $10.';
    return null;
  };

  const handleNext = () => {
    if (step === 1) {
      const err = validateStep1();
      if (err) { setError(err); return; }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (tiers.length === 0) { setError('Add at least 1 reward tier.'); return; }
      setError('');
      setStep(3);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    const deadlineDate = new Date(Date.now() + parseInt(deadlineDays, 10) * 86_400_000).toISOString();
    const goalCents = parseInt(goalDollar, 10) * 100;

    try {
      const res = await fetch('/api/creator/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          goalCents,
          deadline: deadlineDate,
          rewardTiers: tiers.map((t) => ({ ...t, quantityClaimed: 0 })),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to create campaign');
        setSubmitting(false);
        return;
      }
      router.push(`/creator/campaigns/${data.campaignId}`);
    } catch {
      setError('Network error creating campaign');
      setSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, margin: '0 0 16px', color: 'var(--text-primary)' }}>
        Create New Campaign
      </h1>

      {/* Step Indicator */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
        {[1, 2, 3].map((s) => (
          <div
            key={s}
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 700,
              background: step === s ? 'var(--accent-primary-subtle)' : 'var(--surface-card)',
              color: step === s ? 'var(--accent-primary)' : 'var(--text-tertiary)',
              border: step === s ? '1px solid var(--accent-primary)' : '1px solid var(--border-subtle)',
              textAlign: 'center',
            }}
          >
            Step {s}: {s === 1 ? 'Details' : s === 2 ? 'Reward Tiers' : 'Review'}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ background: 'rgba(248,113,113,0.15)', border: '1px solid var(--status-error)', color: 'var(--status-error)', padding: 12, borderRadius: 8, marginBottom: 20, fontSize: 13 }}>
          {error}
        </div>
      )}

      {/* Step 1: Basics */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Campaign Title</label>
            <input type="text" maxLength={120} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Debut Studio LP Pressing & Vinyl Run" style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 14 }} />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Description (min 50 chars)</label>
            <textarea rows={5} maxLength={5000} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain your project, what the funds will be used for, and why fans should back it..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 14, resize: 'vertical' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Funding Goal (USD $)</label>
              <input type="number" min="10" max="10000" value={goalDollar} onChange={(e) => setGoalDollar(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 14 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 4 }}>Duration (Days)</label>
              <select value={deadlineDays} onChange={(e) => setDeadlineDays(e.target.value)} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 14 }}>
                <option value="14">14 Days</option>
                <option value="30">30 Days</option>
                <option value="45">45 Days</option>
                <option value="60">60 Days</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Step 2: Rewards */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Configured Reward Tiers</h3>
          {tiers.map((t) => (
            <div key={t.tierId} style={{ background: 'var(--surface-card)', padding: 14, borderRadius: 8, border: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: 14 }}>{t.title} — ${(t.amountCents / 100).toFixed(2)}</div>
                <div style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>{t.description}</div>
              </div>
              <button type="button" onClick={() => removeTier(t.tierId)} style={{ color: 'var(--status-error)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}>Remove</button>
            </div>
          ))}

          <div style={{ background: 'var(--surface-raised)', padding: 16, borderRadius: 8, border: '1px dashed var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text-secondary)' }}>+ Add Reward Tier</div>
            <input type="text" placeholder="Tier Title (e.g. Signed Vinyl LP)" value={newTierTitle} onChange={(e) => setNewTierTitle(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }} />
            <input type="text" placeholder="Description of what backer receives" value={newTierDesc} onChange={(e) => setNewTierDesc(e.target.value)} style={{ padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }} />
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <input type="number" min="1" placeholder="Amount ($)" value={newTierAmount} onChange={(e) => setNewTierAmount(e.target.value)} style={{ width: 120, padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', color: 'var(--text-primary)', fontSize: 13 }} />
              <button type="button" onClick={addTier} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: 6, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Add Tier</button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step === 3 && (
        <div style={{ background: 'var(--surface-card)', padding: 20, borderRadius: 12, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Review Campaign Details</h3>
          <div style={{ fontSize: 14 }}><strong>Title:</strong> {title}</div>
          <div style={{ fontSize: 14 }}><strong>Goal:</strong> ${goalDollar}</div>
          <div style={{ fontSize: 14 }}><strong>Duration:</strong> {deadlineDays} days</div>
          <div style={{ fontSize: 14 }}><strong>Description:</strong> {description}</div>
          <div style={{ fontSize: 14 }}><strong>Reward Tiers:</strong> {tiers.length} tiers configured</div>
        </div>
      )}

      {/* Navigation Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24 }}>
        {step > 1 ? (
          <button type="button" onClick={() => setStep((step - 1) as 1 | 2)} style={{ background: 'none', border: '1px solid var(--border-subtle)', color: 'var(--text-secondary)', padding: '10px 18px', borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Back</button>
        ) : <div />}

        {step < 3 ? (
          <button type="button" onClick={handleNext} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '10px 20px', borderRadius: 8, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Continue to Step {step + 1} →</button>
        ) : (
          <button type="button" onClick={handleSubmit} disabled={submitting} style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            {submitting ? 'Creating Draft...' : 'Create Draft Campaign'}
          </button>
        )}
      </div>
    </div>
  );
}
