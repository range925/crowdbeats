import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const mockSet = jest.fn().mockResolvedValue({} as never);
const mockDelete = jest.fn().mockResolvedValue({} as never);
const mockGet = jest.fn().mockResolvedValue({ exists: false, data: () => ({}) } as never);
const mockAdd = jest.fn().mockResolvedValue({ id: 'audit_onboarding_1' } as never);
const mockCommit = jest.fn().mockResolvedValue({} as never);

const mockDoc = jest.fn(() => ({
  set: mockSet,
  get: mockGet,
  delete: mockDelete,
}));

const mockBatch = jest.fn(() => ({
  set: mockSet,
  delete: mockDelete,
  commit: mockCommit,
}));

const mockCollection = jest.fn(() => ({
  doc: mockDoc,
  add: mockAdd,
}));

jest.mock('firebase-admin', () => ({
  initializeApp: jest.fn(),
  apps: ['[DEFAULT]'],
  firestore: Object.assign(
    () => ({
      collection: mockCollection,
      doc: mockDoc,
      batch: mockBatch,
    }),
    {
      FieldValue: {
        serverTimestamp: () => 'MOCK_TIMESTAMP',
        arrayUnion: (item: any) => [item],
      },
    },
  ),
}));

import {
  checkHandleAvailability,
  saveOnboardingDraft,
  completeUniversalOnboarding,
} from '../onboardingCallables';

describe('Universal Onboarding Lifecycle & State Machine Callables', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('validates handle formatting and availability correctly', async () => {
    // 1. Invalid handle
    const resInvalid = await (checkHandleAvailability as any).run({
      auth: { uid: 'user_1' },
      data: { handle: 'ab' }, // too short
    });
    expect(resInvalid.available).toBe(false);

    // 2. Available handle
    mockGet.mockResolvedValueOnce({ exists: false } as never);
    const resValid = await (checkHandleAvailability as any).run({
      auth: { uid: 'user_1' },
      data: { handle: 'cool_musician' },
    });
    expect(resValid.available).toBe(true);
    expect(resValid.handle).toBe('cool_musician');
  });

  it('saves onboarding draft state to Firestore', async () => {
    const res = await (saveOnboardingDraft as any).run({
      auth: { uid: 'user_1' },
      data: {
        draftData: {
          status: 'personaSelected',
          currentStep: 3,
          primaryPersona: 'artist',
        },
      },
    });

    expect(res.ok).toBe(true);
    expect(mockSet).toHaveBeenCalled();
  });

  it('completes onboarding for Solo Musician and provisions profiles', async () => {
    const res = await (completeUniversalOnboarding as any).run({
      auth: { uid: 'musician_uid_1' },
      data: {
        primaryPersona: 'artist',
        displayName: 'Elena Vance',
        handle: 'elenavance',
        termsAcceptedVersion: '2026-08-25',
        privacyAcceptedVersion: '2026-08-25',
        marketingConsent: false,
        profileData: {
          stageName: 'Elena Vance Live',
          primaryGenre: 'Indie Pop',
          firstGoal: 'BUILD_PROFILE',
        },
      },
    });

    expect(res.ok).toBe(true);
    expect(res.primaryPersona).toBe('artist');
    expect(res.nextRoute).toBe('/artist');
    expect(mockCommit).toHaveBeenCalled();
    expect(mockAdd).toHaveBeenCalled();
  });

  it('rejects onboarding completion without required Terms of Service version', async () => {
    await expect(
      (completeUniversalOnboarding as any).run({
        auth: { uid: 'user_1' },
        data: {
          primaryPersona: 'fan',
          displayName: 'Test Fan',
          // Missing termsAcceptedVersion
        },
      }),
    ).rejects.toThrow('Terms and Privacy Policy version acceptances are mandatory');
  });

  it('rejects attempt by existing fan account to switch to creator role', async () => {
    mockGet.mockResolvedValueOnce({
      exists: true,
      data: () => ({ personaType: 'fan' }),
    } as never);

    await expect(
      (completeUniversalOnboarding as any).run({
        auth: { uid: 'fan_user_1' },
        data: {
          primaryPersona: 'artist',
          displayName: 'Attempted Solo Artist',
          termsAcceptedVersion: '2026-08-25',
          privacyAcceptedVersion: '2026-08-25',
        },
      }),
    ).rejects.toThrow('Fan accounts cannot switch to creator or performer roles');
  });
});

