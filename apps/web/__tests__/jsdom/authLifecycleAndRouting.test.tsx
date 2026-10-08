/**
 * @jest-environment jsdom
 */
/**
 * Crowdbeats V2 — Authentication Lifecycle & Routing Tests (jsdom)
 *
 * Verifies:
 * 1. Persona → dashboard routing for all 6 personas:
 *    - Fan → /fan
 *    - Solo Musician (artist) → /creator/dashboard
 *    - Band Member (band_member) → /creator/dashboard
 *    - Venue Manager (venue_manager) → /venue
 *    - Sponsor (sponsor_rep) → /sponsor
 *    - Platform Admin (staff) → /admin/dashboard
 * 2. Return URL safety:
 *    - Relative paths preserved
 *    - Tipping action and amount query params correctly appended
 *    - Self-referencing /auth routes prevented from causing redirect loops
 *    - Malicious external / protocol-relative URLs blocked
 * 3. Theme mode persistence without form input loss:
 *    - Form fields retain values across Light, Dark, and System theme switches
 *    - ThemeProvider correctly toggles data-theme and preserves input state
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { getPersonaDashboard, getSafeReturnUrl } from '@/app/auth/page';
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

// Mock Next.js navigation
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
}));

// Mock Firebase auth & firestore
jest.mock('@/lib/firebase/auth', () => ({
  getFirebaseAuth: () => ({ currentUser: null }),
  signIn: jest.fn(),
  register: jest.fn(),
  signOut: jest.fn(),
  requestPasswordReset: jest.fn(),
  signInWithGoogle: jest.fn(),
  mapAuthError: (err: any) => err?.message ?? 'Authentication error',
}));

jest.mock('@/lib/firebase/firestore', () => ({
  getUserRecord: jest.fn().mockResolvedValue(null),
  getUserThemePreference: jest.fn().mockResolvedValue('light'),
  updateUserThemePreference: jest.fn().mockResolvedValue(undefined),
}));

describe('Auth Routing & Persona Resolution', () => {
  describe('getPersonaDashboard', () => {
    it('routes Fan to /fan', () => {
      expect(getPersonaDashboard('fan')).toBe('/fan');
    });

    it('routes Solo Musician (artist) to /creator/dashboard', () => {
      expect(getPersonaDashboard('artist')).toBe('/creator/dashboard');
    });

    it('routes Band Member (band_member) to /creator/dashboard', () => {
      expect(getPersonaDashboard('band_member')).toBe('/creator/dashboard');
    });

    it('routes Venue Manager to /venue', () => {
      expect(getPersonaDashboard('venue_manager')).toBe('/venue');
    });

    it('routes Sponsor Rep to /sponsor', () => {
      expect(getPersonaDashboard('sponsor_rep')).toBe('/sponsor');
    });

    it('routes Platform Admin (staff) to /admin/dashboard', () => {
      expect(getPersonaDashboard('staff')).toBe('/admin/dashboard');
    });

    it('falls back safely to /onboarding for null or unrecognized personas', () => {
      expect(getPersonaDashboard(null)).toBe('/onboarding');
      expect(getPersonaDashboard('unknown_role' as any)).toBe('/onboarding');
    });
  });

  describe('getSafeReturnUrl', () => {
    it('preserves valid relative returnUrl', () => {
      const params = new URLSearchParams('returnUrl=/discover');
      expect(getSafeReturnUrl(params as any, 'fan')).toBe('/discover');
    });

    it('preserves returnTo parameter', () => {
      const params = new URLSearchParams('returnTo=/artist/elena-cruz');
      expect(getSafeReturnUrl(params as any, 'fan')).toBe('/artist/elena-cruz');
    });

    it('preserves return parameter and appends tipCents when action=tip is requested', () => {
      const params = new URLSearchParams('return=/tip/art_maya_lin&tipCents=2500');
      expect(getSafeReturnUrl(params as any, 'fan')).toBe('/tip/art_maya_lin?action=tip&tipCents=2500');
    });

    it('blocks redirect loop when returnUrl is /auth', () => {
      const params = new URLSearchParams('returnUrl=/auth');
      expect(getSafeReturnUrl(params as any, 'artist')).toBe('/creator/dashboard');
    });

    it('blocks redirect loop when returnUrl points to /auth/verify-email or subroutes', () => {
      const params = new URLSearchParams('returnUrl=/auth/verify-email');
      expect(getSafeReturnUrl(params as any, 'fan')).toBe('/fan');
    });

    it('rejects open external redirects (absolute HTTP/HTTPS)', () => {
      const params = new URLSearchParams('returnUrl=https://malicious-site.com/steal-cookie');
      expect(getSafeReturnUrl(params as any, 'fan')).toBe('/fan');
    });

    it('rejects protocol-relative open redirects (//evil.com)', () => {
      const params = new URLSearchParams('returnUrl=//evil.com/phishing');
      expect(getSafeReturnUrl(params as any, 'fan')).toBe('/fan');
    });

    it('returns correct persona dashboard when no return URL is provided', () => {
      const params = new URLSearchParams('');
      expect(getSafeReturnUrl(params as any, 'artist')).toBe('/creator/dashboard');
      expect(getSafeReturnUrl(params as any, 'sponsor_rep')).toBe('/sponsor');
      expect(getSafeReturnUrl(params as any, 'staff')).toBe('/admin/dashboard');
    });
  });
});

describe('Theme Switching Without Form Reset', () => {
  let container: HTMLDivElement | null = null;
  let root: Root | null = null;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
    }
    if (container && container.parentNode) {
      container.parentNode.removeChild(container);
    }
    container = null;
    root = null;
  });

  function TestAuthForm() {
    const { themePreference, setThemePreference, resolvedTheme } = useTheme();
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');

    return (
      <div>
        <div id="resolved-theme">{resolvedTheme}</div>
        <div id="theme-pref">{themePreference}</div>
        <button id="set-dark" onClick={() => setThemePreference('dark')}>Dark</button>
        <button id="set-light" onClick={() => setThemePreference('light')}>Light</button>
        <button id="set-system" onClick={() => setThemePreference('system')}>System</button>

        <input
          id="email-input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
        />
        <input
          id="password-input"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
        />
      </div>
    );
  }

  it('preserves user input values when theme mode is switched between Light, Dark, and System', () => {
    act(() => {
      root!.render(
        <ThemeProvider>
          <TestAuthForm />
        </ThemeProvider>
      );
    });

    const emailInput = container!.querySelector('#email-input') as HTMLInputElement;
    const passwordInput = container!.querySelector('#password-input') as HTMLInputElement;
    const darkBtn = container!.querySelector('#set-dark') as HTMLButtonElement;
    const lightBtn = container!.querySelector('#set-light') as HTMLButtonElement;
    const systemBtn = container!.querySelector('#set-system') as HTMLButtonElement;
    const themeEl = container!.querySelector('#resolved-theme') as HTMLDivElement;

    // Simulate user entering credentials via React synthetic input setter
    const setInputValue = (input: HTMLInputElement, val: string) => {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
      setter.call(input, val);
      input.dispatchEvent(new Event('input', { bubbles: true }));
    };

    act(() => {
      setInputValue(emailInput, 'musician@crowdbeats.ai');
      setInputValue(passwordInput, 'SecretKey2026!');
    });

    expect(emailInput.value).toBe('musician@crowdbeats.ai');
    expect(passwordInput.value).toBe('SecretKey2026!');

    // Switch to Dark theme
    act(() => {
      darkBtn.click();
    });
    expect(themeEl.textContent).toBe('dark');
    expect(emailInput.value).toBe('musician@crowdbeats.ai');
    expect(passwordInput.value).toBe('SecretKey2026!');

    // Switch to Light theme
    act(() => {
      lightBtn.click();
    });
    expect(themeEl.textContent).toBe('light');
    expect(emailInput.value).toBe('musician@crowdbeats.ai');
    expect(passwordInput.value).toBe('SecretKey2026!');

    // Switch to System theme
    act(() => {
      systemBtn.click();
    });
    expect(emailInput.value).toBe('musician@crowdbeats.ai');
    expect(passwordInput.value).toBe('SecretKey2026!');
  });
});
