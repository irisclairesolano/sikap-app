import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WorkerPublicProfileScreen from '../../../src/screens/employer/WorkerPublicProfileScreen';

const mockNavigate = jest.fn();
const mockGoBack = jest.fn();

jest.mock('@react-navigation/native', () => {
  const actual = jest.requireActual('@react-navigation/native');
  return {
    ...actual,
    useNavigation: () => ({
      navigate: mockNavigate,
      goBack: mockGoBack,
    }),
    useRoute: () => ({
      params: {
        workerId: 42,
        applicationId: 101,
        workerName: 'Juan Dela Cruz',
        avatarUrl: null,
        verificationBadge: true,
        reputationScore: 4.8,
        completedJobsCount: 5,
        barangay: 'San Roque',
        municipality: 'Gubat',
        bio: 'Hardworking carpenter and plumber.',
        skills: ['Carpentry', 'Plumbing'],
        experiences: [
          {
            id: 1,
            job_title: 'Lead Carpenter',
            company_name: 'Gubat Builders',
            start_date: '2023',
            end_date: 'Present',
            description: 'Built residential structures.',
          },
        ],
        characterReferences: [
          {
            id: 1,
            name: 'Maria Santos',
            relationship: 'Former Employer',
            phone: '09171234567',
          },
        ],
        status: 'pending',
      },
    }),
  };
});

jest.mock('@tanstack/react-query', () => ({
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
    refetch: jest.fn(),
  })),
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
}));

jest.mock('../../../src/hooks/useJobApplications', () => ({
  useApplication: jest.fn(() => ({
    data: null,
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../src/hooks/useReviews', () => ({
  useReviews: jest.fn(() => ({
    data: {
      reputation_score: 4.8,
      reviews_count: 2,
      reviews: [
        {
          id: 1,
          reviewer_name: 'Ana Ramos',
          overall_rating: 5,
          comment: 'Excellent work and punctuality!',
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ],
    },
    isLoading: false,
    refetch: jest.fn(),
  })),
}));

jest.mock('../../../src/contexts/AlertContext', () => ({
  useAlert: () => ({
    showAlert: jest.fn(),
  }),
}));

describe('WorkerPublicProfileScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders worker details, reputation, skills, and work history', async () => {
    const { getByText } = await render(<WorkerPublicProfileScreen />);

    // Basic Info
    expect(getByText('Juan Dela Cruz')).toBeTruthy();
    expect(getByText('Verified Worker')).toBeTruthy();
    expect(getByText('San Roque, Gubat')).toBeTruthy();

    // Reputation
    expect(getByText('4.8')).toBeTruthy();

    // Bio
    expect(getByText('Hardworking carpenter and plumber.')).toBeTruthy();

    // Skills
    expect(getByText('Carpentry')).toBeTruthy();
    expect(getByText('Plumbing')).toBeTruthy();

    // Work History
    expect(getByText('Lead Carpenter')).toBeTruthy();
    expect(getByText('Gubat Builders')).toBeTruthy();

    // Privacy Shield active in pending status
    expect(getByText('Protected by SIKAP Privacy Shield')).toBeTruthy();

    // Bottom action buttons
    expect(getByText('View Application')).toBeTruthy();
    expect(getByText('Message Worker')).toBeTruthy();
  });

  it('navigates back when tapping back button', async () => {
    const { getByTestId } = await render(<WorkerPublicProfileScreen />);
    const backBtn = getByTestId('header-back-btn');
    fireEvent.press(backBtn);
    expect(mockGoBack).toHaveBeenCalled();
  });

  it('navigates to report screen when tapping report flag', async () => {
    const { getByTestId } = await render(<WorkerPublicProfileScreen />);
    const reportBtn = getByTestId('header-report-btn');
    fireEvent.press(reportBtn);
    expect(mockNavigate).toHaveBeenCalledWith(
      'Report',
      expect.objectContaining({ id: 42, type: 'user' }),
    );
  });
});
