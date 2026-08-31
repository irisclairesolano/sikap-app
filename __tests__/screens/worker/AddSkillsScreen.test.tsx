import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import AddSkillsScreen from '../../../src/screens/worker/AddSkillsScreen';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuthCheck } from '../../../src/hooks/useAuthCheck';

jest.setTimeout(30000);

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

jest.mock('../../../src/hooks/useAuthCheck', () => ({
  useAuthCheck: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('react-native-elements', () => {
  const React = require('react');
  const { TextInput } = require('react-native');
  return {
    Input: jest.fn(({ placeholder, onChangeText, value, error, ...props }: any) => (
      <TextInput
        placeholder={placeholder}
        onChangeText={onChangeText}
        value={value}
        testID="custom-skill-input"
        {...props}
      />
    )),
  };
});

describe('AddSkillsScreen', () => {
  let mockSaveMutate: jest.Mock;
  let mockCreateSkillMutate: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockSaveMutate = jest.fn();
    mockCreateSkillMutate = jest.fn();

    (useAuthCheck as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        worker_profile: {
          skills: [{ id: 1, name: 'Carpentry' }],
        },
      },
    });

    (useQuery as jest.Mock).mockReturnValue({
      data: [
        { id: 1, name: 'Carpentry' },
        { id: 2, name: 'Masonry' },
      ],
      isLoading: false,
    });

    (useMutation as jest.Mock).mockImplementation((options: any) => {
      // Differentiate mutations by structure/fn
      if (options.mutationFn && options.mutationFn.toString().includes('addSkills')) {
        return {
          mutate: mockSaveMutate,
          isPending: false,
        };
      }
      return {
        mutate: mockCreateSkillMutate,
        isPending: false,
      };
    });
  });

  it('renders correctly with pre-selected skills', async () => {
    const { getByText } = await render(<AddSkillsScreen />);
    expect(getByText(/Tell employers what/)).toBeTruthy();
    expect(getByText('Carpentry')).toBeTruthy();
  });

  it('prevents saving when no skills are selected and shows warning', async () => {
    // Reset to no skills pre-selected
    (useAuthCheck as jest.Mock).mockReturnValue({
      user: {
        id: 1,
        worker_profile: {
          skills: [],
        },
      },
    });

    const { getByText, getByRole } = await render(<AddSkillsScreen />);

    // Tap Next
    const nextButton = getByRole('button', { name: 'Next' });
    fireEvent.press(nextButton);

    await waitFor(() => {
      expect(getByText('Please select at least one skill to continue.')).toBeTruthy();
    });
    expect(mockSaveMutate).not.toHaveBeenCalled();
  });

  it('shows error warning when attempting to add a duplicate custom skill', async () => {
    const { getByPlaceholderText, getByText } = await render(<AddSkillsScreen />);

    const input = getByPlaceholderText('Type custom skill e.g., Wood Carver');

    // Type a duplicate skill name
    fireEvent.changeText(input, 'Carpentry');

    // Press Add
    const addButton = getByText('+ Add');
    fireEvent.press(addButton);

    await waitFor(() => {
      expect(mockCreateSkillMutate).not.toHaveBeenCalled();
    });
  });
});
