import { NativeModule, requireOptionalNativeModule } from 'expo';

import { NativeSms, TijoriSmsModuleEvents } from './TijoriSms.types';

declare class TijoriSmsModule extends NativeModule<TijoriSmsModuleEvents> {
  readInboxAsync(sinceMillis: number): Promise<NativeSms[]>;
}

/** `null` on iOS, web and Expo Go — SMS access needs an Android development build. */
export default requireOptionalNativeModule<TijoriSmsModule>('TijoriSms');
