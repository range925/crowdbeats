'use client';

import React from 'react';
import { RbacRole, PermissionAction, hasPermission } from '@crowdbeats/contracts';

export interface PermissionGateProps {
  currentRole?: string | null;
  requiredAction?: PermissionAction;
  allowedRoles?: RbacRole[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({
  currentRole,
  requiredAction,
  allowedRoles,
  fallback = null,
  children,
}) => {
  if (!currentRole) return <>{fallback}</>;

  const role = currentRole as RbacRole;

  // Check action permission
  if (requiredAction) {
    const permitted = hasPermission(role, requiredAction);
    if (!permitted) return <>{fallback}</>;
  }

  // Check role list
  if (allowedRoles && allowedRoles.length > 0) {
    if (!allowedRoles.includes(role)) return <>{fallback}</>;
  }

  return <>{children}</>;
};
