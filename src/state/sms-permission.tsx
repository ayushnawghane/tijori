import { createContext, use, useCallback, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { hasSmsPermission, isSmsSupported, requestSmsPermission } from '@/lib/sms';

/**
 * - checking: first check hasn't finished (splash stays up)
 * - blocked: user chose "Don't ask again" — only Settings can fix it
 * - unsupported: iOS, web or Expo Go — no SMS access possible
 */
export type SmsPermissionStatus = 'checking' | 'granted' | 'denied' | 'blocked' | 'unsupported';

type SmsPermissionContextValue = {
  status: SmsPermissionStatus;
  request: () => Promise<void>;
};

const SmsPermissionContext = createContext<SmsPermissionContextValue | null>(null);

async function readStatus(): Promise<'granted' | 'denied' | 'unsupported'> {
  if (!isSmsSupported()) return 'unsupported';
  return (await hasSmsPermission()) ? 'granted' : 'denied';
}

export function SmsPermissionProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<SmsPermissionStatus>('checking');

  useEffect(() => {
    let active = true;
    const refresh = () =>
      readStatus().then((next) => {
        if (!active) return;
        // Android can't tell "denied" from "blocked" without asking again, so keep "blocked".
        setStatus((prev) => (next === 'denied' && prev === 'blocked' ? 'blocked' : next));
      });

    refresh();
    // Re-check when returning from system Settings.
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      active = false;
      subscription.remove();
    };
  }, []);

  const request = useCallback(async () => {
    setStatus(await requestSmsPermission());
  }, []);

  return <SmsPermissionContext value={{ status, request }}>{children}</SmsPermissionContext>;
}

export function useSmsPermission(): SmsPermissionContextValue {
  const value = use(SmsPermissionContext);
  if (!value) throw new Error('useSmsPermission must be used inside SmsPermissionProvider');
  return value;
}
