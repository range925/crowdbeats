// Crowdbeats V2 — Firebase Admin Initializer (Phase 6)
// Server-only utility. Idempotent — safe to call in multiple Server Components.

import * as admin from 'firebase-admin';

export function initAdmin(): void {
  if (admin.apps.length === 0) {
    admin.initializeApp();
  }
}
