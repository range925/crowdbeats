'use client';

/**
 * Crowdbeats V2 — Stitch Authoritative Outline Button (Project 5326179813018056505)
 */

import React from 'react';

export interface CbOutlineButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  isFullWidth?: boolean;
}

export const CbOutlineButton: React.FC<CbOutlineButtonProps> = ({
  label,
  leadingIcon,
  trailingIcon,
  isFullWidth = false,
  className = '',
  disabled,
  ...props
}) => {
  return (
    <button
      type={props.type || 'button'}
      disabled={disabled}
      aria-label={props['aria-label'] || label}
      aria-disabled={disabled}
      className={`inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full font-semibold border-2 border-[#7C3AED] bg-transparent text-white py-2.5 px-5 text-sm transition-all duration-150 active:scale-[0.98] hover:bg-[rgba(124,58,237,0.15)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7C3AED] disabled:border-[#2B2D44] disabled:text-[#64748B] disabled:cursor-not-allowed ${
        isFullWidth ? 'w-full' : ''
      } ${className}`}
      {...props}
    >
      <div className="flex items-center justify-center gap-2">
        {leadingIcon && <span className="flex-shrink-0">{leadingIcon}</span>}
        <span>{label}</span>
        {trailingIcon && <span className="flex-shrink-0">{trailingIcon}</span>}
      </div>
    </button>
  );
};
