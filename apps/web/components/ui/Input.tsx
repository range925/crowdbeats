/**
 * Crowdbeats V2 — Input Component (Phase 4)
 * Min height 52px, visible focus ring, error state, helper text.
 * Forwards ref for form libraries.
 */

'use client';

import React, { forwardRef, useId } from 'react';
import styles from './Input.module.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  errorText?: string;
  prefixIcon?: React.ReactNode;
  suffix?: React.ReactNode;
  fullWidth?: boolean;
}

export const CbInput = forwardRef<HTMLInputElement, InputProps>(
  function CbInput(
    {
      label,
      hint,
      errorText,
      prefixIcon,
      suffix,
      fullWidth = false,
      id: providedId,
      className = '',
      ...props
    },
    ref,
  ) {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const hintId = `${id}-hint`;
    const errorId = `${id}-error`;
    const hasError = Boolean(errorText);

    const describedBy = [
      hint && hintId,
      hasError && errorId,
    ]
      .filter(Boolean)
      .join(' ') || undefined;

    return (
      <div
        className={[
          styles.wrapper,
          fullWidth ? styles.fullWidth : '',
          hasError ? styles.hasError : '',
          className,
        ]
          .filter(Boolean)
          .join(' ')}
      >
        {label && (
          <label htmlFor={id} className={styles.label}>
            {label}
          </label>
        )}
        <div className={styles.inputWrap}>
          {prefixIcon && (
            <span className={styles.prefix} aria-hidden="true">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            id={id}
            className={[styles.input, prefixIcon ? styles.hasPrefix : '', suffix ? styles.hasSuffix : ''].filter(Boolean).join(' ')}
            aria-describedby={describedBy}
            aria-invalid={hasError || undefined}
            {...props}
          />
          {suffix && (
            <span className={styles.suffix}>
              {suffix}
            </span>
          )}
        </div>
        {hint && !hasError && (
          <p id={hintId} className={styles.hint}>
            {hint}
          </p>
        )}
        {hasError && (
          <p id={errorId} className={styles.error} role="alert">
            <span aria-hidden="true" className={styles.errorIcon}>⚠</span>
            {' '}{errorText}
          </p>
        )}
      </div>
    );
  },
);
