'use client';

import React, { useState, useEffect } from 'react';
import { AlertTriangleIcon, ShieldIcon, XIcon } from './AdminIcons';

export interface ActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  targetDescription: string;
  consequenceText?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  requiresReason?: boolean;
  reasonPlaceholder?: string;
  requiresDualApproval?: boolean;
  secondApproverRole?: string;
}

export const ActionDialog: React.FC<ActionDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  targetDescription,
  consequenceText,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  requiresReason = true,
  reasonPlaceholder = 'Enter operational or compliance rationale (required for audit log)...',
  requiresDualApproval = false,
  secondApproverRole = 'SUPER_ADMIN',
}) => {
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError(null);
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresReason && !reason.trim()) {
      setError('A documented rationale is mandatory for this privileged administrative action.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Action failed to complete.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="action-dialog-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 60,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={!isSubmitting ? onClose : undefined}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.55)',
          backdropFilter: 'blur(4px)',
        }}
        aria-hidden="true"
      />

      {/* Modal Card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 520,
          background: 'var(--admin-surface-card, #FFFFFF)',
          borderRadius: 14,
          border: '1px solid var(--admin-border-subtle, #E2E8F0)',
          boxShadow: '0 20px 48px rgba(0, 0, 0, 0.22)',
          zIndex: 10,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--admin-border-subtle, #E2E8F0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
            background: isDestructive
              ? 'rgba(239, 68, 68, 0.05)'
              : 'var(--admin-surface-raised, #F8FAFC)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {isDestructive ? (
              <span style={{ color: '#EF4444' }}>
                <AlertTriangleIcon size={20} />
              </span>
            ) : (
              <span style={{ color: 'var(--admin-accent-primary, #7C3AED)' }}>
                <ShieldIcon size={20} />
              </span>
            )}
            <h3
              id="action-dialog-title"
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: 'var(--admin-text-primary, #0F172A)',
                margin: 0,
              }}
            >
              {title}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            style={{
              background: 'transparent',
              border: 'none',
              padding: 4,
              color: 'var(--admin-text-tertiary, #94A3B8)',
              cursor: 'pointer',
            }}
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Target Description */}
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 8,
              background: 'var(--admin-surface-raised, #F1F5F9)',
              border: '1px solid var(--admin-border-subtle, #E2E8F0)',
              fontSize: 13,
              color: 'var(--admin-text-primary, #0F172A)',
              lineHeight: 1.5,
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--admin-text-secondary, #64748B)', display: 'block', fontSize: 11, textTransform: 'uppercase', marginBottom: 2 }}>
              Target Object
            </span>
            {targetDescription}
          </div>

          {/* Consequence Warning */}
          {consequenceText && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: isDestructive ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                border: `1px solid ${isDestructive ? 'rgba(239, 68, 68, 0.25)' : 'rgba(245, 158, 11, 0.25)'}`,
                fontSize: 12,
                color: isDestructive ? '#DC2626' : '#D97706',
                lineHeight: 1.4,
              }}
            >
              <strong>Impact & Consequence:</strong> {consequenceText}
            </div>
          )}

          {/* Dual Approval Callout */}
          {requiresDualApproval && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                fontSize: 12,
                color: 'var(--admin-accent-primary, #7C3AED)',
                lineHeight: 1.4,
              }}
            >
              <strong>Dual Approval Enforced:</strong> This action will be staged in the Pending Approval queue and requires secondary confirmation from a {secondApproverRole}.
            </div>
          )}

          {/* Reason Field */}
          {requiresReason && (
            <div>
              <label
                htmlFor="action-reason"
                style={{
                  display: 'block',
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'var(--admin-text-primary, #0F172A)',
                  marginBottom: 6,
                }}
              >
                Operational Rationale & Justification <span style={{ color: '#EF4444' }}>*</span>
              </label>
              <textarea
                id="action-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder={reasonPlaceholder}
                rows={3}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                  background: 'var(--admin-surface-card, #FFFFFF)',
                  color: 'var(--admin-text-primary, #0F172A)',
                  fontSize: 13,
                  fontFamily: 'inherit',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          )}

          {error && (
            <div style={{ color: '#DC2626', fontSize: 12, fontWeight: 500 }}>
              {error}
            </div>
          )}

          {/* Footer Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 10,
              marginTop: 8,
            }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--admin-border-subtle, #E2E8F0)',
                background: 'transparent',
                color: 'var(--admin-text-secondary, #64748B)',
                fontSize: 13,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                padding: '8px 18px',
                borderRadius: 8,
                border: 'none',
                background: isDestructive ? '#DC2626' : 'var(--admin-text-primary, #0F172A)',
                color: '#FFFFFF',
                fontSize: 13,
                fontWeight: 600,
                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                opacity: isSubmitting ? 0.7 : 1,
              }}
            >
              {isSubmitting ? 'Executing…' : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
