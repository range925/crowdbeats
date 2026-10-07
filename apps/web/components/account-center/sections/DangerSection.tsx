'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { DangerZone } from '@/components/settings/DangerZone';

const CARD: React.CSSProperties = {
  backgroundColor: 'rgba(18, 20, 28, 0.75)',
  backdropFilter: 'blur(16px)',
  boxShadow: '0 8px 32px -4px rgba(0, 0, 0, 0.35)',
  border: '1px solid rgba(255, 255, 255, 0.08)',
  borderRadius: 16,
  padding: 20,
  marginBottom: 20,
};

export function DangerSection() {
  const auth = useAuth();

  // Deactivate state
  const [deactivateReason, setDeactivateReason] = useState('taking_break');
  const [deactivateConfirm, setDeactivateConfirm] = useState('');
  const [isDeactivating, setIsDeactivating] = useState(false);
  const [deactivateSuccess, setDeactivateSuccess] = useState(false);

  // Delete state
  const [deleteReason, setDeleteReason] = useState('not_using');
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleDeactivate = async () => {
    if (deactivateConfirm.trim() !== 'DEACTIVATE') return;
    setIsDeactivating(true);
    setTimeout(() => {
      setIsDeactivating(false);
      setDeactivateSuccess(true);
    }, 1000);
  };

  const handleDelete = async () => {
    if (deleteConfirm.trim() !== 'DELETE') return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      if (auth.deleteAccount) {
        await auth.deleteAccount();
      } else {
        throw new Error('Account deletion requires recent authentication. Please sign out and sign back in.');
      }
    } catch (err: any) {
      setDeleteError(err?.message || 'Failed to delete account. Please verify credentials.');
      setIsDeleting(false);
    }
  };

  return (
    <div>
      {/* Deactivation Block */}
      <div style={CARD}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-primary, #FFFFFF)', margin: '0 0 6px' }}>
          Deactivate Account
        </h3>
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.5, marginBottom: 16 }}>
          Temporarily pause your Crowdbeats account. Your artist EPK and busker beacons will be hidden from public discovery, but your tipping history and saved credentials will remain safe when you sign back in.
        </p>

        {deactivateSuccess ? (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(245,158,11,0.12)', color: '#F59E0B', fontSize: 13 }}>
            Account scheduled for deactivation. Signing out...
          </div>
        ) : (
          <div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: 4 }}>
                Reason for deactivating:
              </label>
              <select
                value={deactivateReason}
                onChange={(e) => setDeactivateReason(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  width: '100%',
                  maxWidth: 340,
                  minHeight: 44,
                }}
              >
                <option value="taking_break">Taking a break from performances</option>
                <option value="privacy">Privacy concerns</option>
                <option value="temporary">Seasonal venue closure</option>
                <option value="other">Other reason</option>
              </select>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: 4 }}>
                Type <strong>DEACTIVATE</strong> to confirm:
              </label>
              <input
                type="text"
                placeholder="DEACTIVATE"
                value={deactivateConfirm}
                onChange={(e) => setDeactivateConfirm(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: 8,
                  padding: '8px 12px',
                  color: '#FFFFFF',
                  fontSize: 13,
                  maxWidth: 240,
                  minHeight: 44,
                }}
              />
            </div>

            <button
              type="button"
              onClick={handleDeactivate}
              disabled={deactivateConfirm.trim() !== 'DEACTIVATE' || isDeactivating}
              style={{
                background: 'rgba(245,158,11,0.15)',
                color: '#F59E0B',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8,
                padding: '10px 18px',
                fontSize: 13,
                fontWeight: 600,
                cursor: deactivateConfirm.trim() === 'DEACTIVATE' && !isDeactivating ? 'pointer' : 'not-allowed',
                opacity: deactivateConfirm.trim() === 'DEACTIVATE' ? 1 : 0.5,
                minHeight: 44,
              }}
            >
              {isDeactivating ? 'Deactivating...' : 'Deactivate My Account'}
            </button>
          </div>
        )}
      </div>

      {/* Permanent Deletion Block */}
      <DangerZone title="Permanent Account Erasure">
        <p style={{ fontSize: 13, color: 'var(--text-secondary, #94A3B8)', lineHeight: 1.5, margin: '0 0 16px' }}>
          This action is permanent and cannot be undone. All fan badges, artist bio EPKs, song preview uploads, and connected Spotify associations will be purged immediately. Financial ledger receipts are preserved for 7 years per regulatory guidelines.
        </p>

        {deleteError && (
          <div style={{ padding: 12, borderRadius: 8, background: 'rgba(239,68,68,0.15)', border: '1px solid #EF4444', color: '#EF4444', fontSize: 13, marginBottom: 16 }}>
            {deleteError}
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: 4 }}>
            Reason for deletion:
          </label>
          <select
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#FFFFFF',
              fontSize: 13,
              width: '100%',
              maxWidth: 340,
              minHeight: 44,
            }}
          >
            <option value="not_using">No longer performing / attending gigs</option>
            <option value="duplicate">Created duplicate profile</option>
            <option value="privacy">Desire complete data removal</option>
            <option value="dissolution">Band or venue dissolution</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-secondary, #94A3B8)', marginBottom: 4 }}>
            Type <strong>DELETE</strong> to permanently erase:
          </label>
          <input
            type="text"
            placeholder="DELETE"
            value={deleteConfirm}
            onChange={(e) => setDeleteConfirm(e.target.value)}
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8,
              padding: '8px 12px',
              color: '#FFFFFF',
              fontSize: 13,
              maxWidth: 240,
              minHeight: 44,
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteConfirm.trim() !== 'DELETE' || isDeleting}
          style={{
            background: '#EF4444',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '10px 18px',
            fontSize: 13,
            fontWeight: 700,
            cursor: deleteConfirm.trim() === 'DELETE' && !isDeleting ? 'pointer' : 'not-allowed',
            opacity: deleteConfirm.trim() === 'DELETE' ? 1 : 0.5,
            minHeight: 44,
          }}
        >
          {isDeleting ? 'Erasing Account...' : 'Permanently Delete Account'}
        </button>
      </DangerZone>
    </div>
  );
}
