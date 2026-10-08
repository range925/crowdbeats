/**
 * Crowdbeats V2 — Creator Recovery Banner (Phase 10)
 *
 * Accessible, actionable recovery banner for web creators displaying:
 * - reconnecting (weak service, active retry, unexpired lease)
 * - needs_permission (browser geolocation denied or revoked)
 * - needs_reverification (exited venue bounds or lease interrupted)
 * - expired (session lease TTL passed)
 * - ended_by_admin (staff administrative force-end)
 */

'use client';

import React from 'react';
import type { CreatorRecoveryState } from '@crowdbeats/contracts';

export interface CreatorRecoveryBannerProps {
  recoveryState: CreatorRecoveryState;
  onRetry?: () => void;
  onRequestPermission?: () => void;
  onReverify?: () => void;
  onStartNewSession?: () => void;
  onContactSupport?: () => void;
  customMessage?: string;
}

export const CreatorRecoveryBanner: React.FC<CreatorRecoveryBannerProps> = ({
  recoveryState,
  onRetry,
  onRequestPermission,
  onReverify,
  onStartNewSession,
  onContactSupport,
  customMessage,
}) => {
  if (recoveryState === 'connected') {
    return null;
  }

  const configs: Record<
    Exclude<CreatorRecoveryState, 'connected'>,
    {
      title: string;
      description: string;
      actionLabel: string;
      onAction?: () => void;
      bannerClass: string;
      titleClass: string;
      buttonClass: string;
      icon: React.ReactNode;
    }
  > = {
    reconnecting: {
      title: 'Reconnecting Live Stream',
      description:
        customMessage ||
        'Connection interrupted. Retrying automatically with exponential backoff. Your live stage lease remains active.',
      actionLabel: 'Retry Now',
      onAction: onRetry,
      bannerClass: 'bg-amber-950/80 border-amber-500/60 text-amber-200',
      titleClass: 'text-amber-400',
      buttonClass: 'bg-amber-500 hover:bg-amber-400 text-black font-semibold',
      icon: (
        <span className="inline-block w-3 h-3 rounded-full bg-amber-400 animate-ping mr-2" />
      ),
    },
    needs_permission: {
      title: 'Location Permission Required',
      description:
        customMessage ||
        'Location access was blocked or denied in your browser. Enable location in site settings to share your live stage pin.',
      actionLabel: 'Enable Location',
      onAction: onRequestPermission,
      bannerClass: 'bg-orange-950/80 border-orange-500/60 text-orange-200',
      titleClass: 'text-orange-400',
      buttonClass: 'bg-orange-500 hover:bg-orange-400 text-black font-semibold',
      icon: <span className="mr-2 text-lg">⚠️</span>,
    },
    needs_reverification: {
      title: 'Re-verification Needed',
      description:
        customMessage ||
        'You exited the venue perimeter or your session lease was interrupted. Check in again to re-verify location.',
      actionLabel: 'Check In Now',
      onAction: onReverify,
      bannerClass: 'bg-blue-950/80 border-blue-500/60 text-blue-200',
      titleClass: 'text-blue-400',
      buttonClass: 'bg-blue-500 hover:bg-blue-400 text-black font-semibold',
      icon: <span className="mr-2 text-lg">📍</span>,
    },
    expired: {
      title: 'Session Expired',
      description:
        customMessage ||
        'Your live stage session lease has expired. Fans can no longer locate you on the map.',
      actionLabel: 'Start New Session',
      onAction: onStartNewSession,
      bannerClass: 'bg-zinc-900 border-zinc-700 text-zinc-300',
      titleClass: 'text-zinc-200',
      buttonClass: 'bg-zinc-700 hover:bg-zinc-600 text-white font-semibold',
      icon: <span className="mr-2 text-lg">⏱️</span>,
    },
    ended_by_admin: {
      title: 'Session Ended by Admin',
      description:
        customMessage ||
        'Your live session was terminated by Crowdbeats moderation. Private operational location coordinates were destroyed.',
      actionLabel: 'Contact Support',
      onAction: onContactSupport,
      bannerClass: 'bg-red-950/80 border-red-500/60 text-red-200',
      titleClass: 'text-red-400',
      buttonClass: 'bg-red-500 hover:bg-red-400 text-white font-semibold',
      icon: <span className="mr-2 text-lg">🛑</span>,
    },
  };

  const config = configs[recoveryState];

  return (
    <div
      role="alert"
      aria-live="polite"
      className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${config.bannerClass}`}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{config.icon}</div>
        <div>
          <h4 className={`text-base font-bold ${config.titleClass}`}>{config.title}</h4>
          <p className="text-sm opacity-90 mt-0.5">{config.description}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={config.onAction}
        className={`px-4 py-2 rounded-lg text-sm transition-colors whitespace-nowrap shadow-sm self-end sm:self-center ${config.buttonClass}`}
      >
        {config.actionLabel}
      </button>
    </div>
  );
};
