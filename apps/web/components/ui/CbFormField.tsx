'use client';

/**
 * Crowdbeats V2 — Stitch Authoritative Form Field (Project 5326179813018056505)
 * Dark rounded input field with leading icon and validation state.
 */

import React, { useState } from 'react';

export interface CbFormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  leadingIcon?: React.ReactNode;
  trailing?: React.ReactNode;
  isValid?: boolean;
  validationText?: string;
  helperText?: string;
}

export const CbFormField: React.FC<CbFormFieldProps> = ({
  label,
  leadingIcon,
  trailing,
  isValid,
  validationText,
  helperText,
  className = '',
  id,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputId = id || `cb-field-${label.toLowerCase().replace(/\s+/g, '-')}`;

  let borderColor = 'border-[#2B2D44]';
  if (isFocused) {
    borderColor = 'border-[#7C3AED] ring-1 ring-[#7C3AED]';
  } else if (isValid === false) {
    borderColor = 'border-[#EF4444]';
  } else if (isValid === true) {
    borderColor = 'border-[#10B981]';
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-medium text-[#94A3B8]">
          {label}
        </label>
        {validationText && (
          <span
            className={`text-xs font-semibold ${
              isValid ? 'text-[#10B981]' : 'text-[#EF4444]'
            }`}
          >
            {validationText}
          </span>
        )}
      </div>
      <div
        className={`relative flex items-center bg-[#1E2032] rounded-xl border transition-all duration-150 ${borderColor} ${className}`}
      >
        {leadingIcon && (
          <div className="pl-3.5 pr-2 text-[#64748B] flex-shrink-0">{leadingIcon}</div>
        )}
        <input
          id={inputId}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className="w-full bg-transparent py-3 px-3.5 text-sm text-white placeholder-[#64748B] focus:outline-none"
          {...props}
        />
        {trailing ? (
          <div className="pr-3.5 flex-shrink-0">{trailing}</div>
        ) : isValid === true ? (
          <div className="pr-3.5 text-[#10B981] flex-shrink-0">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        ) : null}
      </div>
      {helperText && <p className="text-xs text-[#64748B]">{helperText}</p>}
    </div>
  );
};
