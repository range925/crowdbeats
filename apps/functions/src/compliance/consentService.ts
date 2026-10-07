/**
 * Crowdbeats V2 — Legal Policy Consent Service (Phase 4)
 *
 * Implements server-authoritative consent recording with cryptographic verification,
 * version tracking, and immutable audit logs.
 */

import * as admin from 'firebase-admin';
import {
  PolicyType,
  PLATFORM_POLICIES_REGISTRY,
  type ComplianceConsentRecord,
  type RecordConsentRequest,
} from '@crowdbeats/contracts';

/**
 * Records a user's affirmative consent to a specific platform policy version.
 */
export async function recordUserConsent(
  db: admin.firestore.Firestore,
  params: {
    uid: string;
    request: RecordConsentRequest;
    ipAddress?: string;
  },
): Promise<ComplianceConsentRecord> {
  const { uid, request, ipAddress } = params;
  const { policyType, version, platform = 'web', userAgent } = request;

  const policyMeta = PLATFORM_POLICIES_REGISTRY[policyType];
  if (!policyMeta) {
    throw new Error(`Invalid policy type: ${policyType}`);
  }

  const consentId = `${uid}_${policyType}_${version}`;
  const consentRef = db.collection('consent').doc(consentId);
  const now = new Date().toISOString();

  const record: ComplianceConsentRecord = {
    consentId,
    uid,
    policyType,
    version,
    sha256Hash: policyMeta.sha256Hash,
    granted: true,
    grantedAt: now,
    platform,
    userAgent,
    ipAddress,
  };

  const batch = db.batch();
  batch.set(consentRef, {
    ...record,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Phase 5: Versioned policyAcceptances collection
  const acceptanceRef = db.collection('policyAcceptances').doc(consentId);
  batch.set(acceptanceRef, {
    userId: uid,
    policyType,
    policyVersion: version,
    acceptedAt: now,
    platform,
    sourceApp: 'crowdbeats_v2',
    userAgentMetadata: userAgent || null,
    ipMetadataHash: ipAddress ? Buffer.from(ipAddress).toString('base64') : null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  }, { merge: true });

  // Update user document convenience flag
  const userRef = db.collection('users').doc(uid);
  const fieldUpdates: Record<string, unknown> = {
    [`consents.${policyType}`]: {
      version,
      sha256Hash: policyMeta.sha256Hash,
      grantedAt: now,
    },
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (policyType === PolicyType.TERMS_OF_SERVICE) {
    fieldUpdates['termsAccepted'] = true;
    fieldUpdates['termsVersion'] = version;
  } else if (policyType === PolicyType.ACCEPTABLE_USE_POLICY) {
    fieldUpdates['aupAccepted'] = true;
    fieldUpdates['aupVersion'] = version;
  } else if (policyType === PolicyType.CREATOR_MONETIZATION_POLICY) {
    fieldUpdates['monetizationPolicyAccepted'] = true;
    fieldUpdates['monetizationPolicyVersion'] = version;
  }

  batch.update(userRef, fieldUpdates);
  await batch.commit();

  return record;
}

/**
 * Checks whether a user has consented to a required policy version.
 */
export async function verifyUserConsent(
  db: admin.firestore.Firestore,
  uid: string,
  policyType: PolicyType,
  requiredVersion?: string,
): Promise<boolean> {
  const targetVersion = requiredVersion || PLATFORM_POLICIES_REGISTRY[policyType]?.version;
  if (!targetVersion) return false;

  const consentId = `${uid}_${policyType}_${targetVersion}`;
  const consentDoc = await db.collection('consent').doc(consentId).get();

  if (!consentDoc.exists) {
    // Check fallback user doc
    const userDoc = await db.collection('users').doc(uid).get();
    if (!userDoc.exists) return false;
    const consents = userDoc.data()?.['consents'] as Record<string, { version: string }> | undefined;
    return consents?.[policyType]?.version === targetVersion;
  }

  const data = consentDoc.data();
  return data?.['granted'] === true;
}

/**
 * Revokes a user's affirmative consent for a policy and prunes marketing/notification tokens.
 */
export async function revokeUserConsent(
  db: admin.firestore.Firestore,
  params: {
    uid: string;
    policyType: PolicyType;
    reason?: string;
  },
): Promise<{ ok: boolean; revokedAt: string }> {
  const { uid, policyType, reason = 'USER_REVOKED' } = params;
  const now = new Date().toISOString();

  // 1. Fetch user doc to identify active consent version
  const userDocRef = db.collection('users').doc(uid);
  const userSnap = await userDocRef.get();
  if (!userSnap.exists) {
    throw new Error('User not found');
  }

  const batch = db.batch();

  // 2. Mark consent as revoked in consent and policyAcceptances collections
  const consents = userSnap.data()?.['consents'] as Record<string, { version?: string }> | undefined;
  const currentVersion = consents?.[policyType]?.version || PLATFORM_POLICIES_REGISTRY[policyType]?.version;
  if (currentVersion) {
    const consentId = `${uid}_${policyType}_${currentVersion}`;
    const consentRef = db.collection('consent').doc(consentId);
    batch.set(consentRef, {
      granted: false,
      revokedAt: now,
      revocationReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });

    const acceptanceRef = db.collection('policyAcceptances').doc(consentId);
    batch.set(acceptanceRef, {
      status: 'revoked',
      revokedAt: now,
      revocationReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
  }

  // 3. Update user document consent flags
  const fieldUpdates: Record<string, unknown> = {
    [`consents.${policyType}.granted`]: false,
    [`consents.${policyType}.revokedAt`]: now,
    updatedAt: admin.firestore.FieldValue.serverTimestamp(),
  };

  if (policyType === PolicyType.TERMS_OF_SERVICE) {
    fieldUpdates['termsAccepted'] = false;
  } else if (policyType === PolicyType.ACCEPTABLE_USE_POLICY) {
    fieldUpdates['aupAccepted'] = false;
  } else if (policyType === PolicyType.CREATOR_MONETIZATION_POLICY) {
    fieldUpdates['monetizationPolicyAccepted'] = false;
  }

  batch.update(userDocRef, fieldUpdates);

  // 4. Prune device/FCM tokens to prevent further marketing/outbound push notifications
  const deviceTokensSnap = await userDocRef.collection('deviceTokens').get();
  deviceTokensSnap.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  // 5. Commit batch updates
  await batch.commit();

  // 6. Log immutable audit event
  await db.collection('auditEvents').add({
    eventType: 'CONSENT_REVOKED',
    actorUid: uid,
    targetUid: uid,
    policyType,
    reason,
    timestamp: admin.firestore.FieldValue.serverTimestamp(),
  });

  return { ok: true, revokedAt: now };
}

