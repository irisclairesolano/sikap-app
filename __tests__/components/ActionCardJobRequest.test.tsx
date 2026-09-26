import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActionCard from '../../src/components/chat/ActionCard';
import { Message } from '../../src/types';

jest.mock('@tanstack/react-query', () => ({
  useQueryClient: () => ({
    invalidateQueries: jest.fn(),
  }),
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

describe('ActionCard Job Request Component', () => {
  const mockJobRequestMessage: Message = {
    id: 101,
    conversation_id: 5,
    sender_id: null,
    message_type: 'action_card',
    card_type: 'job_request',
    card_data: {
      application_id: 42,
      job_title: 'House Cleaning',
      employer_name: 'Cristina Solano',
      worker_name: 'Juan Dela Cruz',
    },
    card_resolved: false,
    created_at: '2026-09-24T00:00:00.000Z',
  };

  it('renders for worker with employer name, job title applied for, and next steps guide', async () => {
    const { getByText, getAllByText, queryByText, queryByPlaceholderText } = await render(
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

    // Header & Announcement
    expect(getByText('Job Request')).toBeTruthy();
    expect(getByText('Cristina Solano')).toBeTruthy();
    expect(getAllByText('House Cleaning').length).toBeGreaterThanOrEqual(1);

    // Next Steps Guidance for worker
    expect(getByText('Next Steps')).toBeTruthy();
    expect(getByText('Discuss Details in Chat')).toBeTruthy();
    expect(getByText('Wait for Final Offer')).toBeTruthy();
    expect(getByText('Review & Accept')).toBeTruthy();

    // Friendly chat ready status
    expect(getByText('Chat is open · Feel free to discuss terms with the employer')).toBeTruthy();

    // Must NOT show the old premature final price waiting pill or input box
    expect(queryByText('Waiting for employer to set final price & confirm hire...')).toBeNull();
    expect(queryByPlaceholderText('Enter agreed price (₱)')).toBeNull();
  });

  it('renders for employer with applicant announcement, next steps, and toggleable price confirmation', async () => {
    const { getByText, getAllByText, getByTestId, queryByPlaceholderText, getByPlaceholderText } =
      await render(
        <ActionCard
          message={mockJobRequestMessage}
          currentUserId={1}
          currentUserRole="employer"
          conversationId={5}
          conversationStatus="open"
          applicationStatus="pending_negotiation"
          onActionComplete={jest.fn()}
        />,
      );

    // Header & Announcement
    expect(getByText('Job Request')).toBeTruthy();
    expect(getByText('Juan Dela Cruz')).toBeTruthy();
    expect(getAllByText('House Cleaning').length).toBeGreaterThanOrEqual(1);

    // Next Steps Guidance for employer
    expect(getByText('Next Steps')).toBeTruthy();
    expect(getByText('Message the Worker')).toBeTruthy();
    expect(getByText('Agree on Final Price')).toBeTruthy();
    expect(getByText('Set Price & Confirm')).toBeTruthy();

    // D6 Hire Decision Gate is present
    expect(getByText('Hire Decision')).toBeTruthy();
    expect(getByText('Hire Worker')).toBeTruthy();
    expect(getByText('Decline')).toBeTruthy();
    expect(queryByPlaceholderText('Enter agreed price (₱)')).toBeNull();

    // Tapping Hire Worker reveals the price input and confirm button
    await fireEvent.press(getByText('Hire Worker'));
    expect(getByPlaceholderText('Enter agreed price (₱)')).toBeTruthy();
    expect(getByText('Confirm Hire')).toBeTruthy();
  });

  it('renders completed etched card once hire is confirmed', async () => {
    const resolvedMessage: Message = {
      ...mockJobRequestMessage,
      card_resolved: true,
      card_data: {
        ...mockJobRequestMessage.card_data,
        final_agreed_price: 1500,
      },
    };

    const { getByText } = await render(
      <ActionCard
        message={resolvedMessage}
        currentUserId={2}
        currentUserRole="worker"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="employer_confirmed"
        onActionComplete={jest.fn()}
      />,
    );

    expect(getByText('Hire Confirmed by Employer')).toBeTruthy();
    expect(getByText('Agreed Price: ₱1,500.00')).toBeTruthy();
    expect(getByText('Confirmed')).toBeTruthy();
  });
});
