/**
 * Crowdbeats V2 — Stitch Authoritative Live Status Badge (Project 5326179813018056505)
 * Glowing emerald green LIVE pill badge with animated pulsing dot.
 */

import React from 'react';

export interface CbLiveBadgeProps {
  label?: string;
  showPulse?: boolean;
  className?: string;
}

export const CbLiveBadge: React.FC<CbLiveBadgeProps> = ({
  label = 'LIVE',
  showPulse = true,
  className = '',
}) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#10B981] text-white text-[10px] font-extrabold tracking-wider shadow-[0_0_10px_rgba(16,185,129,0.5)] ${className}`}
    >
      {showPulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
      )}
      <span>{label}</span>
    </span>
  );
};
