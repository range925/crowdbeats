'use client';

import React from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { LoadingState } from './LoadingState';

interface PermissionGateProps {
  allowedPersonas: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function PermissionGate({
  allowedPersonas,
  children,
  fallback,
}: PermissionGateProps) {
  const { status, personaType } = useAuth();

  if (status === 'loading') {
    return <LoadingState label="Checking permissions…" />;
  }

  const persona = personaType ?? '';
  const hasAccess = allowedPersonas.includes(persona);

  if (!hasAccess) {
    if (fallback !== undefined) {
      return <>{fallback}</>;
    }
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          padding: '48px 24px',
          gap: 12,
        }}
        role="alert"
        aria-live="assertive"
      >
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: '50%',
            backgroundColor: 'rgba(124, 58, 237, 0.12)',
            border: '1px solid rgba(124, 58, 237, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 24,
          }}
          role="img"
          aria-label="Access denied"
        >
          🔒
        </div>
        <h3
          style={{
            fontSize: 17,
            fontWeight: 700,
            color: 'var(--cb-text-primary, #FFFFFF)',
            margin: 0,
            fontFamily: 'Montserrat, sans-serif',
          }}
        >
          Access Denied
        </h3>
        <p
          style={{
            fontSize: 13,
            color: 'var(--cb-text-secondary, #94A3B8)',
            margin: 0,
            lineHeight: 1.55,
            maxWidth: 320,
          }}
        >
          You don&apos;t have permission to view this section. This area requires one of the following
          roles: {allowedPersonas.join(', ')}.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
