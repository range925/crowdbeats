'use client';

/**
 * Crowdbeats V2 — Shared Onboarding UI Components (Web)
 * 
 * Implements the colorful, focused component system adhering to the 
 * Crowdbeats provisional palette:
 * - Brand/primary: Violet #7C3AED
 * - Secondary discovery: Cyan #0891B2
 * - Creator energy: Amber #D97706
 * - Community/bands: Blue #2563EB
 * - Supporting expressive accent: Pink #DB2777
 * - Light canvas: #F7F8FC | Dark canvas: #101218 | Dark card: #1B1E28
 *
 * Full keyboard navigation, text scaling, ARIA compliance, and state support.
 */

import React from 'react';

// ─── 1. RoleCard ──────────────────────────────────────────────────────────────

export interface RoleCardProps {
  roleId: string;
  title: string;
  badge?: string;
  description: string;
  icon: string | React.ReactNode;
  accentColor: string;
  isSelected: boolean;
  onClick: () => void;
  benefits?: string[];
  disabled?: boolean;
}

export function RoleCard({
  roleId,
  title,
  badge,
  description,
  icon,
  accentColor,
  isSelected,
  onClick,
  benefits,
  disabled = false,
}: RoleCardProps) {
  return (
    <button
      type="button"
      id={`role-card-${roleId}`}
      aria-pressed={isSelected}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '20px 22px',
        borderRadius: 20,
        backgroundColor: isSelected ? 'rgba(124, 58, 237, 0.08)' : '#1B1E28',
        border: `2px solid ${isSelected ? accentColor : '#2B2D44'}`,
        boxShadow: isSelected
          ? `0 12px 28px -6px ${accentColor}33, 0 0 0 1px ${accentColor}`
          : '0 4px 16px rgba(0,0,0,0.3)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative',
        outline: 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 14,
              backgroundColor: `${accentColor}1F`,
              border: `1px solid ${accentColor}4D`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 24,
            }}
          >
            {icon}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#FFFFFF' }}>{title}</h3>
              {badge && (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: `${accentColor}26`,
                    color: accentColor,
                    border: `1px solid ${accentColor}66`,
                  }}
                >
                  {badge}
                </span>
              )}
            </div>
            <p style={{ margin: '4px 0 0', fontSize: 13, color: '#94A3B8', lineHeight: 1.4 }}>
              {description}
            </p>
          </div>
        </div>
        <div
          style={{
            width: 22,
            height: 22,
            borderRadius: '50%',
            border: `2px solid ${isSelected ? accentColor : '#52525B'}`,
            backgroundColor: isSelected ? accentColor : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'all 0.2s ease',
          }}
        >
          {isSelected && (
            <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
              <path d="M1 5L4.5 8.5L11 1.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </div>
      </div>

      {benefits && benefits.length > 0 && isSelected && (
        <div
          style={{
            marginTop: 6,
            paddingTop: 12,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
          }}
        >
          {benefits.map((b, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
              <span style={{ color: accentColor, fontSize: 14 }}>✦</span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  );
}

// ─── 2. GenreChip ─────────────────────────────────────────────────────────────

export interface GenreChipProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
  accentColor?: string;
  icon?: string;
}

export function GenreChip({
  label,
  isSelected,
  onClick,
  accentColor = '#7C3AED',
  icon,
}: GenreChipProps) {
  return (
    <button
      type="button"
      aria-pressed={isSelected}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '8px 16px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: 600,
        backgroundColor: isSelected ? accentColor : '#1E2032',
        color: isSelected ? '#FFFFFF' : '#CBD5E1',
        border: `1.5px solid ${isSelected ? accentColor : '#2B2D44'}`,
        boxShadow: isSelected ? `0 4px 14px ${accentColor}4D` : 'none',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        userSelect: 'none',
      }}
    >
      {icon && <span style={{ fontSize: 14 }}>{icon}</span>}
      <span>{label}</span>
      {isSelected && (
        <span style={{ fontSize: 12, marginLeft: 2 }}>✓</span>
      )}
    </button>
  );
}

// ─── 3. LocationCard ──────────────────────────────────────────────────────────

export interface LocationCardProps {
  currentCity?: string;
  onUseMyLocation: () => void;
  onSearchPlace: () => void;
  isLoadingLocation?: boolean;
  locationError?: string | null;
}

export function LocationCard({
  currentCity,
  onUseMyLocation,
  onSearchPlace,
  isLoadingLocation = false,
  locationError,
}: LocationCardProps) {
  return (
    <div
      style={{
        padding: 20,
        borderRadius: 20,
        backgroundColor: '#1B1E28',
        border: '1px solid #2B2D44',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: 'rgba(8, 145, 178, 0.15)',
            border: '1px solid rgba(8, 145, 178, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#0891B2',
            fontSize: 20,
          }}
        >
          📍
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>Find live music near you</h4>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: '#94A3B8' }}>
            {currentCity ? `Current anchor: ${currentCity}` : 'Select your coarse location to surface nearby stages.'}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          onClick={onUseMyLocation}
          disabled={isLoadingLocation}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            backgroundColor: 'rgba(8, 145, 178, 0.12)',
            border: '1.5px solid #0891B2',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: isLoadingLocation ? 'wait' : 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          {isLoadingLocation ? 'Locating...' : '🎯 Use my location'}
        </button>

        <button
          type="button"
          onClick={onSearchPlace}
          style={{
            padding: '12px 14px',
            borderRadius: 12,
            backgroundColor: '#151722',
            border: '1px solid #2B2D44',
            color: '#CBD5E1',
            fontSize: 13,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          🔍 Search a place
        </button>
      </div>

      {locationError && (
        <div style={{ fontSize: 12, color: '#F87171', padding: '6px 10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', borderRadius: 8 }}>
          {locationError}
        </div>
      )}
    </div>
  );
}

// ─── 4. ProgressHeader ────────────────────────────────────────────────────────

export interface ProgressHeaderProps {
  currentStep: number;
  totalSteps: number;
  stepName?: string;
  title: string;
  subtitle?: string;
  onBack?: () => void;
  accentColor?: string;
}

export function ProgressHeader({
  currentStep,
  totalSteps,
  stepName,
  title,
  subtitle,
  onBack,
  accentColor = '#7C3AED',
}: ProgressHeaderProps) {
  const pct = Math.round((currentStep / totalSteps) * 100);

  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            aria-label="Go back to previous step"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 500,
              padding: '6px 10px',
              borderRadius: 8,
              backgroundColor: '#1E2032',
            }}
          >
            ← Back
          </button>
        ) : <div />}

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.05em', color: accentColor, textTransform: 'uppercase' }}>
            {stepName || `Step ${currentStep} of ${totalSteps}`}
          </span>
          <span style={{ fontSize: 11, color: '#64748B' }}>({pct}%)</span>
        </div>
      </div>

      {/* Progress Track */}
      <div
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          width: '100%',
          height: 6,
          backgroundColor: '#27272A',
          borderRadius: 999,
          overflow: 'hidden',
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            backgroundColor: accentColor,
            borderRadius: 999,
            transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: `0 0 8px ${accentColor}80`,
          }}
        />
      </div>

      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
        {title}
      </h1>
      {subtitle && (
        <p style={{ margin: 0, fontSize: 14, color: '#94A3B8', lineHeight: 1.5 }}>
          {subtitle}
        </p>
      )}
    </div>
  );
}

// ─── 5. ProfilePhotoPicker ────────────────────────────────────────────────────

export interface ProfilePhotoPickerProps {
  photoUrl?: string | null;
  name: string;
  onPhotoSelected: (file: File) => void;
  onRemovePhoto?: () => void;
  isUploading?: boolean;
  accentColor?: string;
}

export function ProfilePhotoPicker({
  photoUrl,
  name,
  onPhotoSelected,
  onRemovePhoto,
  isUploading = false,
  accentColor = '#7C3AED',
}: ProfilePhotoPickerProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const getInitials = (n: string) => {
    const parts = n.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'CB';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginBottom: 24 }}>
      <div style={{ position: 'relative' }}>
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            overflow: 'hidden',
            backgroundColor: '#1E2032',
            border: `2px solid ${accentColor}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: `0 4px 20px ${accentColor}33`,
          }}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={name || 'Profile photo'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <span style={{ fontSize: 28, fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
              {getInitials(name)}
            </span>
          )}
        </div>

        <button
          type="button"
          aria-label="Upload photo"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: accentColor,
            color: '#FFFFFF',
            border: '2px solid #101218',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
          }}
        >
          📷
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPhotoSelected(f);
          }}
        />
      </div>

      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#FFFFFF', marginBottom: 2 }}>Profile Photo</div>
        <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', marginBottom: 8 }}>
          Optional. Shows on your public tips & follows.
        </p>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              fontSize: 12,
              fontWeight: 600,
              color: accentColor,
              cursor: 'pointer',
              textDecoration: 'underline',
            }}
          >
            {photoUrl ? 'Change photo' : 'Upload photo'}
          </button>
          {photoUrl && onRemovePhoto && (
            <button
              type="button"
              onClick={onRemovePhoto}
              style={{
                background: 'none',
                border: 'none',
                padding: 0,
                fontSize: 12,
                fontWeight: 600,
                color: '#EF4444',
                cursor: 'pointer',
              }}
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 6. SetupChecklist ────────────────────────────────────────────────────────

export interface ChecklistItem {
  id: string;
  title: string;
  subtitle: string;
  status: 'ready' | 'pending' | 'action_required' | 'blocked' | 'optional';
  actionLabel?: string;
  onAction?: () => void;
}

export function SetupChecklist({ items }: { items: ChecklistItem[] }) {
  const getStatusBadge = (status: ChecklistItem['status']) => {
    switch (status) {
      case 'ready':
        return { text: 'Ready', bg: 'rgba(16, 185, 129, 0.15)', color: '#10B981', border: '#10B98166' };
      case 'pending':
        return { text: 'In Review', bg: 'rgba(217, 119, 6, 0.15)', color: '#D97706', border: '#D9770666' };
      case 'action_required':
        return { text: 'Action Needed', bg: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', border: '#EF444466' };
      case 'blocked':
        return { text: 'Blocked', bg: 'rgba(100, 116, 139, 0.15)', color: '#94A3B8', border: '#94A3B866' };
      case 'optional':
        return { text: 'Optional', bg: 'rgba(8, 145, 178, 0.15)', color: '#0891B2', border: '#0891B266' };
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {items.map((it) => {
        const badge = getStatusBadge(it.status);
        return (
          <div
            key={it.id}
            style={{
              padding: '16px 18px',
              borderRadius: 16,
              backgroundColor: '#1B1E28',
              border: '1px solid #2B2D44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#FFFFFF' }}>{it.title}</span>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    padding: '2px 8px',
                    borderRadius: 999,
                    backgroundColor: badge.bg,
                    color: badge.color,
                    border: `1px solid ${badge.border}`,
                  }}
                >
                  {badge.text}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: '#94A3B8', lineHeight: 1.4 }}>
                {it.subtitle}
              </p>
            </div>

            {it.actionLabel && it.onAction && (
              <button
                type="button"
                onClick={it.onAction}
                style={{
                  padding: '8px 14px',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 600,
                  backgroundColor: it.status === 'action_required' ? '#D97706' : '#27272A',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'background-color 0.15s ease',
                }}
              >
                {it.actionLabel}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── 7. InlineValidation ──────────────────────────────────────────────────────

export interface InlineValidationProps {
  state: 'valid' | 'invalid' | 'checking' | 'idle';
  message?: string;
}

export function InlineValidation({ state, message }: InlineValidationProps) {
  if (state === 'idle' || !message) return null;

  const color = state === 'valid' ? '#10B981' : state === 'invalid' ? '#EF4444' : '#0891B2';
  const icon = state === 'valid' ? '✓' : state === 'invalid' ? '⚠️' : '⏳';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6, fontSize: 12, color }}>
      <span>{icon}</span>
      <span>{message}</span>
    </div>
  );
}

// ─── 8. StickyActionBar ───────────────────────────────────────────────────────

export interface StickyActionBarProps {
  primaryLabel: string;
  onPrimary: () => void;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondary?: () => void;
  disclaimer?: string;
  accentColor?: string;
}

export function StickyActionBar({
  primaryLabel,
  onPrimary,
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondary,
  disclaimer,
  accentColor = '#7C3AED',
}: StickyActionBarProps) {
  return (
    <div
      style={{
        marginTop: 32,
        paddingTop: 16,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {secondaryLabel && onSecondary && (
          <button
            type="button"
            onClick={onSecondary}
            style={{
              flex: 1,
              padding: '14px 20px',
              borderRadius: 14,
              backgroundColor: '#1E2032',
              border: '1px solid #2B2D44',
              color: '#CBD5E1',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
            }}
          >
            {secondaryLabel}
          </button>
        )}

        <button
          type="button"
          onClick={onPrimary}
          disabled={primaryDisabled || primaryLoading}
          style={{
            flex: 2,
            padding: '14px 20px',
            borderRadius: 14,
            backgroundColor: primaryDisabled ? '#27272A' : accentColor,
            color: primaryDisabled ? '#71717A' : '#FFFFFF',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            cursor: primaryDisabled || primaryLoading ? 'not-allowed' : 'pointer',
            boxShadow: primaryDisabled ? 'none' : `0 8px 24px -4px ${accentColor}66`,
            transition: 'all 0.15s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          {primaryLoading ? (
            <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
          ) : (
            primaryLabel
          )}
        </button>
      </div>

      {disclaimer && (
        <p style={{ margin: 0, textAlign: 'center', fontSize: 11, color: '#64748B', lineHeight: 1.4 }}>
          {disclaimer}
        </p>
      )}
    </div>
  );
}

// ─── 9. SuccessPanel ──────────────────────────────────────────────────────────

export interface SuccessPanelProps {
  title: string;
  subtitle: string;
  badge?: string;
  primaryCtaLabel: string;
  onPrimaryCta: () => void;
  checklistItems: { label: string; done: boolean }[];
  secondaryActions?: { label: string; icon: string; onClick: () => void }[];
  accentColor?: string;
}

export function SuccessPanel({
  title,
  subtitle,
  badge = 'Ready',
  primaryCtaLabel,
  onPrimaryCta,
  checklistItems,
  secondaryActions,
  accentColor = '#7C3AED',
}: SuccessPanelProps) {
  return (
    <div
      style={{
        padding: '32px 24px',
        borderRadius: 24,
        backgroundColor: '#1B1E28',
        border: '1px solid #2B2D44',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          backgroundColor: `${accentColor}26`,
          border: `2px solid ${accentColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 36,
          marginBottom: 16,
          boxShadow: `0 0 32px ${accentColor}4D`,
        }}
      >
        🎉
      </div>

      <div
        style={{
          display: 'inline-block',
          fontSize: 11,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          padding: '3px 10px',
          borderRadius: 999,
          backgroundColor: 'rgba(16, 185, 129, 0.15)',
          color: '#10B981',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          marginBottom: 10,
        }}
      >
        {badge}
      </div>

      <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>{title}</h2>
      <p style={{ margin: '0 0 24px', fontSize: 14, color: '#94A3B8', maxWidth: 380, lineHeight: 1.5 }}>
        {subtitle}
      </p>

      {/* Checklist */}
      <div
        style={{
          width: '100%',
          padding: 16,
          borderRadius: 16,
          backgroundColor: '#151722',
          border: '1px solid #2B2D44',
          marginBottom: 24,
          textAlign: 'left',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748B' }}>
          What you accomplished:
        </div>
        {checklistItems.map((it, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#E2E8F0' }}>
            <span style={{ color: it.done ? '#10B981' : '#D97706', fontSize: 14 }}>
              {it.done ? '✓' : '○'}
            </span>
            <span>{it.label}</span>
          </div>
        ))}
      </div>

      {/* Primary CTA */}
      <button
        type="button"
        onClick={onPrimaryCta}
        style={{
          width: '100%',
          padding: '16px 24px',
          borderRadius: 16,
          backgroundColor: accentColor,
          color: '#FFFFFF',
          fontSize: 15,
          fontWeight: 700,
          border: 'none',
          cursor: 'pointer',
          boxShadow: `0 8px 24px ${accentColor}66`,
          marginBottom: secondaryActions && secondaryActions.length > 0 ? 16 : 0,
        }}
      >
        {primaryCtaLabel}
      </button>

      {/* Secondary CTAs */}
      {secondaryActions && secondaryActions.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: `repeat(${secondaryActions.length}, 1fr)`, gap: 10, width: '100%' }}>
          {secondaryActions.map((sec, i) => (
            <button
              key={i}
              type="button"
              onClick={sec.onClick}
              style={{
                padding: '12px 14px',
                borderRadius: 12,
                backgroundColor: '#1E2032',
                border: '1px solid #2B2D44',
                color: '#CBD5E1',
                fontSize: 12,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6,
                cursor: 'pointer',
              }}
            >
              <span>{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── 10. PermissionExplainer ──────────────────────────────────────────────────

export interface PermissionExplainerProps {
  title: string;
  description: string;
  bulletPoints: string[];
  primaryActionLabel: string;
  onGrant: () => void;
  onDecline: () => void;
  declineLabel?: string;
  accentColor?: string;
}

export function PermissionExplainer({
  title,
  description,
  bulletPoints,
  primaryActionLabel,
  onGrant,
  onDecline,
  declineLabel = 'Not now',
  accentColor = '#0891B2',
}: PermissionExplainerProps) {
  return (
    <div
      style={{
        padding: 24,
        borderRadius: 20,
        backgroundColor: '#1B1E28',
        border: '1px solid #2B2D44',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            backgroundColor: `${accentColor}1F`,
            color: accentColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          📍
        </div>
        <div>
          <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#FFFFFF' }}>{title}</h4>
          <p style={{ margin: '2px 0 0', fontSize: 13, color: '#94A3B8' }}>{description}</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '12px 14px', backgroundColor: '#151722', borderRadius: 12 }}>
        {bulletPoints.map((pt, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 12, color: '#CBD5E1' }}>
            <span style={{ color: accentColor }}>✦</span>
            <span>{pt}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button
          type="button"
          onClick={onDecline}
          style={{
            flex: 1,
            padding: '12px 16px',
            borderRadius: 12,
            backgroundColor: '#1E2032',
            border: '1px solid #2B2D44',
            color: '#94A3B8',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {declineLabel}
        </button>

        <button
          type="button"
          onClick={onGrant}
          style={{
            flex: 2,
            padding: '12px 16px',
            borderRadius: 12,
            backgroundColor: accentColor,
            border: 'none',
            color: '#FFFFFF',
            fontSize: 13,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 14px ${accentColor}4D`,
          }}
        >
          {primaryActionLabel}
        </button>
      </div>
    </div>
  );
}
