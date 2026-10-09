/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { PrivacyConsentWidget } from '../../components/compliance/PrivacyConsentWidget';
import {
  PRIVACY_CONSENT_STORAGE_KEY,
  resetConsentForTesting,
  CURRENT_PRIVACY_VERSION,
} from '../../lib/compliance/privacyConsent';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

describe('PrivacyConsentWidget (First-Time Visit vs Post-Consent Removal)', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    localStorage.clear();
    resetConsentForTesting();
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);

    // Default: not inside an iframe
    Object.defineProperty(window, 'self', {
      value: window,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'top', {
      value: window,
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
    localStorage.clear();
    resetConsentForTesting();
  });

  it('renders statutory consent banner on first-time visit when no prior consent exists', async () => {
    await act(async () => {
      root.render(<PrivacyConsentWidget />);
    });

    const banner = container.querySelector('[aria-label="Privacy & Statutory Consent Banner"]');
    expect(banner).not.toBeNull();
    expect(container.textContent).toContain('Your Privacy Rights & Statutory Consent Choice');
    expect(container.textContent).toContain('Accept All & Agree');
    expect(container.textContent).toContain('Limit to Essential Only');
    expect(container.textContent).toContain('Customize Rights');
  });

  it('removes Privacy & CCPA widget completely after user clicks "Accept All & Agree"', async () => {
    await act(async () => {
      root.render(<PrivacyConsentWidget />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const acceptBtn = buttons.find(b => b.textContent?.includes('Accept All & Agree'));
    expect(acceptBtn).toBeDefined();

    await act(async () => {
      acceptBtn?.click();
    });

    // Banner is dismissed
    expect(container.querySelector('[aria-label="Privacy & Statutory Consent Banner"]')).toBeNull();
    // Persistent floating button/badge is NOT rendered
    expect(container.textContent).not.toContain('Privacy & CCPA');
    expect(container.children.length).toBe(0);

    // Verify localStorage has stored affirmative consent
    const stored = JSON.parse(localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY) || '{}');
    expect(stored.status).toBe('accepted_all');
  });

  it('removes Privacy & CCPA widget completely after user clicks "Limit to Essential Only"', async () => {
    await act(async () => {
      root.render(<PrivacyConsentWidget />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const limitBtn = buttons.find(b => b.textContent?.includes('Limit to Essential Only'));
    expect(limitBtn).toBeDefined();

    await act(async () => {
      limitBtn?.click();
    });

    expect(container.querySelector('[aria-label="Privacy & Statutory Consent Banner"]')).toBeNull();
    expect(container.textContent).not.toContain('Privacy & CCPA');
    expect(container.children.length).toBe(0);

    const stored = JSON.parse(localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY) || '{}');
    expect(stored.status).toBe('essential_only');
    expect(stored.analytics).toBe(false);
  });

  it('removes Privacy & CCPA widget completely after user customizes and saves choices', async () => {
    await act(async () => {
      root.render(<PrivacyConsentWidget />);
    });

    const buttons = Array.from(container.querySelectorAll('button'));
    const customizeBtn = buttons.find(b => b.textContent?.includes('Customize Rights'));
    expect(customizeBtn).toBeDefined();

    await act(async () => {
      customizeBtn?.click();
    });

    // Modal is opened
    expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    const saveBtn = Array.from(container.querySelectorAll('button')).find(b =>
      b.textContent?.includes('Save My Privacy Settings')
    );
    expect(saveBtn).toBeDefined();

    await act(async () => {
      saveBtn?.click();
    });

    // After saving, modal is closed and no floating button exists
    expect(container.querySelector('[role="dialog"]')).toBeNull();
    expect(container.querySelector('[aria-label="Privacy & Statutory Consent Banner"]')).toBeNull();
    expect(container.textContent).not.toContain('Privacy & CCPA');
    expect(container.children.length).toBe(0);

    const stored = JSON.parse(localStorage.getItem(PRIVACY_CONSENT_STORAGE_KEY) || '{}');
    expect(stored.status).toBe('custom');
  });

  it('does NOT render any widget if user has already agreed on a previous visit', async () => {
    localStorage.setItem(
      PRIVACY_CONSENT_STORAGE_KEY,
      JSON.stringify({
        version: CURRENT_PRIVACY_VERSION,
        status: 'accepted_all',
        timestamp: new Date().toISOString(),
        strictlyNecessary: true,
        analytics: true,
        ephemeralGeolocation: true,
        doNotSellOrShare: true,
        ccpaSection1798Acknowledged: true,
        gdprArticle15Acknowledged: true,
      })
    );

    await act(async () => {
      root.render(<PrivacyConsentWidget />);
    });

    expect(container.querySelector('[aria-label="Privacy & Statutory Consent Banner"]')).toBeNull();
    expect(container.textContent).not.toContain('Privacy & CCPA');
    expect(container.children.length).toBe(0);
  });

  it('does NOT render widget when embedded in an iframe (e.g. mobile preview)', async () => {
    Object.defineProperty(window, 'self', {
      value: {},
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'top', {
      value: {},
      writable: true,
      configurable: true,
    });

    await act(async () => {
      root.render(<PrivacyConsentWidget />);
    });

    expect(container.querySelector('[aria-label="Privacy & Statutory Consent Banner"]')).toBeNull();
    expect(container.textContent).not.toContain('Privacy & CCPA');
    expect(container.children.length).toBe(0);
  });
});
