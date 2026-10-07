/**
 * Crowdbeats V2 — Button Component (Phase 4)
 *
 * Requirements:
 * - Min 44×44px touch target (WCAG 2.5.8)
 * - All variants use semantic tokens — no raw colors
 * - Keyboard-focusable, visible focus ring
 * - ARIA: aria-disabled, aria-busy
 * - No color-only state distinction
 */

import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
  fullWidth?: boolean;
}

export function CbButton({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leadingIcon,
  trailingIcon,
  fullWidth = false,
  children,
  disabled,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      className={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth ? styles.fullWidth : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      aria-busy={isLoading}
    >
      {isLoading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : leadingIcon ? (
        <span className={styles.icon} aria-hidden="true">
          {leadingIcon}
        </span>
      ) : null}
      <span className={styles.label}>
        {isLoading ? 'Loading…' : children}
      </span>
      {!isLoading && trailingIcon && (
        <span className={styles.icon} aria-hidden="true">
          {trailingIcon}
        </span>
      )}
    </button>
  );
}
