import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import IDUploadScreen from '../../../src/screens/auth/IDUploadScreen';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation } from '@tanstack/react-query';
import { useAlert } from '../../../src/contexts/AlertContext';

const mockNavigate = jest.fn();
const mockReplace = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    replace: mockReplace,
    goBack: mockGoBack,
  }),
  useRoute: jest.fn(),
}));

const mockMutate = jest.fn();
jest.mock('@tanstack/react-query', () => ({
  useMutation: jest.fn(),
  useQuery: jest.fn(),
  useQueryClient: jest.fn(() => ({
    setQueryData: jest.fn(),
    invalidateQueries: jest.fn(),
  })),
}));

const mockShowAlert = jest.fn();
jest.mock('../../../src/contexts/AlertContext', () => ({
  useAlert: () => ({
    showAlert: mockShowAlert,
    hideAlert: jest.fn(),
  }),
}));

jest.mock('expo-document-picker', () => ({
  getDocumentAsync: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn().mockResolvedValue({ uri: 'manipulated-uri' }),
  SaveFormat: { JPEG: 'jpeg' },
}));

jest.mock('../../../src/utils/storage', () => ({
  getItemAsync: jest.fn().mockResolvedValue('mock-token'),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('IDUploadScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRoute as jest.Mock).mockReturnValue({
      params: {
        userId: 123,
        role: 'worker',
      },
    });
    (useMutation as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });
  });

  it('renders helper labels and titles correctly', async () => {
    const { getByText } = await render(<IDUploadScreen />);

    expect(getByText(/Verify your/i)).toBeTruthy();
    expect(getByText('identity.')).toBeTruthy();
    expect(getByText('Upload a government-issued ID.')).toBeTruthy();
    expect(getByText('Upload a photo of your ID (Front)')).toBeTruthy();
    expect(getByText('Upload a photo of your ID (Back)')).toBeTruthy();
    expect(getByText('Upload a selfie holding your ID')).toBeTruthy();
  });

  it('initially disables the submit button', async () => {
    const { getByRole } = await render(<IDUploadScreen />);
    const submitBtn = getByRole('button', { name: 'Submit for review' });
    expect(submitBtn.props.accessibilityState?.disabled).toBe(true);
  });

  it('triggers document picker when clicking upload areas and enables submit when all are selected', async () => {
    (DocumentPicker.getDocumentAsync as jest.Mock)
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file-uri-front', name: 'id-front.jpg', size: 1024 * 1024 }],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file-uri-back', name: 'id-back.jpg', size: 1024 * 1024 }],
      })
      .mockResolvedValueOnce({
        canceled: false,
        assets: [{ uri: 'file-uri-selfie', name: 'selfie.jpg', size: 1024 * 1024 }],
      });

    const { getByText, getByRole, queryByText } = await render(<IDUploadScreen />);

    // Click ID front upload area
    const frontText = getByText('Upload a photo of your ID (Front)');
    await fireEvent.press(frontText);

    await waitFor(() => {
      expect(queryByText('id-front.jpg')).toBeTruthy();
    });

    // Click ID back upload area
    const backText = getByText('Upload a photo of your ID (Back)');
    await fireEvent.press(backText);

    await waitFor(() => {
      expect(queryByText('id-back.jpg')).toBeTruthy();
    });

    // Click Selfie upload area
    const selfieText = getByText('Upload a selfie holding your ID');
    await fireEvent.press(selfieText);

    await waitFor(() => {
      expect(queryByText('selfie.jpg')).toBeTruthy();
    });

    // Verify button is now enabled and press it
    const submitBtn = getByRole('button', { name: 'Submit for review' });
    expect(submitBtn.props.accessibilityState?.disabled).toBe(false);

    await fireEvent.press(submitBtn);
    expect(mockMutate).toHaveBeenCalled();
  });
});
