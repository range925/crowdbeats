'use client';

/**
 * Crowdbeats V2 — Stitch Authoritative Pill Button (Project 5326179813018056505)
 * Full-width or inline vibrant purple gradient CTA with glow shadow and loading state.
 */

import React from 'react';

export interface CbPillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  sublabel?: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  isLoading?: boolean;
  isFullWidth?: boolean;
  variant?: 'primary' | 'outline' | 'secondary';
}

export const CbPillButton: React.FC<CbPillButtonProps> = ({
  label,
  sublabel,
  leadingIcon,
  trailingIcon,
  isLoading = false,
  isFullWidth = true,
  variant = 'primary',
  className = '',
  disabled,
  ...props
}) => {
  const isEnabled = !disabled && !isLoading;

  let baseStyle = 'relative inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full font-semibold transition-all duration-150 active:scale-[0.98] select-none text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED]';
  let sizeStyle = isFullWidth ? 'w-full py-4 px-6 text-base' : 'py-3 px-6 text-sm';

  let variantStyle = '';
  if (variant === 'primary') {
    variantStyle = isEnabled
      ? 'bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#9333EA] shadow-[0_8px_24px_-4px_rgba(124,58,237,0.45)] hover:shadow-[0_12px_28px_-4px_rgba(124,58,237,0.6)]'
      : 'bg-[#282A42] text-[#64748B] cursor-not-allowed';
  } else if (variant === 'outline') {
    variantStyle = isEnabled
      ? 'bg-transparent border-2 border-[#7C3AED] text-white hover:bg-[rgba(124,58,237,0.15)]'
      : 'bg-transparent border border-[#2B2D44] text-[#64748B] cursor-not-allowed';
  } else {
    variantStyle = isEnabled
      ? 'bg-[#1E2032] border border-[#2B2D44] text-white hover:bg-[#282A42]'
      : 'bg-[#151722] text-[#64748B] cursor-not-allowed';
  }

  return (
    <button
      type={props.type || 'button'}
      disabled={!isEnabled}
      aria-label={props['aria-label'] || (sublabel ? `${label}, ${sublabel}` : label)}
      aria-busy={isLoading}
      aria-disabled={!isEnabled}
      className={`${baseStyle} ${sizeStyle} ${variantStyle} ${className}`}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-5 w-5 text-white"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {leadingIcon && <span className="flex-shrink-0">{leadingIcon}</span>}
          <div className="flex flex-col items-center">
            <span>{label}</span>
            {sublabel && (
              <span className="text-[11px] font-normal text-white/80">{sublabel}</span>
            )}
          </div>
          {trailingIcon && <span className="flex-shrink-0">{trailingIcon}</span>}
        </div>
      )}
    </button>
  );
};
