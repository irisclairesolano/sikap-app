import React from 'react';
import { render } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import RootNavigator from '../../src/navigation/RootNavigator';
import { useAuthCheck } from '../../src/hooks/useAuthCheck';
import AuthNavigator from '../../src/navigation/AuthNavigator';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `sikap://${path}`),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('../../src/hooks/useAuthCheck', () => ({
  useAuthCheck: jest.fn(),
}));

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    createNativeStackNavigator: () => ({
      Navigator: ({ children }: any) => <Text testID="mock-stack-navigator">{children}</Text>,
      Screen: ({ name }: any) => <Text testID={`mock-screen-${name}`}>{name}</Text>,
    }),
  };
});

jest.mock('../../src/hooks/useAuth', () => ({
  useAuth: jest.fn(() => ({ logout: jest.fn() })),
}));

jest.mock('../../src/screens/common/RoleOnboardingScreen', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockRoleOnboarding = () => <Text testID="mock-role-onboarding">RoleOnboarding</Text>;
  MockRoleOnboarding.displayName = 'MockRoleOnboarding';
  return { __esModule: true, default: MockRoleOnboarding };
});

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

jest.mock('../../src/navigation/EmployerNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockEmployer = () => <Text testID="mock-employer-navigator">EmployerNavigator</Text>;
  MockEmployer.displayName = 'MockEmployer';
  return { __esModule: true, default: MockEmployer };
});

jest.mock('../../src/navigation/WorkerNavigator', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const MockWorker = () => <Text testID="mock-worker-navigator">WorkerNavigator</Text>;
  MockWorker.displayName = 'MockWorker';
  return { __esModule: true, default: MockWorker };
});

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const testQueryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={testQueryClient}>
      <SafeAreaProvider>
        <NavigationContainer>{ui}</NavigationContainer>
      </SafeAreaProvider>
    </QueryClientProvider>,
  );
};

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

    const { getByText } = await renderWithProviders(<RootNavigator />);
    expect(getByText('Loading SIKAP...')).toBeTruthy();
  });

  it('renders AuthNavigator with default route when user is not logged in', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: null,
      isLoading: false,
      isVerified: false,
    });

    const { getByTestId } = await renderWithProviders(<RootNavigator />);
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

    await renderWithProviders(<RootNavigator />);

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

    await renderWithProviders(<RootNavigator />);

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

    await renderWithProviders(<RootNavigator />);

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

    await renderWithProviders(<RootNavigator />);

    expect(AuthNavigator).toHaveBeenCalledWith(
      expect.objectContaining({
        initialRouteName: 'PendingVerify',
      }),
      undefined,
    );
  });

  it('allows unverified employers with onboarded profile to access main app without ID gating', async () => {
    const mockUser = {
      id: 555,
      email: 'employer@example.com',
      role: 'employer',
      registration_status: 'pending_review',
      has_employer_profile: true,
      employer_profile: { description: 'Business owner' },
    };

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isVerified: false,
    });

    const { queryByTestId } = await renderWithProviders(<RootNavigator />);
    // Unverified employer should NOT be trapped in AuthNavigator (IDUpload / PendingVerify)
    expect(queryByTestId('mock-auth-navigator')).toBeNull();
  });

  it('routes unverified employer needing onboarding to RoleOnboarding', async () => {
    const mockUser = {
      id: 777,
      email: 'newemployer@example.com',
      role: 'employer',
      registration_status: 'approved',
      has_employer_profile: false,
      employer_profile: null,
    };

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: mockUser,
      isLoading: false,
      isVerified: false,
    });

    const { queryByTestId } = await renderWithProviders(<RootNavigator />);
    expect(queryByTestId('mock-auth-navigator')).toBeNull();
  });
});
