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
      expect(getByText('Start date is required')).toBeTruthy();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('shows error warning if end date is missing for past job', async () => {
    const { getByText, getAllByText, getByPlaceholderText } = await render(
      <AddWorkHistoryScreen />,
    );

    // Fill other fields
    await fireEvent.changeText(getByPlaceholderText('E.g. Tile setter'), 'Mason');
    await fireEvent.changeText(
      getByPlaceholderText('E.g. Reyes household renovation'),
      'Reyes Renovation',
    );

    // Pick start date (first button is Start Date)
    const dateButtons = getAllByText('Select month & year');
    await fireEvent.press(dateButtons[0]);
    const selectModalBtn = getByText('Select');
    await fireEvent.press(selectModalBtn);

    const saveButton = getByText('Save job');
    await fireEvent.press(saveButton);

    await waitFor(() => {
      expect(getByText('End date is required')).toBeTruthy();
    });
    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('triggers save mutation if form fields are valid', async () => {
    const { getByText, getAllByText, getByPlaceholderText, getByRole } = await render(
      <AddWorkHistoryScreen />,
    );

    await fireEvent.changeText(getByPlaceholderText('E.g. Tile setter'), 'Carpenter');
    await fireEvent.changeText(
      getByPlaceholderText('E.g. Reyes household renovation'),
      'Reyes Renovation',
    );

    // Pick start date (first button is Start Date)
    const dateButtons = getAllByText('Select month & year');
    await fireEvent.press(dateButtons[0]);
    const selectModalBtn = getByText('Select');
    await fireEvent.press(selectModalBtn);

    // Toggle "I currently work here" switch
    const currentSwitch = getByRole('switch');
    await fireEvent(currentSwitch, 'valueChange', true);

    const saveButton = getByText('Save job');
    await fireEvent.press(saveButton);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          job_title: 'Carpenter',
          employer_name: 'Reyes Renovation',
          is_current: true,
          description: '',
        }),
      );
    });
  });

  it('shows list view when experiences exist, and clicking add another job opens the dedicated form page', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        worker_profile: {
          experiences: [
            {
              id: 1,
              job_title: 'Electrician',
              employer_name: 'Power Co',
              duration: 'Jan 2023 – Present',
              start_date: 'Jan 2023',
              end_date: null,
              is_current: true,
              description: 'Wiring work',
            },
          ],
        },
      },
      isLoading: false,
    });

    const { getByText, queryByPlaceholderText } = await render(<AddWorkHistoryScreen />);

    // In list view: job card is shown, but form input placeholders are NOT shown
    expect(getByText('Electrician')).toBeTruthy();
    expect(getByText('Power Co')).toBeTruthy();
    expect(getByText('+ Add another job')).toBeTruthy();
    expect(queryByPlaceholderText('E.g. Tile setter')).toBeNull();

    // Clicking "+ Add another job" transitions to the dedicated form page
    await fireEvent.press(getByText('+ Add another job'));
    expect(queryByPlaceholderText('E.g. Tile setter')).toBeTruthy();
  });

  it('editing an existing job opens edit page and passes id to saveMutation without creating duplicate', async () => {
    (useQuery as jest.Mock).mockReturnValue({
      data: {
        worker_profile: {
          experiences: [
            {
              id: 42,
              job_title: 'Painter',
              employer_name: 'Metro Homes',
              duration: 'Jan 2022 – Dec 2022 (1 yr)',
              start_date: 'Jan 2022',
              end_date: 'Dec 2022',
              is_current: false,
              description: 'Interior walls',
            },
          ],
        },
      },
      isLoading: false,
    });

    const { getByText, getByLabelText, getByDisplayValue } = await render(<AddWorkHistoryScreen />);

    // Open 3 dots menu and click Edit
    await fireEvent.press(getByLabelText('Job options'));
    await fireEvent.press(getByText('Edit'));

    // Check pre-filled values on edit page
    expect(getByDisplayValue('Painter')).toBeTruthy();
    expect(getByDisplayValue('Metro Homes')).toBeTruthy();

    // Tap "Save changes"
    const saveChangesBtn = getByText('Save changes');
    await fireEvent.press(saveChangesBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 42,
          job_title: 'Painter',
          employer_name: 'Metro Homes',
        }),
      );
    });
  });
});
