import React from 'react';
import { render } from '@testing-library/react-native';
import MessageBubble from '../../src/components/chat/MessageBubble';
import { Message } from '../../src/types';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('MessageBubble Hired Dedicated System Messages', () => {
  const hiredMessage: Message = {
    id: 101,
    conversation_id: 1,
    sender_id: null,
    body: '🎉 You are hired! The job is officially in progress. Work hard, stay safe, and communicate here.',
    message_type: 'system',
    card_resolved: false,
    created_at: new Date().toISOString(),
  };

  it('renders dedicated employer message when currentUserRole is employer', async () => {
    const { getByText, queryByText } = await render(
      <MessageBubble
        message={hiredMessage}
        isOwnMessage={false}
        currentUserRole="employer"
        otherUserName="Maria Santos"
      />,
    );

    // Employer should see dedicated message with the worker's name
    expect(
      getByText(
        '🎉 Maria Santos is officially hired! The job is in progress. Coordinate details, stay safe, and communicate here.',
      ),
    ).toBeTruthy();

    // Employer must NOT see "You are hired!"
    expect(
      queryByText(
        '🎉 You are hired! The job is officially in progress. Work hard, stay safe, and communicate here.',
      ),
    ).toBeNull();
  });

  it('renders worker congratulatory message when currentUserRole is worker', async () => {
    const { getByText } = await render(
      <MessageBubble
        message={hiredMessage}
        isOwnMessage={false}
        currentUserRole="worker"
        otherUserName="Boss Employer"
      />,
    );

    expect(
      getByText(
        '🎉 You are hired! The job is officially in progress. Work hard, stay safe, and communicate here.',
      ),
    ).toBeTruthy();
  });
});
