/**
 * Crowdbeats V2 — Content Moderation Scanner (Phase 5)
 *
 * Implements real-time pattern scanning, risk scoring, zero-tolerance auto-quarantine,
 * and review queue ingestion.
 *
 * Compliance Invariants:
 * - High-confidence prohibited content (CSAM, terrorism, severe hate, carding) -> Auto-quarantine.
 * - Borderline content -> Enqueue for human review.
 * - Pre-payment tip screening -> Fails closed before Stripe charge intent creation.
 */

import * as admin from 'firebase-admin';
import { v4 as uuidv4 } from 'uuid';
import {
  ModerationState,
  ModeratedContentType,
  ModerationRiskCategory,
  type ScreenContentResult,
  type ModerationQueueItem,
} from '@crowdbeats/contracts';

// ── Zero-Tolerance & High-Risk Patterns ────────────────────────────────────────

const CSAM_RE = /\b(?:csam|child\s*porn|pedophil|pedo|underage\s*sex|minor\s*sex)\b/i;
const TERRORISM_RE = /\b(?:isis|al-qaeda|jihadist|bomb\s*threat|mass\s*shooting|kill\s*everyone|death\s*to\s*all)\b/i;
const SEVERE_HATE_RE = /\b(?:n[i1]gg[e3]r|f[a4]gg[o0]t|k[i1]ke|ch[i1]nk|g[o0]ok)\b/i;
const NON_CONSENSUAL_SEX_RE = /\b(?:revenge\s*porn|deepfake\s*nude|rape|non-consensual)\b/i;
const FRAUD_CARDING_RE = /\b(?:cvv\s*dump|carding\s*bin|fullz\s*shop|stolen\s*cc|free\s*crypto\s*bot)\b/i;
const SPAM_PROFANITY_RE = /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|cunt\w*|dick\w*|pussy\w*)\b/i;
const SPAM_PROFANITY_GLOBAL_RE = /\b(?:fuck\w*|shit\w*|bitch\w*|asshole\w*|cunt\w*|dick\w*|pussy\w*)\b/gi;

/**
 * Real-time text content screening function.
 */
export function screenTextContent(
  text: string,
  contentType: ModeratedContentType = ModeratedContentType.TIP_MESSAGE,
): ScreenContentResult {
  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return {
      passed: true,
      state: ModerationState.PASS,
      riskScore: 0.0,
      reasons: [],
      autoQuarantine: false,
      sanitizedText: '',
    };
  }

  const clean = text.trim();
  const reasons: string[] = [];

  // 1. Critical Zero-Tolerance: CSAM / CSAE
  if (CSAM_RE.test(clean)) {
    reasons.push('ZERO_TOLERANCE_CSAM_CSAE_DETECTED');
    return {
      passed: false,
      state: ModerationState.QUARANTINED,
      riskCategory: ModerationRiskCategory.CSAM_CSAE,
      riskScore: 1.0,
      reasons,
      autoQuarantine: true,
    };
  }

  // 2. Critical Zero-Tolerance: Violence & Terrorism
  if (TERRORISM_RE.test(clean)) {
    reasons.push('VIOLENCE_OR_TERRORISM_THREAT_DETECTED');
    return {
      passed: false,
      state: ModerationState.QUARANTINED,
      riskCategory: ModerationRiskCategory.VIOLENCE_TERRORISM,
      riskScore: 1.0,
      reasons,
      autoQuarantine: true,
    };
  }

  // 3. High Risk: Severe Hate Speech
  if (SEVERE_HATE_RE.test(clean)) {
    reasons.push('SEVERE_HATE_SPEECH_DETECTED');
    return {
      passed: false,
      state: ModerationState.QUARANTINED,
      riskCategory: ModerationRiskCategory.HATE_SPEECH_HARASSMENT,
      riskScore: 0.95,
      reasons,
      autoQuarantine: true,
    };
  }

  // 4. High Risk: Non-Consensual Sexual Imagery / Acts
  if (NON_CONSENSUAL_SEX_RE.test(clean)) {
    reasons.push('NON_CONSENSUAL_SEXUAL_CONTENT_DETECTED');
    return {
      passed: false,
      state: ModerationState.QUARANTINED,
      riskCategory: ModerationRiskCategory.NON_CONSENSUAL_SEXUAL,
      riskScore: 0.95,
      reasons,
      autoQuarantine: true,
    };
  }

  // 5. High Risk: Financial Fraud & Carding
  if (FRAUD_CARDING_RE.test(clean)) {
    reasons.push('FRAUD_OR_CARDING_SOLICITATION_DETECTED');
    return {
      passed: false,
      state: ModerationState.QUARANTINED,
      riskCategory: ModerationRiskCategory.FRAUD_SCAM,
      riskScore: 0.9,
      reasons,
      autoQuarantine: true,
    };
  }

  // 6. Medium Risk / Gray-Area: General Profanity or Spam
  if (SPAM_PROFANITY_RE.test(clean)) {
    reasons.push('POTENTIALLY_INAPPROPRIATE_LANGUAGE');
    const sanitized = clean.replace(SPAM_PROFANITY_GLOBAL_RE, '***');
    return {
      passed: true,
      state: ModerationState.FLAGGED,
      riskCategory: ModerationRiskCategory.GENERAL_PROFANITY,
      riskScore: 0.45,
      reasons,
      autoQuarantine: false,
      sanitizedText: sanitized,
    };
  }

  // 7. Clean / Low-Risk
  return {
    passed: true,
    state: ModerationState.PASS,
    riskScore: 0.0,
    reasons: [],
    autoQuarantine: false,
    sanitizedText: clean,
  };
}

/**
 * Enqueues a content item into the centralized Firestore moderation queue (/moderationQueue).
 */
export async function enqueueModerationItem(
  db: admin.firestore.Firestore,
  params: {
    contentId: string;
    contentType: ModeratedContentType;
    authorUid: string;
    textSnippet?: string;
    mediaUrl?: string;
    targetCreatorId?: string;
    screenResult: ScreenContentResult;
  },
): Promise<ModerationQueueItem> {
  const { contentId, contentType, authorUid, textSnippet, mediaUrl, targetCreatorId, screenResult } = params;

  const queueItemId = uuidv4();
  const now = new Date().toISOString();

  const item: ModerationQueueItem = {
    queueItemId,
    contentId,
    contentType,
    textSnippet: textSnippet ? textSnippet.substring(0, 500) : undefined,
    mediaUrl,
    authorUid,
    targetCreatorId,
    state: screenResult.state,
    riskCategory: screenResult.riskCategory,
    riskScore: screenResult.riskScore,
    flaggedReasons: screenResult.reasons,
    autoQuarantined: screenResult.autoQuarantine,
    createdAt: now,
    updatedAt: now,
  };

  const queueRef = db.collection('moderationQueue').doc(queueItemId);
  await queueRef.set({
    ...item,
    serverCreatedAt: admin.firestore.FieldValue.serverTimestamp(),
  });

  return item;
}
