import { PermissionsAndroid, Platform } from 'react-native';

import TijoriSms from '../../modules/tijori-sms';
import type { RawSms } from './types';

export type SmsPermissionResult = 'granted' | 'denied' | 'blocked';

/** SMS access needs Android plus our native module (i.e. a development/release build, not Expo Go). */
export function isSmsSupported(): boolean {
  return Platform.OS === 'android' && TijoriSms != null;
}

export async function hasSmsPermission(): Promise<boolean> {
  if (!isSmsSupported()) return false;
  return PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_SMS);
}

export async function requestSmsPermission(): Promise<SmsPermissionResult> {
  const result = await PermissionsAndroid.requestMultiple([
    PermissionsAndroid.PERMISSIONS.READ_SMS,
    PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
  ]);
  const read = result[PermissionsAndroid.PERMISSIONS.READ_SMS];
  if (read === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
  if (read === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) return 'blocked';
  return 'denied';
}

export async function readInbox(sinceMillis: number): Promise<RawSms[]> {
  if (!TijoriSms) throw new Error('SMS reading is only available in the Android app build.');
  return TijoriSms.readInboxAsync(sinceMillis);
}

/** Calls `onMessage` for each bank-looking SMS received while the app is running. */
export function addSmsListener(onMessage: (sms: RawSms) => void): { remove: () => void } {
  if (!TijoriSms) return { remove: () => {} };
  return TijoriSms.addListener('onSmsReceived', onMessage);
}
