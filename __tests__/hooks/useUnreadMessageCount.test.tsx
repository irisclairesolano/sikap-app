import React from 'react';
import { Text, View } from 'react-native';
import { render, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUnreadMessageCount } from '../../src/hooks/useConversations';
import { messagesApi } from '../../src/api/messages';
import * as pushNotifications from '../../src/hooks/usePushNotifications';
import {
  setActiveChatConversationId,
  getActiveChatConversationId,
} from '../../src/utils/activeChatTracker';

jest.mock('../../src/api/messages', () => ({
  messagesApi: {
    getUnreadCount: jest.fn(),
    getConversations: jest.fn(),
  },
}));

jest.mock('../../src/hooks/usePushNotifications', () => ({
  triggerSystemNotification: jest.fn(),
}));

jest.mock('../../src/utils/haptics', () => ({
  triggerHaptic: jest.fn(),
}));

const TestComponent: React.FC<{ role?: 'employer' | 'worker' }> = ({ role = 'employer' }) => {
  const { data: count } = useUnreadMessageCount(role);
  return (
    <View>
      <Text testID="unread-count">{String(count)}</Text>
    </View>
  );
};

describe('useUnreadMessageCount', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    jest.clearAllMocks();
    setActiveChatConversationId(null);
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  it('renders unread count from messagesApi', async () => {
    (messagesApi.getUnreadCount as jest.Mock).mockResolvedValueOnce({
      unread_count: 3,
      latest_message: {
        id: 101,
        conversation_id: 10,
        sender_id: 5,
        sender_name: 'Juan Worker',
        body: 'Hello sir, I am on my way.',
        created_at: new Date().toISOString(),
      },
    });

    const rendered = await render(
      <QueryClientProvider client={queryClient}>
        <TestComponent role="employer" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(rendered.getByTestId('unread-count').props.children).toBe('3');
    });
  });

  it('suppresses toast banner when user is already active in that chat', async () => {
    setActiveChatConversationId(10);
    expect(getActiveChatConversationId()).toBe(10);

    (messagesApi.getUnreadCount as jest.Mock).mockResolvedValueOnce({
      unread_count: 1,
      latest_message: {
        id: 102,
        conversation_id: 10,
        sender_id: 5,
        sender_name: 'Juan Worker',
        body: 'Arrived at the site!',
        created_at: new Date().toISOString(),
      },
    });

    const rendered = await render(
      <QueryClientProvider client={queryClient}>
        <TestComponent role="employer" />
      </QueryClientProvider>,
    );

    await waitFor(() => {
      expect(rendered.getByTestId('unread-count').props.children).toBe('1');
    });

    expect(pushNotifications.triggerSystemNotification).not.toHaveBeenCalled();
  });
});
