/**
 * @jest-environment jsdom
 * 
 * Phase 12: Forms, Authentication, and Payment Flows Test Suite
 * Verifies responsive auth, onboarding wizards, canonical tip checkout,
 * fee disclosure transparency, Stripe Elements container styling,
 * touch targets, and mobile iOS auto-zoom prevention (fontSize >= 16px).
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import AuthPage from '../../app/auth/page';
import OnboardingWelcomePage from '../../app/onboarding/page';
import PersonaSelectionPage from '../../app/onboarding/persona/page';
import { PerformerTipClientView } from '../../app/tip/[id]/PerformerTipClientView';
import NewCampaignPage from '../../app/(creator)/creator/campaigns/new/page';
import { BackCampaignModal } from '../../app/discover/BackCampaignModal';
import * as authModule from '../../lib/hooks/useAuth';
import * as functionsModule from '../../lib/firebase/functions';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Helper to trigger React controlled input updates in JSDOM
function setInputValue(input: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = input instanceof HTMLTextAreaElement ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, 'value');
  descriptor?.set?.call(input, value);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

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
  usePathname: () => '/auth',
}));

// Mock Stripe
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue(null),
}));

jest.mock('@stripe/react-stripe-js', () => ({
  Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-stripe-elements">{children}</div>,
  CardElement: () => <div data-testid="mock-card-element" />,
  PaymentRequestButtonElement: () => <div data-testid="mock-payment-request" />,
  useStripe: () => null,
  useElements: () => null,
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
  saveUserConsent: jest.fn().mockResolvedValue(undefined),
}));

describe('Phase 12: Forms, Authentication, and Payment Flows', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockSearchParams = new URLSearchParams();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    jest.spyOn(authModule, 'useAuth').mockReturnValue({
      user: null,
      uid: null,
      status: 'unauthenticated',
      personaType: null,
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

  describe('1. Authentication Form Flows (/auth)', () => {
    it('renders login tab by default with accessible email/password inputs', async () => {
      await act(async () => {
        root.render(<AuthPage />);
      });

      const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
      const passwordInput = container.querySelector('input[type="password"]') as HTMLInputElement;
      expect(emailInput).not.toBeNull();
      expect(passwordInput).not.toBeNull();

      // Verify mobile touch target safety and form accessibility
      const form = container.querySelector('form');
      expect(form).not.toBeNull();

      // Submit button is present
      const submitBtn = container.querySelector('button[type="submit"]');
      expect(submitBtn).not.toBeNull();
    });

    it('allows switching between Sign In and Create Account tabs', async () => {
      await act(async () => {
        root.render(<AuthPage />);
      });

      const tabs = Array.from(container.querySelectorAll('button[role="tab"]')) as HTMLButtonElement[];
      expect(tabs.length).toBe(2);

      // Click Create Account tab
      const registerTab = tabs.find(t => t.textContent?.includes('Create Account') || t.textContent?.includes('Register'));
      expect(registerTab).toBeDefined();

      await act(async () => {
        registerTab?.click();
      });

      // Confirm Password field should appear in registration mode
      const passwordInputs = container.querySelectorAll('input[type="password"]');
      expect(passwordInputs.length).toBeGreaterThanOrEqual(2);
    });

    it('enforces password confirmation match before registration submission', async () => {
      await act(async () => {
        root.render(<AuthPage />);
      });

      const tabs = Array.from(container.querySelectorAll('button[role="tab"]')) as HTMLButtonElement[];
      const registerTab = tabs.find(t => t.textContent?.includes('Create Account') || t.textContent?.includes('Register'));

      await act(async () => {
        registerTab?.click();
      });

      const emailInput = container.querySelector('input[type="email"]') as HTMLInputElement;
      const passInputs = container.querySelectorAll('input[type="password"]');
      const pass1 = passInputs[0] as HTMLInputElement;
      const pass2 = passInputs[1] as HTMLInputElement;
      const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;

      await act(async () => {
        setInputValue(emailInput, 'mismatch@example.com');
        setInputValue(pass1, 'Password123!');
        setInputValue(pass2, 'DifferentPass456!');
      });

      await act(async () => {
        submitBtn.click();
      });

      // Error banner or alert must be rendered
      const alert = container.querySelector('[role="alert"]');
      expect(alert).not.toBeNull();
      expect(alert?.textContent?.toLowerCase()).toContain('match');
    });
  });

  describe('2. Onboarding Consent & Gate Validation (/onboarding)', () => {
    it('disables proceed button until both Terms of Service and Privacy are accepted', async () => {
      await act(async () => {
        root.render(<OnboardingWelcomePage />);
      });

      const proceedBtn = container.querySelector('button[type="button"]') as HTMLButtonElement;
      expect(proceedBtn.disabled).toBe(true);

      const checkboxes = Array.from(container.querySelectorAll('input[type="checkbox"]')) as HTMLInputElement[];
      expect(checkboxes.length).toBe(2);

      // Tick first checkbox
      await act(async () => {
        checkboxes[0].click();
      });
      expect(proceedBtn.disabled).toBe(true);

      // Tick second checkbox
      await act(async () => {
        checkboxes[1].click();
      });
      expect(proceedBtn.disabled).toBe(false);

      // Click proceed
      await act(async () => {
        proceedBtn.click();
      });
      expect(mockPush).toHaveBeenCalledWith('/onboarding/persona');
    });
  });

  describe('3. Onboarding Persona Selection (/onboarding/persona)', () => {
    it('renders all personas and navigates to chosen persona wizard', async () => {
      // Mock authenticated session so persona picker doesn't redirect to /auth
      jest.spyOn(authModule, 'useAuth').mockReturnValue({
        user: { uid: 'u123' },
        uid: 'u123',
        status: 'authenticated',
        personaType: null,
        loading: false,
        error: null,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
        clearError: jest.fn(),
        refreshAuth: jest.fn(),
      } as any);

      await act(async () => {
        root.render(<PersonaSelectionPage />);
      });

      // Role options should be visible: Fan, Solo Musician, Band, Sponsor, Venue
      expect(container.textContent).toContain('Fan');
      expect(container.textContent).toContain('Solo Musician');
      expect(container.textContent).toContain('Band');

      // Click Solo Musician (#role-card-artist)
      const artistCard = container.querySelector('#role-card-artist') as HTMLButtonElement;
      expect(artistCard).not.toBeNull();

      await act(async () => {
        artistCard.click();
      });

      const continueBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Continue')
      );
      expect(continueBtn).toBeDefined();

      await act(async () => {
        continueBtn?.click();
      });

      expect(mockPush).toHaveBeenCalledWith('/onboarding/artist');
    });
  });

  describe('4. Canonical Performer Tip Flow (/tip/[id])', () => {
    const mockPerformer = {
      performerId: 'artist_maya_lin',
      performerType: 'artist' as const,
      displayName: 'Maya Lin',
      slug: 'maya-lin',
      avatarUrl: 'https://cdn.crowdbeats.app/maya.jpg',
      bio: 'Soulful acoustic songwriting and live looping.',
      genres: ['Indie Folk', 'Acoustic'],
      isVerified: true,
      isLive: true,
      currentVenueName: 'The Casbah',
      canAcceptTips: true,
      canonicalTipUrl: 'https://crowdbeats.app/tip/artist_maya_lin',
    };

    beforeEach(() => {
      jest.spyOn(functionsModule, 'callCallableFunction').mockImplementation(async (name: string) => {
        if (name === 'resolvePerformerRecipient') {
          return mockPerformer as any;
        }
        throw new Error(`Unexpected function ${name}`);
      });
    });

    it('renders preset tip buttons, fee transparency breakdown, and guest auth gate', async () => {
      await act(async () => {
        root.render(<PerformerTipClientView id="maya-lin" />);
      });

      // Performer information
      expect(container.textContent).toContain('Maya Lin');
      expect(container.textContent).toContain('Live Now');

      // Preset buttons: $5, $10, $20
      expect(container.textContent).toContain('$5');
      expect(container.textContent).toContain('$10');
      expect(container.textContent).toContain('$20');

      // 6% Platform technology fee transparency notice must be presented
      expect(container.textContent).toContain('6%');

      // Tip CTA button reflects default $10 preset
      const tipBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Tip $10'));
      expect(tipBtn).toBeDefined();
    });

    it('updates calculation dynamically when tip presets are selected in guest flow', async () => {
      await act(async () => {
        root.render(<PerformerTipClientView id="maya-lin" />);
      });

      const presetBtns = Array.from(container.querySelectorAll('button')).filter(
        (b) => b.textContent === '$5' || b.textContent === '$10' || b.textContent === '$20'
      );
      expect(presetBtns.length).toBe(3);

      // Click $20
      await act(async () => {
        presetBtns[2].click();
      });

      // CTA button should now reflect the selected $20 amount
      const tipBtn = Array.from(container.querySelectorAll('button')).find(b => b.textContent?.includes('Tip $20'));
      expect(tipBtn).toBeDefined();
    });

    it('renders authenticated checkout form and CardElement when user is signed in', async () => {
      jest.spyOn(authModule, 'useAuth').mockReturnValue({
        user: { uid: 'u123' },
        uid: 'u123',
        status: 'authenticated',
        personaType: 'fan',
        loading: false,
        error: null,
        login: jest.fn(),
        signup: jest.fn(),
        logout: jest.fn(),
        clearError: jest.fn(),
        refreshAuth: jest.fn(),
      } as any);

      await act(async () => {
        root.render(<PerformerTipClientView id="maya-lin" />);
      });

      // Submit button should reflect the confirm tip flow
      const submitBtn = container.querySelector('button[type="submit"]') as HTMLButtonElement;
      expect(submitBtn?.textContent).toContain('Confirm $10.00 Tip');

      // Card element mock should be present
      const cardElement = container.querySelector('[data-testid="mock-card-element"]');
      expect(cardElement).not.toBeNull();
    });
  });

  describe('5. Campaign Creation Multi-Step Form Wizard', () => {
    it('validates campaign details in Step 1 and advances through wizard steps', async () => {
      await act(async () => {
        root.render(<NewCampaignPage />);
      });

      expect(container.textContent).toContain('Create New Campaign');
      expect(container.textContent).toContain('Step 1: Details');

      const titleInput = container.querySelector('input[type="text"]') as HTMLInputElement;
      const descInput = container.querySelector('textarea') as HTMLTextAreaElement;
      const nextBtn = Array.from(container.querySelectorAll('button')).find(
        (b) => b.textContent?.includes('Continue')
      ) as HTMLButtonElement;

      // Inputs have fontSize: 16 (prevents mobile auto-zoom)
      expect(titleInput.style.fontSize).toBe('16px');
      expect(descInput.style.fontSize).toBe('16px');

      // Try next with empty fields -> should show error
      await act(async () => {
        nextBtn.click();
      });
      expect(container.textContent).toContain('Title must be between');

      // Fill valid Step 1 data
      await act(async () => {
        setInputValue(titleInput, 'Acoustic Dreams EP Vinyl Pressing');
        setInputValue(descInput, 'We are funding our first studio recorded vinyl release with 5 exclusive new tracks and deluxe liner notes!');
      });

      await act(async () => {
        nextBtn.click();
      });

      // Advanced to Step 2
      expect(container.textContent).toContain('Step 2: Reward Tiers');
      expect(container.textContent).toContain('Configured Reward Tiers');
    });
  });

  describe('6. Back Campaign Modal & Form Input Accessibility', () => {
    it('renders BackCampaignModal with accessible 16px touch inputs', async () => {
      const mockCampaign = {
        campaignId: 'camp-1',
        title: 'Maya Lin Debut LP',
        creatorId: 'art-maya-lin',
        creatorType: 'artist' as const,
        creatorName: 'Maya Lin',
        category: 'Acoustic Indie',
        description: 'Debut studio album funding campaign.',
        goalCents: 500000,
        pledgedCents: 320000,
        percentFunded: 64,
        backerCount: 42,
        status: 'active' as const,
        daysRemaining: 18,
      };

      await act(async () => {
        root.render(<BackCampaignModal campaign={mockCampaign as any} onClose={jest.fn()} />);
      });

      expect(container.textContent).toContain('Backing Campaign');
      expect(container.textContent).toContain('Maya Lin Debut LP');

      const customInput = container.querySelector('input[type="number"]') as HTMLInputElement;
      expect(customInput).not.toBeNull();
      expect(customInput.style.fontSize).toBe('16px');

      const noteTextarea = container.querySelector('textarea') as HTMLTextAreaElement;
      expect(noteTextarea).not.toBeNull();
      expect(noteTextarea.style.fontSize).toBe('16px');
    });
  });
});
