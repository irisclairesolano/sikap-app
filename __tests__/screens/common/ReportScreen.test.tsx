import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ReportScreen from '../../../src/screens/common/ReportScreen';
import { useSubmitReport } from '../../../src/hooks/useReports';
import { useAlert } from '../../../src/contexts/AlertContext';
import { normalizeReportableType } from '../../../src/api/reports';
import { useRoute } from '@react-navigation/native';

jest.setTimeout(30000);

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: mockNavigate,
    goBack: mockGoBack,
  }),
  useRoute: jest.fn(),
}));

jest.mock('../../../src/hooks/useReports', () => ({
  useSubmitReport: jest.fn(),
}));

jest.mock('../../../src/contexts/AlertContext', () => ({
  useAlert: jest.fn(),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn().mockResolvedValue(undefined),
  notificationAsync: jest.fn().mockResolvedValue(undefined),
  selectionAsync: jest.fn().mockResolvedValue(undefined),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));

describe('Report API & Normalization Helpers', () => {
  it('normalizes job and job_post variations to job_post', () => {
    expect(normalizeReportableType('job')).toBe('job_post');
    expect(normalizeReportableType('job_post')).toBe('job_post');
    expect(normalizeReportableType('jobpost')).toBe('job_post');
    expect(normalizeReportableType('JOB')).toBe('job_post');
  });

  it('normalizes application variations to application', () => {
    expect(normalizeReportableType('application')).toBe('application');
    expect(normalizeReportableType('APPLICATION')).toBe('application');
  });

  it('defaults unmapped or user variations to user', () => {
    expect(normalizeReportableType('user')).toBe('user');
    expect(normalizeReportableType('applicant')).toBe('user');
    expect(normalizeReportableType('worker')).toBe('user');
    expect(normalizeReportableType('employer')).toBe('user');
    expect(normalizeReportableType(undefined)).toBe('user');
    expect(normalizeReportableType(null)).toBe('user');
    expect(normalizeReportableType('unknown')).toBe('user');
  });
});

describe('ReportScreen Component', () => {
  let mockMutate: jest.Mock;
  let mockShowAlert: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockMutate = jest.fn();
    mockShowAlert = jest.fn();

    (useSubmitReport as jest.Mock).mockReturnValue({
      mutate: mockMutate,
      isPending: false,
    });

    (useAlert as jest.Mock).mockReturnValue({
      showAlert: mockShowAlert,
    });
  });

  it('correctly parses legacy param shape { id: 42, type: "user" } and submits payload', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: { id: 42, type: 'user' },
    });

    const { getByText, getByPlaceholderText, getByTestId } = await render(<ReportScreen />);

    // Select reason
    await fireEvent.press(getByText('Harassment'));

    // Fill description
    const input = getByPlaceholderText('Describe what happened...');
    await fireEvent.changeText(input, 'User sent inappropriate messages');

    // Submit
    const submitBtn = getByTestId('submit-report-btn');
    await fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportable_type: 'user',
        reportable_id: 42,
        type: 'harassment',
        description: 'User sent inappropriate messages',
      }),
      expect.any(Object),
    );
  });

  it('correctly parses modern param shape { reportable_id: 88, reportable_type: "job" } and maps to job_post', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: { reportable_id: 88, reportable_type: 'job' },
    });

    const { getByText, getByPlaceholderText, getByTestId } = await render(<ReportScreen />);

    // Select reason
    await fireEvent.press(getByText('Scam or Fraud'));

    // Fill description
    const input = getByPlaceholderText('Describe what happened...');
    await fireEvent.changeText(input, 'Fake job posting asking for upfront fees');

    // Submit
    const submitBtn = getByTestId('submit-report-btn');
    await fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledTimes(1);
    });

    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        reportable_type: 'job_post',
        reportable_id: 88,
        type: 'fake_account',
        description: 'Fake job posting asking for upfront fees',
      }),
      expect.any(Object),
    );
  });

  it('blocks submission and shows alert when target ID is missing or 0', async () => {
    (useRoute as jest.Mock).mockReturnValue({
      params: { id: 0, type: 'user' },
    });

    const { getByText, getByPlaceholderText, getByTestId } = await render(<ReportScreen />);

    // Select reason and fill description so form is valid
    await fireEvent.press(getByText('Other'));
    const input = getByPlaceholderText('Describe what happened...');
    await fireEvent.changeText(input, 'Testing invalid target ID');

    // Submit
    const submitBtn = getByTestId('submit-report-btn');
    await fireEvent.press(submitBtn);

    await waitFor(() => {
      expect(mockShowAlert).toHaveBeenCalledWith(
        'Missing Target',
        'Unable to submit report without a valid target identifier.',
      );
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });
});
