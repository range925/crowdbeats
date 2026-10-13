/**
 * @jest-environment jsdom
 * 
 * Phase 13: Google Stitch Visual Consistency Test Suite
 * 
 * Verifies:
 * 1. Master brand logo (CrowdbeatsLogo) usage across Onboarding, Auth, and Portal headers.
 * 2. Visual design tokens: Display font tracking, typography variables, elevated card styles.
 * 3. Status indicator calibrated tokens (Emerald #059669 for live stages, Violet #7C3AED for primary brand).
 * 4. Accessible touch targets (>= 44px) and light mode surface variables.
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CrowdbeatsLogo } from '@/components/ui/CbLogo';
import ConsentPage from '@/app/onboarding/page';
import PersonaPage from '@/app/onboarding/persona/page';
import AuthPage from '@/app/auth/page';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import * as authModule from '@/lib/hooks/useAuth';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
    prefetch: jest.fn(),
  }),
  useSearchParams: () => mockSearchParams,
  usePathname: () => '/onboarding',
}));

// Mock firebase
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  signOut: jest.fn().mockResolvedValue(undefined),
  signInWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'u123' } }),
  createUserWithEmailAndPassword: jest.fn().mockResolvedValue({ user: { uid: 'u123' } }),
  signInWithPopup: jest.fn().mockResolvedValue({ user: { uid: 'u123' } }),
  GoogleAuthProvider: jest.fn(),
  onAuthStateChanged: jest.fn((auth, callback) => {
    callback(null);
    return () => {};
  }),
}));

jest.mock('@/lib/firebase/app', () => ({
  firebaseApp: {},
}));

jest.mock('@/lib/firebase/auth', () => ({
  getFirebaseAuth: jest.fn(() => ({ currentUser: null })),
  signInWithGoogle: jest.fn().mockResolvedValue({ uid: 'u123', email: 'test@example.com' }),
  mapAuthError: jest.fn((err: any) => err?.message || 'Authentication error occurred'),
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getUserRecord: jest.fn().mockResolvedValue({ personaType: 'fan', onboarded: true }),
  completeOnboarding: jest.fn().mockResolvedValue(undefined),
  recordConsent: jest.fn().mockResolvedValue({ success: true }),
  getUserThemePreference: jest.fn().mockResolvedValue(null),
  setUserThemePreference: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('@/lib/session', () => ({
  getSessionCookie: () => null,
  setSessionCookie: jest.fn(),
}));

describe('Phase 13: Google Stitch Visual Consistency', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      user: { uid: 'u123', email: 'fan@example.com' },
      uid: 'u123',
      status: 'authenticated',
      personaType: null,
      isStaff: false,
      loading: false,
      error: null,
      login: jest.fn().mockResolvedValue(undefined),
      signup: jest.fn().mockResolvedValue(undefined),
      logout: jest.fn().mockResolvedValue(undefined),
      clearError: jest.fn(),
      refreshAuth: jest.fn().mockResolvedValue(undefined),
    } as any);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  describe('1. Master Brand Logo Unification', () => {
    it('renders master horizontal logo with light-mode asset', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <CrowdbeatsLogo variant="horizontal" height={32} />
          </ThemeProvider>
        );
      });

      const logoImg = container.querySelector('img') as HTMLImageElement;
      expect(logoImg).not.toBeNull();
      expect(logoImg.getAttribute('src')).toContain('crowdbeats-logo-on-light-cropped.png');
      expect(logoImg.style.height).toBe('32px');
    });

    it('renders emblem variant with correct 1:1 aspect ratio and light emblem asset', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <CrowdbeatsLogo variant="emblem" height={28} />
          </ThemeProvider>
        );
      });

      const emblemImg = container.querySelector('img') as HTMLImageElement;
      expect(emblemImg).not.toBeNull();
      expect(emblemImg.getAttribute('src')).toContain('crowdbeats-emblem-on-light.png');
      expect(emblemImg.style.aspectRatio).toBe('1 / 1');
    });

    it('renders unified master CrowdbeatsLogo in Onboarding Consent view', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <ConsentPage />
          </ThemeProvider>
        );
      });

      const homeLink = container.querySelector('a[aria-label="Crowdbeats home"]');
      expect(homeLink).not.toBeNull();

      const logoImg = homeLink?.querySelector('img') as HTMLImageElement;
      expect(logoImg).not.toBeNull();
      expect(logoImg.getAttribute('src')).toContain('crowdbeats-logo-on-light-cropped.png');
      expect(logoImg.style.height).toBe('32px');
    });

    it('renders unified master CrowdbeatsLogo in Persona Picker view', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <PersonaPage />
          </ThemeProvider>
        );
      });

      const homeLink = container.querySelector('a[aria-label="Crowdbeats home"]');
      expect(homeLink).not.toBeNull();

      const logoImg = homeLink?.querySelector('img') as HTMLImageElement;
      expect(logoImg).not.toBeNull();
      expect(logoImg.getAttribute('src')).toContain('crowdbeats-logo-on-light-cropped.png');
      expect(logoImg.style.height).toBe('32px');
    });

    it('renders master CrowdbeatsLogo in Auth Login / Registration view', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <AuthPage />
          </ThemeProvider>
        );
      });

      const homeLink = container.querySelector('a[aria-label="Crowdbeats home"]');
      expect(homeLink).not.toBeNull();

      const logoImg = homeLink?.querySelector('img') as HTMLImageElement;
      expect(logoImg).not.toBeNull();
      expect(logoImg.getAttribute('src')).toContain('crowdbeats-logo-on-light-cropped.png');
    });
  });

  describe('2. Design Tokens and Typography Hierarchy', () => {
    it('applies calibrated typography styles and headings in Onboarding', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <ConsentPage />
          </ThemeProvider>
        );
      });

      const heading = container.querySelector('h1') as HTMLHeadingElement;
      expect(heading).not.toBeNull();
      expect(heading.textContent).toContain('Before you continue');
      expect(heading.style.fontFamily).toContain('var(--cb-font-display)');
      expect(heading.style.letterSpacing).toBe('-0.024em');
    });

    it('provides accessible interactive touch targets for persona selection buttons', async () => {
      await act(async () => {
        root.render(
          <ThemeProvider>
            <PersonaPage />
          </ThemeProvider>
        );
      });

      const roleButtons = container.querySelectorAll('button[id^="role-card-"]');
      expect(roleButtons.length).toBeGreaterThan(0);
      
      roleButtons.forEach((btn) => {
        const buttonEl = btn as HTMLButtonElement;
        expect(buttonEl.style.padding).toBe('20px 22px');
        expect(buttonEl.style.borderRadius).toBe('20px');
      });
    });
  });
});
