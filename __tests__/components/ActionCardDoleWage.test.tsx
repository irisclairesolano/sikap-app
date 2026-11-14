import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActionCard, {
  DOLE_DAILY_MINIMUM,
  DOLE_HOURLY_MINIMUM,
} from '../../src/components/chat/ActionCard';
import { Message } from '../../src/types';

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
  }),
}));

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
    getQueryData: jest.fn(),
  }),
  useQuery: jest.fn(() => ({
    data: null,
    isLoading: false,
  })),
  useMutation: jest.fn(() => ({
    mutate: jest.fn(),
    isPending: false,
  })),
}));

jest.mock('../../src/contexts/AlertContext', () => ({
  useAlert: () => ({
    showAlert: jest.fn(),
  }),
}));

jest.mock('../../src/api/client', () => ({
  apiClient: jest.fn(),
}));

describe('ActionCard DOLE Region V Wage Guidance', () => {
  const mockJobRequestMessage: Message = {
    id: 101,
    conversation_id: 5,
    sender_id: null,
    message_type: 'action_card',
    card_type: 'job_request',
    card_data: {
      application_id: 42,
      job_title: 'Electrical Repair',
      employer_name: 'Maria Santos',
      worker_name: 'Juan Dela Cruz',
      compensation: 500,
      rate_unit: 'per_day',
    },
    card_resolved: false,
    created_at: '2026-09-24T00:00:00.000Z',
  };

  it('exports verified DOLE Region V baseline constants (₱455/day, ₱56.88/hr)', () => {
    expect(DOLE_DAILY_MINIMUM).toBe(455);
    expect(DOLE_HOURLY_MINIMUM).toBe(56.88);
  });

  it('renders DOLE Region V Suggested Wage Box for worker in Stage 2', async () => {
    const { getByTestId, getByText } = await render(
      <ActionCard
        message={mockJobRequestMessage}
        currentUserId={2}
        currentUserRole="worker"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="pending_negotiation"
        onActionComplete={jest.fn()}
      />,
    );

    expect(getByTestId('dole-wage-guide-box')).toBeTruthy();
    expect(getByText('DOLE Region V Wage Guide')).toBeTruthy();
    expect(getByText('Sorsogon Baseline')).toBeTruthy();
    expect(getByText('Suggested Baseline')).toBeTruthy();
    expect(getByText('₱455 / day')).toBeTruthy();
    expect(getByText('≈ ₱56.88 / hr (8-hr standard)')).toBeTruthy();
    expect(getByText('Posted Rate')).toBeTruthy();
    expect(getByText('₱500 / day')).toBeTruthy();
    expect(
      getByText(
        'DOLE Region V minimum wage is ₱455/day (₱56.88/hr) in Sorsogon. Discuss your final pay based on task scope and agreed hours.',
      ),
    ).toBeTruthy();
  });

  it('renders DOLE Suggested Wage Box for employer and supports 1-tap quick fill pill', async () => {
    const { getByTestId, getByText, getByPlaceholderText } = await render(
      <ActionCard
        message={mockJobRequestMessage}
        currentUserId={1}
        currentUserRole="employer"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="pending_negotiation"
        hasRealMessageFromEmployer={true}
        onActionComplete={jest.fn()}
      />,
    );

    // Employer sees DOLE wage box
    expect(getByTestId('dole-wage-guide-box')).toBeTruthy();
    expect(getByText('DOLE Region V Wage Guide')).toBeTruthy();

    // Tap Hire to open price input
    await fireEvent.press(getByText('Hire'));

    const input = getByPlaceholderText('Enter agreed price (₱)...');
    expect(input).toBeTruthy();

    // Quick fill pills are available
    const minPill = getByTestId('dole-quick-pill-min');
    expect(minPill).toBeTruthy();
    expect(getByText('₱455 (DOLE Min.)')).toBeTruthy();

    // Tap quick pill to prefill 455
    await fireEvent.press(minPill);
    expect(input.props.value).toBe('455');

    // Shows baseline meets badge
    expect(getByTestId('dole-input-success-box')).toBeTruthy();
    expect(getByText('Meets DOLE Region V daily minimum wage baseline (₱455/day)')).toBeTruthy();
  });

  it('displays non-blocking advisory warning when employer enters amount below ₱455', async () => {
    const { getByText, getByPlaceholderText, getByTestId } = await render(
      <ActionCard
        message={mockJobRequestMessage}
        currentUserId={1}
        currentUserRole="employer"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="pending_negotiation"
        hasRealMessageFromEmployer={true}
        onActionComplete={jest.fn()}
      />,
    );

    await fireEvent.press(getByText('Hire'));
    const input = getByPlaceholderText('Enter agreed price (₱)...');

    // Enter pay below 455
    await fireEvent.changeText(input, '350');

    expect(getByTestId('dole-input-warning-box')).toBeTruthy();
    expect(
      getByText(
        '⚠️ ₱350 is below the DOLE Region V daily minimum wage (₱455/day). Ensure both parties agree on part-time hours or task scope.',
      ),
    ).toBeTruthy();
  });

  it('displays DOLE benchmark badge on accept_or_reject card for worker', async () => {
    const offerMessage: Message = {
      id: 105,
      conversation_id: 5,
      sender_id: 1,
      message_type: 'action_card',
      card_type: 'accept_or_reject',
      card_data: {
        application_id: 42,
        price: 500,
        final_agreed_price: 500,
      },
      card_resolved: false,
      created_at: '2026-09-24T00:00:00.000Z',
    };

    const { getByText } = await render(
      <ActionCard
        message={offerMessage}
        currentUserId={2}
        currentUserRole="worker"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="employer_confirmed"
        onActionComplete={jest.fn()}
      />,
    );

    expect(getByText('Job Offer Received')).toBeTruthy();
    expect(getByText(/Agreed price:/)).toBeTruthy();
    expect(getByText('₱500.00')).toBeTruthy();
    expect(getByText('Meets DOLE Region V daily minimum wage baseline (₱455/day)')).toBeTruthy();
  });

  it('displays DOLE advisory notice on accept_or_reject card when offer is below ₱455', async () => {
    const lowOfferMessage: Message = {
      id: 106,
      conversation_id: 5,
      sender_id: 1,
      message_type: 'action_card',
      card_type: 'accept_or_reject',
      card_data: {
        application_id: 42,
        price: 300,
        final_agreed_price: 300,
      },
      card_resolved: false,
      created_at: '2026-09-24T00:00:00.000Z',
    };

    const { getByText } = await render(
      <ActionCard
        message={lowOfferMessage}
        currentUserId={2}
        currentUserRole="worker"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="employer_confirmed"
        onActionComplete={jest.fn()}
      />,
    );

    expect(getByText('Job Offer Received')).toBeTruthy();
    expect(getByText('₱300.00')).toBeTruthy();
    expect(
      getByText(
        'ℹ ₱300.00 is below the full-day DOLE baseline (₱455/day). Verify this matches your agreed working hours or task scope.',
      ),
    ).toBeTruthy();
  });
});
