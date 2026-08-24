import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddCharacterReferencesScreen } from '../../../src/screens/worker/AddCharacterReferencesScreen';
import { useQuery, useMutation } from '@tanstack/react-query';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  })),
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

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-keyboard-aware-scroll-view', () => ({
  KeyboardAwareScrollView: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock react-native Modal to render inline so Jest can query modal contents
jest.mock('react-native', () => {
  const RN = jest.requireActual('react-native');
  RN.Modal = ({ children, visible }: any) => {
    return visible ? children : null;
  };
  return RN;
});

jest.mock('react-native-elements', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: jest.fn(({ placeholder, onChangeText, value, error, ...props }: any) => (
      <TextInput placeholder={placeholder} onChangeText={onChangeText} value={value} {...props} />
    )),
  };
});

describe('AddCharacterReferencesScreen', () => {
  let mockMutate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate = jest.fn();

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        phone: '09111111111',
        worker_profile: {
          references: [],
        },
      },
      isLoading: false,
    });

    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders list header and add button', async () => {
    const { getByText } = await render(<AddCharacterReferencesScreen />);
    expect(getByText(/Three people/i)).toBeTruthy();
    expect(getByText('Add another reference')).toBeTruthy();
  });

  it('validates fields and shows error text when adding reference with missing fields', async () => {
    const { getByText } = await render(<AddCharacterReferencesScreen />);

    // Open Modal
    await fireEvent.press(getByText('Add another reference'));

    // Tap Save inside Modal
    const saveBtn = getByText('Save reference');
    await fireEvent.press(saveBtn);

    await waitFor(() => {
      expect(getByText('Full name is required')).toBeTruthy();
      expect(getByText('Relationship is required')).toBeTruthy();
      expect(getByText('Phone number is required')).toBeTruthy();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('validates phone number rules and rejects self phone number', async () => {
    const { getByText, getByPlaceholderText } = await render(<AddCharacterReferencesScreen />);

    await fireEvent.press(getByText('Add another reference'));

    // Enter details
    await fireEvent.changeText(getByPlaceholderText('E.g. Juan Reyes'), 'Jane Doe');
    await fireEvent.changeText(getByPlaceholderText('E.g. Former employer'), 'Manager');

    // Enter invalid phone
    await fireEvent.changeText(getByPlaceholderText('E.g. 09123456789'), '12345');
    await fireEvent.press(getByText('Save reference'));
    await waitFor(() => {
      expect(getByText('Phone number must start with 09')).toBeTruthy();
    });

    // Enter self phone number
    await fireEvent.changeText(getByPlaceholderText('E.g. 09123456789'), '09111111111');
    await fireEvent.press(getByText('Save reference'));
    await waitFor(() => {
      expect(getByText('Cannot be your own phone number')).toBeTruthy();
    });
  });
});
