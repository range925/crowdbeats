/**
 * @jest-environment jsdom
 */

import React, { act } from 'react';
import { createRoot, Root } from 'react-dom/client';

(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;

import { CreatorRecoveryBanner } from '../../components/creator/CreatorRecoveryBanner';

describe('Phase 10 — CreatorRecoveryBanner JSDOM Component Tests', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('returns null when recoveryState is connected', () => {
    act(() => {
      root.render(<CreatorRecoveryBanner recoveryState="connected" />);
    });
    expect(container.firstChild).toBeNull();
  });

  it('renders reconnecting state with retry action', () => {
    const onRetry = jest.fn();
    act(() => {
      root.render(<CreatorRecoveryBanner recoveryState="reconnecting" onRetry={onRetry} />);
    });

    expect(container.textContent).toContain('Reconnecting Live Stream');
    expect(container.textContent).toContain('Retry Now');

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    act(() => {
      button.click();
    });
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('renders needs_permission state with permission request action', () => {
    const onRequestPermission = jest.fn();
    act(() => {
      root.render(
        <CreatorRecoveryBanner
          recoveryState="needs_permission"
          onRequestPermission={onRequestPermission}
        />,
      );
    });

    expect(container.textContent).toContain('Location Permission Required');
    expect(container.textContent).toContain('Enable Location');

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    act(() => {
      button.click();
    });
    expect(onRequestPermission).toHaveBeenCalledTimes(1);
  });

  it('renders needs_reverification state with check-in action', () => {
    const onReverify = jest.fn();
    act(() => {
      root.render(
        <CreatorRecoveryBanner
          recoveryState="needs_reverification"
          onReverify={onReverify}
        />,
      );
    });

    expect(container.textContent).toContain('Re-verification Needed');
    expect(container.textContent).toContain('Check In Now');

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    act(() => {
      button.click();
    });
    expect(onReverify).toHaveBeenCalledTimes(1);
  });

  it('renders expired state with start new session action', () => {
    const onStartNewSession = jest.fn();
    act(() => {
      root.render(
        <CreatorRecoveryBanner
          recoveryState="expired"
          onStartNewSession={onStartNewSession}
        />,
      );
    });

    expect(container.textContent).toContain('Session Expired');
    expect(container.textContent).toContain('Start New Session');

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    act(() => {
      button.click();
    });
    expect(onStartNewSession).toHaveBeenCalledTimes(1);
  });

  it('renders ended_by_admin state with contact support action', () => {
    const onContactSupport = jest.fn();
    act(() => {
      root.render(
        <CreatorRecoveryBanner
          recoveryState="ended_by_admin"
          onContactSupport={onContactSupport}
        />,
      );
    });

    expect(container.textContent).toContain('Session Ended by Admin');
    expect(container.textContent).toContain('Contact Support');

    const button = container.querySelector('button') as HTMLButtonElement;
    expect(button).not.toBeNull();
    act(() => {
      button.click();
    });
    expect(onContactSupport).toHaveBeenCalledTimes(1);
  });

  it('renders custom message when provided', () => {
    act(() => {
      root.render(
        <CreatorRecoveryBanner
          recoveryState="reconnecting"
          customMessage="Airplane mode detected. Reconnecting in 3s..."
        />,
      );
    });

    expect(container.textContent).toContain('Airplane mode detected. Reconnecting in 3s...');
  });
});
