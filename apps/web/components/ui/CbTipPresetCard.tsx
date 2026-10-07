'use client';

/**
 * Crowdbeats V2 — Stitch Authoritative Tip Preset Card (Project 5326179813018056505)
 * Amount selector tile ($5, $10, $20, Custom) with glowing selected purple border.
 */

import React from 'react';

export interface CbTipPresetCardProps {
  amountLabel: string;
  isSelected: boolean;
  onSelect: () => void;
  icon?: React.ReactNode;
  badgeText?: string;
  className?: string;
}

export const CbTipPresetCard: React.FC<CbTipPresetCardProps> = ({
  amountLabel,
  isSelected,
  onSelect,
  icon,
  badgeText,
  className = '',
}) => {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`relative flex flex-col items-center justify-center p-3.5 rounded-2xl transition-all duration-150 active:scale-[0.97] bg-[#1E2032] ${
        isSelected
          ? 'border-2 border-[#7C3AED] shadow-[0_4px_16px_rgba(124,58,237,0.4)] text-white'
          : 'border border-[#2B2D44] text-[#94A3B8] hover:border-[#7C3AED]/50 hover:text-white'
      } ${className}`}
    >
      {badgeText && (
        <span className="absolute -top-2 -right-2 bg-[#7C3AED] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow">
          {badgeText}
        </span>
      )}
      <span className="text-lg font-bold tracking-tight">{amountLabel}</span>
      <span className="mt-1">
        {icon || (
          <svg
            className={`w-4 h-4 ${isSelected ? 'text-[#A855F7] fill-current' : 'text-[#64748B]'}`}
            fill={isSelected ? 'currentColor' : 'none'}
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
        )}
      </span>
    </button>
  );
};
