/* eslint-env node */
/**
 * Hotfix for upstream Expo issue #52175:
 * "Cannot find native module 'ExpoTopicSubscriptionModule'"
 *
 * In Expo SDK 52-57, the pre-built Expo Go Android binary fails to register
 * `ExpoTopicSubscriptionModule` in its native package picker. Because
 * `expo-notifications` calls `requireNativeModule('ExpoTopicSubscriptionModule')`
 * at import time, merely importing `expo-notifications` crashes Expo Go on Android.
 *
 * This patch replaces `requireNativeModule` with `requireOptionalNativeModule`
 * and provides a no-op fallback module when running inside Expo Go, while keeping
 * full native functionality in standalone APK / custom development builds.
 */

const fs = require('fs');
const path = require('path');

const targetFiles = [
  path.join(
    __dirname,
    '..',
    'node_modules',
    'expo-notifications',
    'build',
    'TopicSubscriptionModule.android.js',
  ),
  path.join(
    __dirname,
    '..',
    'node_modules',
    'expo-notifications',
    'src',
    'TopicSubscriptionModule.android.ts',
  ),
];

const jsPatch = `import { requireOptionalNativeModule } from 'expo-modules-core';

const fallbackModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default (requireOptionalNativeModule('ExpoTopicSubscriptionModule') ?? fallbackModule);
`;

const tsPatch = `import { requireOptionalNativeModule } from 'expo-modules-core';
import type { TopicSubscriptionModule } from './TopicSubscriptionModule.types';

const fallbackModule: TopicSubscriptionModule = {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};

export default (requireOptionalNativeModule<TopicSubscriptionModule>('ExpoTopicSubscriptionModule') ?? fallbackModule);
`;

let patchedAny = false;

for (const filePath of targetFiles) {
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('requireNativeModule(')) {
      const isTs = filePath.endsWith('.ts');
      fs.writeFileSync(filePath, isTs ? tsPatch : jsPatch, 'utf8');
      console.log(`[patch-expo-notifications] Successfully patched ${path.basename(filePath)}`);
      patchedAny = true;
    }
  }
}

if (!patchedAny) {
  console.log('[patch-expo-notifications] Files already patched or expo-notifications not found.');
}
