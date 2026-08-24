import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddWorkHistoryScreen } from '../../../src/screens/worker/AddWorkHistoryScreen';
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

jest.mock('react-native-elements', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: jest.fn(({ placeholder, onChangeText, value, error, ...props }: any) => (
      <TextInput placeholder={placeholder} onChangeText={onChangeText} value={value} {...props} />
    )),
  };
});

describe('AddWorkHistoryScreen', () => {
  let mockMutate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate = jest.fn();

    (useQuery as jest.Mock).mockReturnValue({
      data: {
        worker_profile: {
          experiences: [],
        },
      },
      isLoading: false,
    });

    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders form elements correctly', async () => {
    const { getByText, getByPlaceholderText } = await render(<AddWorkHistoryScreen />);
    expect(getByText(/Add a/i)).toBeTruthy();
    expect(getByPlaceholderText('E.g. Tile setter')).toBeTruthy();
    expect(getByPlaceholderText('E.g. Reyes household renovation')).toBeTruthy();
  });

  it('validates required fields on Save and shows inline warnings', async () => {
    const { getByText } = await render(<AddWorkHistoryScreen />);

    // Tap Save button while form is empty
    const saveButton = getByText('Save job');
    await fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('Job title is required')).toBeTruthy();
      expect(getByText('Employer name is required')).toBeTruthy();
      expect(getByText('Duration is required')).toBeTruthy();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows error warning if duration is non-positive or non-numeric', async () => {
    const { getByText, getByPlaceholderText } = await render(<AddWorkHistoryScreen />);

    // Fill other fields
    await fireEvent.changeText(getByPlaceholderText('E.g. Tile setter'), 'Mason');
    await fireEvent.changeText(
      getByPlaceholderText('E.g. Reyes household renovation'),
      'Reyes Renovation',
    );

    // Fill invalid duration
    await fireEvent.changeText(getByPlaceholderText('E.g. 3'), '-2');

    const saveButton = getByText('Save job');
    await fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('Duration must be a positive number')).toBeTruthy();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('triggers save mutation if form fields are valid', async () => {
    const { getByText, getByPlaceholderText } = await render(<AddWorkHistoryScreen />);

    await fireEvent.changeText(getByPlaceholderText('E.g. Tile setter'), 'Carpenter');
    await fireEvent.changeText(
      getByPlaceholderText('E.g. Reyes household renovation'),
      'Reyes Renovation',
    );
    await fireEvent.changeText(getByPlaceholderText('E.g. 3'), '6');

    const saveButton = getByText('Save job');
    await fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith({
        job_title: 'Carpenter',
        employer_name: 'Reyes Renovation',
        duration: '6 Months',
        description: '',
      });
    });
  });
});
