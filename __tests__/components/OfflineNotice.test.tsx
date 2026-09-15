import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { onlineManager } from '@tanstack/react-query';
import { OfflineNotice } from '../../src/components/common/OfflineNotice';

// Mock safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 40, bottom: 0, left: 0, right: 0 }),
}));

// Mock vector icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

// Mock expo-haptics
jest.mock('expo-haptics', () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  NotificationFeedbackType: { Success: 'success' },
  ImpactFeedbackStyle: { Light: 'light' },
}));

describe('Official SIKAP OfflineNotice Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global as any).fetch = jest.fn();
  });

  it('renders nothing when online', async () => {
    jest.spyOn(onlineManager, 'isOnline').mockReturnValue(true);
    const result = await render(<OfflineNotice />);
    expect(result.queryByTestId('sikap-offline-banner')).toBeNull();
  });

  it('renders official SIKAP offline banner when offline', async () => {
    jest.spyOn(onlineManager, 'isOnline').mockReturnValue(false);
    const result = await render(<OfflineNotice />);

    expect(result.getByTestId('sikap-offline-banner')).toBeTruthy();
    expect(result.getByText('SIKAP')).toBeTruthy();
    expect(result.getByText('OFFLINE MODE')).toBeTruthy();
    expect(result.getByText('Showing saved data · Changes will sync when online')).toBeTruthy();
    expect(result.getByTestId('sikap-offline-retry-btn')).toBeTruthy();
  });

  it('handles retry button tap and triggers connection health check', async () => {
    jest.spyOn(onlineManager, 'isOnline').mockReturnValue(false);
    const mockFetch = jest.fn().mockResolvedValue({ ok: true });
    (global as any).fetch = mockFetch;

    const result = await render(<OfflineNotice />);
    const retryBtn = result.getByTestId('sikap-offline-retry-btn');

    await act(async () => {
      fireEvent.press(retryBtn);
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      expect.objectContaining({ method: 'GET' }),
    );
  });
});
