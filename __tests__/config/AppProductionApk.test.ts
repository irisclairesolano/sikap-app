import appConfig from '../../app.json';
import * as storage from '../../src/utils/storage';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('Production APK Readiness & Configuration Tests', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });
  it('has cleartext HTTP traffic enabled in app.json for Android release builds', () => {
    const androidConfig = appConfig.expo.android;
    expect(androidConfig).toBeDefined();
    expect(androidConfig.usesCleartextTraffic).toBe(true);
  });

  it('declares essential Android hardware/storage permissions in app.json', () => {
    const permissions = appConfig.expo.android.permissions;
    expect(permissions).toBeDefined();
    expect(permissions).toContain('CAMERA');
    expect(permissions).toContain('READ_EXTERNAL_STORAGE');
    expect(permissions).toContain('WRITE_EXTERNAL_STORAGE');
  });

  it('handles SecureStore setItemAsync errors gracefully without crashing', async () => {
    (SecureStore.setItemAsync as jest.Mock).mockRejectedValueOnce(new Error('KeyStore Exception'));
    await expect(storage.setItemAsync('test_key', 'test_val')).resolves.not.toThrow();
  });

  it('handles SecureStore getItemAsync errors gracefully returning null', async () => {
    (SecureStore.getItemAsync as jest.Mock).mockRejectedValueOnce(new Error('KeyStore Read Error'));
    const result = await storage.getItemAsync('test_key');
    expect(result).toBeNull();
  });

  it('handles SecureStore deleteItemAsync errors gracefully without crashing', async () => {
    (SecureStore.deleteItemAsync as jest.Mock).mockRejectedValueOnce(
      new Error('KeyStore Delete Error'),
    );
    await expect(storage.deleteItemAsync('test_key')).resolves.not.toThrow();
  });
});
