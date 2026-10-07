/**
 * Crowdbeats V2 — Public Discovery Eligibility Service
 *
 * Enforces server-authoritative validation for public visibility.
 * Decoupled from monetization eligibility (a demonetized creator may still remain publicly discoverable).
 */

import * as admin from 'firebase-admin';

export interface DiscoveryEligibilityResult {
  readonly isEligible: boolean;
  readonly reason?: string;
  readonly creatorType: 'artist' | 'band';
}

/**
 * Validates that a creator (artist or band) is legitimately eligible for public discovery.
 */
export async function assertCreatorPubliclyDiscoverable(
  db: admin.firestore.Firestore,
  creatorId: string,
  creatorType: 'artist' | 'band' = 'artist',
): Promise<DiscoveryEligibilityResult> {
  if (!creatorId || typeof creatorId !== 'string') {
    return {
      isEligible: false,
      reason: 'Invalid creator ID.',
      creatorType,
    };
  }

  if (creatorType === 'artist') {
    // 1. Check user account status
    const userDoc = await db.collection('users').doc(creatorId).get();
    if (!userDoc.exists) {
      return {
        isEligible: false,
        reason: 'User account does not exist.',
        creatorType,
      };
    }

    const userData = userDoc.data() ?? {};
    if (userData.isSuspended === true) {
      return {
        isEligible: false,
        reason: 'User account is suspended.',
        creatorType,
      };
    }
    if (userData.isTerminated === true || userData.status === 'TERMINATED') {
      return {
        isEligible: false,
        reason: 'User account is terminated.',
        creatorType,
      };
    }

    // 2. Check artist profile
    const profileDoc = await db.collection('artistProfiles').doc(creatorId).get();
    if (!profileDoc.exists) {
      return {
        isEligible: false,
        reason: 'Artist profile not found.',
        creatorType,
      };
    }

    const profileData = profileDoc.data() ?? {};
    if (profileData.isActive !== true) {
      return {
        isEligible: false,
        reason: 'Artist profile is not active.',
        creatorType,
      };
    }

    if (!profileData.stageName || typeof profileData.stageName !== 'string') {
      return {
        isEligible: false,
        reason: 'Artist profile missing stage name.',
        creatorType,
      };
    }

    // 3. Moderation check
    if (profileData.moderationStatus === 'SUSPENDED' || profileData.moderationStatus === 'TERMINATED') {
      return {
        isEligible: false,
        reason: 'Artist profile is restricted by moderation.',
        creatorType,
      };
    }

    return {
      isEligible: true,
      creatorType: 'artist',
    };
  } else {
    // Band check
    const bandDoc = await db.collection('bands').doc(creatorId).get();
    if (!bandDoc.exists) {
      return {
        isEligible: false,
        reason: 'Band does not exist.',
        creatorType,
      };
    }

    const bandData = bandDoc.data() ?? {};
    if (bandData.isActive !== true) {
      return {
        isEligible: false,
        reason: 'Band profile is not active.',
        creatorType,
      };
    }

    if (!bandData.name || typeof bandData.name !== 'string') {
      return {
        isEligible: false,
        reason: 'Band missing name.',
        creatorType,
      };
    }

    if (bandData.moderationStatus === 'SUSPENDED' || bandData.moderationStatus === 'TERMINATED') {
      return {
        isEligible: false,
        reason: 'Band is restricted by moderation.',
        creatorType,
      };
    }

    return {
      isEligible: true,
      creatorType: 'band',
    };
  }
}
