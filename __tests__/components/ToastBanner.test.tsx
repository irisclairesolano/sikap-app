import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import ToastBanner, { ToastConfig } from '../../src/components/common/ToastBanner';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
    Medium: 'medium',
    Heavy: 'heavy',
  },
  NotificationFeedbackType: {
    Success: 'success',
    Warning: 'warning',
    Error: 'error',
  },
}));

describe('ToastBanner Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders nothing when toast is null', async () => {
    const { queryByText } = await render(<ToastBanner toast={null} onDismiss={jest.fn()} />);
    expect(queryByText(/./)).toBeNull();
  });

  it('renders toast message and handles action press', async () => {
    const onAction = jest.fn();
    const onDismiss = jest.fn();

    const toast: ToastConfig = {
      message: 'Job bookmarked successfully',
      type: 'success',
      actionLabel: 'View',
      onAction,
    };

    const { getByText } = await render(<ToastBanner toast={toast} onDismiss={onDismiss} />);

    expect(getByText('Job bookmarked successfully')).toBeTruthy();
    expect(getByText('View')).toBeTruthy();

    const actionBtn = getByText('View');
    await act(async () => {
      fireEvent.press(actionBtn);
    });

    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
