import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WelcomeScreen from '../../../src/screens/auth/WelcomeScreen';

const mockNavigate = jest.fn();

jest.mock('@react-navigation/native', () => ({
  ...jest.requireActual('@react-navigation/native'),
  useNavigation: () => ({
    navigate: mockNavigate,
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    clear: jest.fn(),
  }),
}));

jest.mock('../../../src/hooks/useAuth', () => ({
  useAuth: () => ({
    setAuthSession: jest.fn(),
  }),
}));

describe('WelcomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders worker, employer, and login options', async () => {
    const { getByText } = await render(<WelcomeScreen />);

    expect(getByText("I'm a Worker")).toBeTruthy();
    expect(getByText("I'm an Employer")).toBeTruthy();
    expect(getByText('Log in')).toBeTruthy();
  });

  it('navigates to Register with worker role after accepting Terms when Worker button is pressed', async () => {
    const { getByText, findByText } = await render(<WelcomeScreen />);
    await fireEvent.press(getByText("I'm a Worker"));
    await fireEvent.press(await findByText('I Agree & Continue'));

    expect(mockNavigate).toHaveBeenCalledWith('Register', { role: 'worker' });
  });

  it('navigates to Register with employer role after accepting Terms when Employer button is pressed', async () => {
    const { getByText, findByText } = await render(<WelcomeScreen />);
    await fireEvent.press(getByText("I'm an Employer"));
    await fireEvent.press(await findByText('I Agree & Continue'));

    expect(mockNavigate).toHaveBeenCalledWith('Register', { role: 'employer' });
  });

  it('navigates to Login when Log in link is pressed', async () => {
    const { getByText } = await render(<WelcomeScreen />);
    fireEvent.press(getByText('Log in'));

    expect(mockNavigate).toHaveBeenCalledWith('Login');
  });
});
