/**
 * Crowdbeats V2 — AI Summary Service Unit Tests
 *
 * Validates:
 * 1. Target word count range (8 to 18 words).
 * 2. Anti-hallucination protection rejecting unverified awards/labels.
 * 3. Safe deterministic fallback on minimal bio or forbidden tokens.
 * 4. Solo artist and band summary differentiation.
 */

import {
  generateAiProfileSummary,
  validateSummary,
  FALLBACK_ARTIST_SUMMARY,
  FALLBACK_BAND_SUMMARY,
} from '../aiSummaryService.js';

describe('AI Profile Summary Generation Service', () => {
  describe('Word Count & Length Enforcement (8–18 words)', () => {
    test('validates summary within 8 to 18 words', () => {
      const validText = 'Indie-folk storyteller blending warm acoustic guitar with late-night California energy.';
      const result = validateSummary(validText);
      expect(result.isValid).toBe(true);
      expect(result.wordCount).toBe(10);
    });

    test('rejects summaries shorter than 8 words', () => {
      const shortText = 'Great indie guitar artist.';
      const result = validateSummary(shortText);
      expect(result.isValid).toBe(false);
      expect(result.wordCount).toBe(4);
      expect(result.reason).toContain('Too short');
    });

    test('rejects summaries longer than 18 words', () => {
      const longText =
        'This is an exceptionally long summary designed specifically to test if the anti-hallucination and brevity filter correctly catches sentences that exceed the maximum allowed length of eighteen words in total.';
      const result = validateSummary(longText);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Too long');
    });
  });

  describe('Anti-Hallucination Token Blacklist', () => {
    test('rejects unverified awards (Grammy, Platinum, Billboard)', () => {
      const grammySummary = 'Grammy winning artist performing intimate acoustic guitar and heartfelt ballads across California.';
      const result = validateSummary(grammySummary);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Contains unverified token: grammy');
    });

    test('rejects unverified record deals (Signed to, Major label)', () => {
      const signedSummary = 'Indie rock band signed to major label delivering energetic live stage performances.';
      const result = validateSummary(signedSummary);
      expect(result.isValid).toBe(false);
      expect(result.reason).toContain('Contains unverified token');
    });
  });

  describe('Deterministic Fallback Generation', () => {
    test('generates safe fallback for solo artist with empty bio', () => {
      const summary = generateAiProfileSummary({
        creatorId: 'art_123',
        type: 'artist',
        stageName: 'New Artist',
        bio: '',
        genres: ['Folk'],
      });

      expect(summary.aiCardSummary).toBe(FALLBACK_ARTIST_SUMMARY);
      expect(summary.aiSummaryStatus).toBe('ACTIVE');
      expect(summary.wordCount).toBeGreaterThanOrEqual(8);
      expect(summary.wordCount).toBeLessThanOrEqual(18);
    });

    test('generates safe fallback for band with minimal bio', () => {
      const summary = generateAiProfileSummary({
        creatorId: 'band_123',
        type: 'band',
        stageName: 'New Band',
        bio: 'Rock',
        genres: ['Rock'],
      });

      expect(summary.aiCardSummary).toBe(FALLBACK_BAND_SUMMARY);
      expect(summary.aiSummaryStatus).toBe('ACTIVE');
      expect(summary.wordCount).toBeGreaterThanOrEqual(8);
      expect(summary.wordCount).toBeLessThanOrEqual(18);
    });

    test('generates contextual musical summary when public bio is present', () => {
      const summary = generateAiProfileSummary({
        creatorId: 'art_jake_rios',
        type: 'artist',
        stageName: 'Jake Rios',
        bio: 'Acoustic guitarist with deep California roots playing intimate venues.',
        genres: ['Indie Folk', 'Acoustic'],
        city: 'Torrance',
      });

      expect(summary.wordCount).toBeGreaterThanOrEqual(8);
      expect(summary.wordCount).toBeLessThanOrEqual(18);
      expect(summary.aiCardSummary).toContain('Indie Folk');
      expect(summary.aiCardSummary).toContain('Torrance');
    });
  });
});
