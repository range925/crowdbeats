/**
 * Crowdbeats V2 — Admin Command Center Callables (Phase 7)
 *
 * Exposes server-authoritative onCall endpoint for the Admin Command Center.
 * Validates staff role permissions before returning operational telemetry.
 */

import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import type {
  GetAdminCommandCenterDataRequest,
  GetAdminCommandCenterDataResponse,
} from '@crowdbeats/contracts';
import { getAdminCommandCenterData } from './adminCommandCenterService';

const db = () => admin.firestore();

export const getAdminCommandCenterDataCallable = onCall<GetAdminCommandCenterDataRequest>(
  { region: 'us-central1' },
  async (request): Promise<GetAdminCommandCenterDataResponse> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'User must be authenticated.');
    }

    const { uid, token } = request.auth;
    const caller = {
      uid,
      platformRole: (token.platformRole as string) || null,
      isAdmin: token.admin === true || token.isAdmin === true,
    };

    const data = await getAdminCommandCenterData(db(), caller);
    return {
      ok: true,
      data,
    };
  }
);
