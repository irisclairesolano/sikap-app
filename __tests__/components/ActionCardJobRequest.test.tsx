import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import ActionCard from '../../src/components/chat/ActionCard';
import { deduplicateActionCardMessages } from '../../src/screens/messages/ChatScreen';
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
    expect(getByText('Shortlisted Application')).toBeTruthy();
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
    expect(getByText('Shortlisted Application')).toBeTruthy();
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
  }, 15000);

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

  it('renders Flag Job as Completed button for worker when job is in progress', async () => {
    const flagOfflineMessage: Message = {
      id: 102,
      conversation_id: 5,
      sender_id: null,
      message_type: 'action_card',
      card_type: 'flag_offline',
      card_data: {
        application_id: 42,
        job_id: 10,
        job_title: 'House Cleaning',
        worker_name: 'Juan Dela Cruz',
        employer_name: 'Cristina Solano',
        is_flagged: false,
      },
      card_resolved: false,
      created_at: '2026-09-24T00:00:00.000Z',
    };

    const { getByText } = await render(
      <ActionCard
        message={flagOfflineMessage}
        currentUserId={2}
        currentUserRole="worker"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="accepted"
        onActionComplete={jest.fn()}
      />,
    );

    expect(getByText('Finish Work')).toBeTruthy();
    expect(getByText('Flag Job as Completed')).toBeTruthy();
  });

  it('renders Rate CTA buttons when job is completed', async () => {
    const completedFlagOfflineMessage: Message = {
      id: 103,
      conversation_id: 5,
      sender_id: null,
      message_type: 'action_card',
      card_type: 'flag_offline',
      card_data: {
        application_id: 42,
        job_id: 10,
        job_title: 'House Cleaning',
        worker_name: 'Juan Dela Cruz',
        employer_name: 'Cristina Solano',
        is_flagged: true,
      },
      card_resolved: true,
      created_at: '2026-09-24T00:00:00.000Z',
    };

    // Employer view
    const employerRender = await render(
      <ActionCard
        message={completedFlagOfflineMessage}
        currentUserId={1}
        currentUserRole="employer"
        conversationId={5}
        conversationStatus="locked"
        applicationStatus="completed"
        onActionComplete={jest.fn()}
      />,
    );
    expect(employerRender.getByText('Job Marked Complete')).toBeTruthy();
    expect(employerRender.getByText('Rate Worker')).toBeTruthy();

    // Worker view
    const workerRender = await render(
      <ActionCard
        message={completedFlagOfflineMessage}
        currentUserId={2}
        currentUserRole="worker"
        conversationId={5}
        conversationStatus="locked"
        applicationStatus="completed"
        onActionComplete={jest.fn()}
      />,
    );
    expect(workerRender.getByText('Job Marked Complete')).toBeTruthy();
    expect(workerRender.getByText('Rate Employer')).toBeTruthy();
  });

  it('renders Work flagged as done by [worker]. Confirm for employer when worker flags complete, without Rate Worker button', async () => {
    const flaggedMessage: Message = {
      id: 104,
      conversation_id: 5,
      sender_id: null,
      message_type: 'action_card',
      card_type: 'flag_offline',
      card_data: {
        application_id: 42,
        job_id: 10,
        job_title: 'House Cleaning',
        worker_name: 'Juan Dela Cruz',
        employer_name: 'Cristina Solano',
        is_flagged: true,
      },
      card_resolved: false,
      created_at: '2026-09-24T00:00:00.000Z',
    };

    const employerRender = await render(
      <ActionCard
        message={flaggedMessage}
        currentUserId={1}
        currentUserRole="employer"
        conversationId={5}
        conversationStatus="open"
        applicationStatus="accepted"
        onActionComplete={jest.fn()}
      />,
    );

    expect(
      employerRender.getAllByText('Work flagged as done by Juan Dela Cruz. Confirm').length,
    ).toBeGreaterThanOrEqual(1);
    expect(employerRender.queryByText('Rate Worker')).toBeNull();
    expect(employerRender.queryByText('Mark Job as Complete')).toBeNull();
  });

  describe('deduplicateActionCardMessages', () => {
    it('ensures there is only one card per action even with duplicates', () => {
      const messages: Message[] = [
        {
          id: 1,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'job_request',
          card_data: { application_id: 1 },
          card_resolved: true,
          created_at: '2026-09-24T01:00:00.000Z',
        },
        {
          id: 2,
          conversation_id: 10,
          sender_id: 1,
          message_type: 'text',
          body: 'Hello there!',
          card_resolved: false,
          created_at: '2026-09-24T01:05:00.000Z',
        },
        {
          id: 3,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'confirm_hire',
          card_data: { application_id: 1, price: 1500 },
          card_resolved: true,
          created_at: '2026-09-24T01:10:00.000Z',
        },
        {
          id: 4,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'accept_or_reject',
          card_data: { application_id: 1, price: 1500 },
          card_resolved: true,
          created_at: '2026-09-24T01:15:00.000Z',
        },
        {
          id: 5,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'accept_or_reject',
          card_data: { application_id: 1, price: 1500 },
          card_resolved: true,
          created_at: '2026-09-24T01:20:00.000Z',
        },
        {
          id: 6,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'mark_complete',
          card_data: { application_id: 1 },
          card_resolved: true,
          created_at: '2026-09-24T01:25:00.000Z',
        },
        {
          id: 7,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'flag_offline',
          card_data: { application_id: 1, is_flagged: false },
          card_resolved: true,
          created_at: '2026-09-24T01:30:00.000Z',
        },
        {
          id: 8,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'flag_offline',
          card_data: { application_id: 1, is_flagged: true },
          card_resolved: true,
          created_at: '2026-09-24T01:35:00.000Z',
        },
      ];

      const dedupedCompleted = deduplicateActionCardMessages(messages, 'employer', 'completed');

      // Proposal action: only latest confirm_hire (id: 3) should remain, job_request (id: 1) removed
      expect(dedupedCompleted.find((m) => m.id === 1)).toBeUndefined();
      expect(dedupedCompleted.find((m) => m.id === 3)).toBeDefined();

      // Text message (id: 2) must remain intact
      expect(dedupedCompleted.find((m) => m.id === 2)).toBeDefined();

      // Accept/reject action: only latest (id: 5) remains, earlier (id: 4) removed
      expect(dedupedCompleted.find((m) => m.id === 4)).toBeUndefined();
      expect(dedupedCompleted.find((m) => m.id === 5)).toBeDefined();

      // Completed job: only one completion card remains (id: 8), mark_complete and earlier flag_offline removed
      expect(dedupedCompleted.find((m) => m.id === 6)).toBeUndefined();
      expect(dedupedCompleted.find((m) => m.id === 7)).toBeUndefined();
      expect(dedupedCompleted.find((m) => m.id === 8)).toBeDefined();

      // Exactly 4 messages total (1 proposal card, 1 text, 1 accept card, 1 completion card)
      expect(dedupedCompleted.length).toBe(4);
    });

    it('omits cancel_hire card once application is accepted or completed', () => {
      const messages: Message[] = [
        {
          id: 1,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'cancel_hire',
          card_resolved: true,
          created_at: '2026-09-24T01:00:00.000Z',
        },
      ];

      const resultAccepted = deduplicateActionCardMessages(messages, 'employer', 'accepted');
      expect(resultAccepted.length).toBe(0);

      const resultCompleted = deduplicateActionCardMessages(messages, 'employer', 'completed');
      expect(resultCompleted.length).toBe(0);

      const resultConfirmed = deduplicateActionCardMessages(
        messages,
        'employer',
        'employer_confirmed',
      );
      expect(resultConfirmed.length).toBe(1);
    });

    it('omits mark_complete when worker has flagged complete offline', () => {
      const messages: Message[] = [
        {
          id: 1,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'mark_complete',
          card_data: { application_id: 1, job_id: 10 },
          card_resolved: false,
          created_at: '2026-09-24T01:00:00.000Z',
        },
        {
          id: 2,
          conversation_id: 10,
          sender_id: null,
          message_type: 'action_card',
          card_type: 'flag_offline',
          card_data: {
            application_id: 1,
            job_id: 10,
            is_flagged: true,
            worker_name: 'Juan Dela Cruz',
          },
          card_resolved: false,
          created_at: '2026-09-24T01:05:00.000Z',
        },
      ];

      const result = deduplicateActionCardMessages(messages, 'employer', 'accepted');
      expect(result.length).toBe(1);
      expect(result[0].card_type).toBe('flag_offline');
      expect(result.find((m) => m.card_type === 'mark_complete')).toBeUndefined();
    });
  });
});
