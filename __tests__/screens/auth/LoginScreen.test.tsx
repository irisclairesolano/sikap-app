import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../../src/screens/auth/LoginScreen';
import { useAuth } from '../../../src/hooks/useAuth';
import { ApiClientError } from '../../../src/api/client';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

jest.mock('../../../src/contexts/AlertContext', () => ({
  useAlert: () => ({
    showAlert: jest.fn(),
    hideAlert: jest.fn(),
  }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('react-native-elements', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: jest.fn(
      ({
        placeholder,
        onChangeText,
        value,
        secureTextEntry,
        inputStyle,
        inputContainerStyle,
        containerStyle,
        leftIcon,
        rightIcon,
        ...props
      }: any) => (
        <TextInput
          placeholder={placeholder}
          onChangeText={onChangeText}
          value={value}
          secureTextEntry={secureTextEntry}
          {...props}
        />
      ),
    ),
  };
});

describe('LoginScreen', () => {
  let mockMutate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate = jest.fn();
    (useAuth as jest.Mock).mockReturnValue({
      loginMutation: {
        mutate: mockMutate,
        isPending: false,
      },
    });
  });

  it('shows error banner if email or password is empty', async () => {
    const result = await render(<LoginScreen />);
    const { getByText, getByRole } = result;

    const signInButton = getByRole('button', { name: 'Sign in' });
    await fireEvent.press(signInButton);

    await waitFor(() => {
      expect(getByText('Please fill in all fields.')).toBeTruthy();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('triggers navigation to "Welcome" when login succeeds with a rejected status', async () => {
    mockMutate.mockImplementation((credentials, options) => {
      if (options?.onSuccess) {
        options.onSuccess({
          token: 'mock-token',
          user: {
            id: 101,
            email: 'user@example.com',
            role: 'worker',
            registration_status: 'rejected',
          },
        });
      }
    });

    const { getByText, getByPlaceholderText, getByRole } = await render(<LoginScreen />);

    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    await fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    await fireEvent.press(getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        { email: 'user@example.com', password: 'password123' },
        expect.any(Object),
      );
      expect(mockNavigate).toHaveBeenCalledWith('Welcome');
    });
  });

  it('triggers navigation to "Welcome" when login fails with ApiClientError containing rejected status', async () => {
    mockMutate.mockImplementation((credentials, options) => {
      if (options?.onError) {
        const error = new ApiClientError('Your registration was rejected', 400, undefined, {
          registration_status: 'rejected',
        });
        options.onError(error);
      }
    });

    const { getByText, getByPlaceholderText, getByRole } = await render(<LoginScreen />);

    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'user@example.com');
    await fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    await fireEvent.press(getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('Welcome');
      expect(
        getByText('Your previous application was rejected. Please register again.'),
      ).toBeTruthy();
    });
  });

  it('navigates to correct routes on other success statuses (e.g. OTPVerify for pending_email_verification)', async () => {
    mockMutate.mockImplementation((credentials, options) => {
      if (options?.onSuccess) {
        options.onSuccess({
          token: 'mock-token',
          user: {
            id: 202,
            email: 'verify@example.com',
            role: 'worker',
            registration_status: 'pending_email_verification',
          },
        });
      }
    });

    const { getByText, getByPlaceholderText, getByRole } = await render(<LoginScreen />);

    await fireEvent.changeText(getByPlaceholderText('you@example.com'), 'verify@example.com');
    await fireEvent.changeText(getByPlaceholderText('Your password'), 'password123');
    await fireEvent.press(getByRole('button', { name: 'Sign in' }));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('OTPVerify', {
        userId: 202,
        email: 'verify@example.com',
        role: 'worker',
      });
    });
  });
});
