import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import PendingVerifyScreen from '../../../src/screens/auth/PendingVerifyScreen';
import { useAuthCheck } from '../../../src/hooks/useAuthCheck';
import * as SecureStore from '../../../src/utils/storage';
import { getGuestInitialRoute } from '../../../src/store/authEvents';

const mockNavigate = jest.fn();
const mockReset = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    reset: mockReset,
  }),
}));

const mockClear = jest.fn();
const mockSetQueryData = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    clear: mockClear,
    setQueryData: mockSetQueryData,
  }),
}));

jest.mock('../../../src/hooks/useAuthCheck', () => ({
  useAuthCheck: jest.fn(),
}));

jest.mock('../../../src/utils/storage', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn().mockResolvedValue(undefined),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('PendingVerifyScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders "checking your account" when user is under review', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        role: 'worker',
        registration_status: 'pending_review',
        verification_status: 'pending',
      },
    });

    const { getByText, queryByText } = await render(<PendingVerifyScreen />);

    expect(getByText(/checking/i)).toBeTruthy();
    expect(getByText('Refresh Status')).toBeTruthy();
    expect(getByText('Sign out')).toBeTruthy();
    expect(queryByText('Re-upload ID')).toBeNull();
  });

  it('renders "Your ID was rejected" and reason when status is rejected', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: {
        id: 31,
        role: 'worker',
        registration_status: 'rejected',
        verification_status: 'rejected',
        rejection_reason: 'no ID uploaded',
      },
    });

    const { getByText } = await render(<PendingVerifyScreen />);

    expect(getByText('rejected')).toBeTruthy();
    expect(getByText(/Reason: no ID uploaded/)).toBeTruthy();
    expect(getByText('Re-upload ID')).toBeTruthy();
    expect(getByText('Sign out')).toBeTruthy();
  });

  it('navigates to IDUpload when "Re-upload ID" is pressed', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: {
        id: 31,
        role: 'worker',
        registration_status: 'rejected',
      },
    });

    const { getByText } = await render(<PendingVerifyScreen />);

    fireEvent.press(getByText('Re-upload ID'));

    expect(mockNavigate).toHaveBeenCalledWith('IDUpload', {
      userId: 31,
      role: 'worker',
    });
  });

  it('signs out and redirects to Login when "Sign out" is pressed', async () => {
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: {
        id: 31,
        role: 'worker',
        registration_status: 'rejected',
      },
    });

    const { getByText } = await render(<PendingVerifyScreen />);

    fireEvent.press(getByText('Sign out'));

    await waitFor(() => {
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('auth_token');
      expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_profile');
      expect(mockClear).toHaveBeenCalled();
      expect(mockSetQueryData).toHaveBeenCalledWith(['profile'], null);
      expect(getGuestInitialRoute()).toBe('Login');
      expect(mockReset).toHaveBeenCalledWith({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    });
  });
});
