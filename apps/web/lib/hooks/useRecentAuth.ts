'use client';

import { useState, useCallback } from 'react';
import { isRecentAuthValid } from '@/lib/security/recentAuth';

interface RequireAuthOptions {
  title?: string;
  description?: string;
}

export function useRecentAuth() {
  const [isOpen, setIsOpen] = useState(false);
  const [pendingCallback, setPendingCallback] = useState<(() => void | Promise<void>) | null>(null);
  const [options, setOptions] = useState<RequireAuthOptions>({});

  const requireRecentAuth = useCallback(
    async (
      action: () => void | Promise<void>,
      actionOptions?: RequireAuthOptions
    ): Promise<boolean> => {
      // If already verified within the 5-minute window, execute directly!
      if (isRecentAuthValid()) {
        await action();
        return true;
      }

      // Otherwise queue the action and prompt user
      setPendingCallback(() => action);
      setOptions(actionOptions || {});
      setIsOpen(true);
      return false;
    },
    []
  );

  const handleSuccess = useCallback(async () => {
    if (pendingCallback) {
      await pendingCallback();
      setPendingCallback(null);
    }
    setIsOpen(false);
  }, [pendingCallback]);

  const handleClose = useCallback(() => {
    setPendingCallback(null);
    setIsOpen(false);
  }, []);

  return {
    isRecentAuthRequired: !isRecentAuthValid(),
    isReauthModalOpen: isOpen,
    reauthOptions: options,
    requireRecentAuth,
    handleReauthSuccess: handleSuccess,
    closeReauthModal: handleClose,
  };
}
