import React from 'react';
import { render } from '@testing-library/react-native';
import RootNavigator from '../../src/navigation/RootNavigator';
import { useAuthCheck } from '../../src/hooks/useAuthCheck';
import AuthNavigator from '../../src/navigation/AuthNavigator';

jest.mock('../../src/hooks/useAuthCheck', () => ({
  useAuthCheck: jest.fn(),
}));

jest.mock('../../src/hooks/usePushNotifications', () => ({
  usePushNotifications: jest.fn(() => ({ expoPushToken: null })),
}));

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ logout: jest.fn() })),
}));

jest.mock('../../src/api/profile', () => ({
  profileApi: {
    updateProfile: jest.fn().mockResolvedValue({}),
  },
}));

jest.mock('../../src/navigation/AuthNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return jest.fn(({ initialRouteName, initialParams }: any) => (
    <Text testID="mock-auth-navigator">
      {`AuthNavigator:${initialRouteName}:${JSON.stringify(initialParams || {})}`}
    </Text>
  ));
});

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading screen when isLoading is true', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: null,
      isLoading: true,
      isVerified: false,
    });

    const { getByText } = await render(<RootNavigator />);
    expect(getByText('Loading SIKAP...')).toBeTruthy();
  });

  it('renders AuthNavigator with default route when user is not logged in', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      isVerified: false,
    });

    const { getByTestId } = await render(<RootNavigator />);
    expect(getByTestId('mock-auth-navigator')).toBeTruthy();
    expect(AuthNavigator).toHaveBeenCalledWith(expect.objectContaining({}), undefined);
  });

  it('renders AuthNavigator with initialRouteName="OTPVerify" when status is pending_email_verification', async () => {
    const mockUser = {
      id: 123,
      email: 'unverified@example.com',
      role: 'worker',
      registration_status: 'pending_email_verification',
    };

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isVerified: false,
    });

    await render(<RootNavigator />);

    expect(AuthNavigator).toHaveBeenCalledWith(
      expect.objectContaining({
        initialRouteName: 'OTPVerify',
        initialParams: {
          userId: 123,
          email: 'unverified@example.com',
          role: 'worker',
        },
      }),
      undefined,
    );
  });

  it('renders AuthNavigator with initialRouteName="IDUpload" when status is pending_id_upload', async () => {
    const mockUser = {
      id: 456,
      email: 'idupload@example.com',
      role: 'worker',
      registration_status: 'pending_id_upload',
    };

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isVerified: false,
    });

    await render(<RootNavigator />);

    expect(AuthNavigator).toHaveBeenCalledWith(
      expect.objectContaining({
        initialRouteName: 'IDUpload',
        initialParams: {
          userId: 456,
          role: 'worker',
        },
      }),
      undefined,
    );
  });

  it('renders AuthNavigator with initialRouteName="PendingVerify" when status is pending_review', async () => {
    const mockUser = {
      id: 789,
      email: 'review@example.com',
      role: 'worker',
      registration_status: 'pending_review',
    };

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isVerified: false,
    });

    await render(<RootNavigator />);

    expect(AuthNavigator).toHaveBeenCalledWith(
      expect.objectContaining({
        initialRouteName: 'PendingVerify',
        initialParams: undefined,
      }),
      undefined,
    );
  });

  it('renders AuthNavigator with initialRouteName="PendingVerify" when status is rejected', async () => {
    const mockUser = {
      id: 999,
      email: 'rejected@example.com',
      role: 'worker',
      registration_status: 'rejected',
    };

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isVerified: false,
    });

    await render(<RootNavigator />);

    expect(AuthNavigator).toHaveBeenCalledWith(
      expect.objectContaining({
        initialRouteName: 'PendingVerify',
      }),
      undefined,
    );
  });
});
