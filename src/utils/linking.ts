import { Linking, Alert } from 'react-native';

/**
 * Safely opens a contact or communication platform link.
 * If the native protocol fails (e.g. app not installed), falls back to web URL or phone/SMS.
 */
export const openSafeContactLink = async (platform: string, rawValue: string): Promise<void> => {
  if (!rawValue) return;
  const value = rawValue.trim();
  const lowerPlatform = platform.toLowerCase();

  try {
    if (lowerPlatform === 'whatsapp') {
      const cleanPhone = value.replace(/[^0-9]/g, '');
      const nativeUrl = `whatsapp://send?phone=${cleanPhone}`;
      const webUrl = `https://wa.me/${cleanPhone}`;
      const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (canOpenNative) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } else if (lowerPlatform === 'viber') {
      const cleanPhone = value.replace(/[^0-9+]/g, '');
      const nativeUrl = `viber://chat?number=${cleanPhone}`;
      const webUrl = `https://viber.click/${cleanPhone}`;
      const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (canOpenNative) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl).catch(async () => {
          await Linking.openURL(`tel:${cleanPhone}`);
        });
      }
    } else if (lowerPlatform === 'telegram') {
      const cleanUsername = value.replace(/^@/, '');
      const nativeUrl = `tg://resolve?domain=${cleanUsername}`;
      const webUrl = `https://t.me/${cleanUsername}`;
      const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (canOpenNative) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }
    } else if (lowerPlatform === 'facebook' || lowerPlatform === 'messenger') {
      if (value.startsWith('http')) {
        await Linking.openURL(value);
      } else {
        const nativeUrl = `fb-messenger://user-thread/${value}`;
        const webUrl = `https://m.me/${value}`;
        const canOpenNative = await Linking.canOpenURL(nativeUrl).catch(() => false);
        if (canOpenNative) {
          await Linking.openURL(nativeUrl);
        } else {
          await Linking.openURL(webUrl);
        }
      }
    } else if (lowerPlatform.includes('phone') || lowerPlatform.includes('call')) {
      const cleanPhone = value.replace(/[^0-9+]/g, '');
      await Linking.openURL(`tel:${cleanPhone}`);
    } else if (lowerPlatform.includes('sms')) {
      const cleanPhone = value.replace(/[^0-9+]/g, '');
      await Linking.openURL(`sms:${cleanPhone}`);
    } else if (value.startsWith('http://') || value.startsWith('https://')) {
      await Linking.openURL(value);
    } else {
      // General phone / sms fallback
      const cleanPhone = value.replace(/[^0-9+]/g, '');
      if (cleanPhone.length >= 7) {
        await Linking.openURL(`tel:${cleanPhone}`);
      } else {
        Alert.alert('Contact Link', `Unable to open ${platform}: ${value}`);
      }
    }
  } catch (err: any) {
    Alert.alert(
      'Cannot Open Link',
      `Could not open ${platform}. Please check that the app is installed or try contacting via phone.`,
    );
  }
};
