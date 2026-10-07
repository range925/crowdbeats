/**
 * Crowdbeats V2 — resolveCreatorBySlug Cloud Function (Phase 2)
 *
 * Callable: resolveCreatorBySlug
 * Resolves a creator or band identity, canonical URL, and monetization readiness by slug.
 */

import * as admin from 'firebase-admin';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { resolveCreatorSlug } from './slugService.js';
import type { ResolveSlugResponse } from '@crowdbeats/contracts';

if (admin.apps.length === 0) admin.initializeApp();

function _db() {
  return admin.firestore();
}

export const resolveCreatorBySlug = onCall(
  { region: 'us-central1', enforceAppCheck: false },
  async (request): Promise<ResolveSlugResponse> => {
    const data = request.data as Record<string, unknown>;
    const slug = data?.['slug'];

    if (typeof slug !== 'string' || slug.trim().length === 0) {
      throw new HttpsError('invalid-argument', 'slug is required.');
    }

    return await resolveCreatorSlug(_db(), slug);
  },
);
