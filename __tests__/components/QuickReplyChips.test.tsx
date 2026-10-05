import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import QuickReplyChips from '../../src/components/chat/QuickReplyChips';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: {
    Light: 'light',
  },
}));

describe('QuickReplyChips Component', () => {
  beforeAll(() => {
    jest.setTimeout(15000);
  });
  it('renders worker quick replies when role is worker', async () => {
    const onSelectChip = jest.fn();
    const { getByText } = await render(
      <QuickReplyChips userRole="worker" onSelectChip={onSelectChip} />,
    );

    expect(getByText('Available tomorrow')).toBeTruthy();
    expect(getByText('Exact location?')).toBeTruthy();

    const chip = getByText('Available tomorrow');
    await act(async () => {
      fireEvent.press(chip);
    });

    expect(onSelectChip).toHaveBeenCalledWith('I am available to start tomorrow.');
  });

  it('renders employer quick replies when role is employer', async () => {
    const onSelectChip = jest.fn();
    const { getByText } = await render(
      <QuickReplyChips userRole="employer" onSelectChip={onSelectChip} />,
    );

    expect(getByText('When can you start?')).toBeTruthy();
    expect(getByText('Are you nearby?')).toBeTruthy();

    const chip = getByText('When can you start?');
    await act(async () => {
      fireEvent.press(chip);
    });

    expect(onSelectChip).toHaveBeenCalledWith('When is the earliest you can start the job?');
  });

  it('calls onDismiss when close button is pressed', async () => {
    const onDismiss = jest.fn();
    const { getByLabelText } = await render(
      <QuickReplyChips userRole="worker" onSelectChip={jest.fn()} onDismiss={onDismiss} />,
    );

    const closeBtn = getByLabelText('Remove quick replies');
    expect(closeBtn).toBeTruthy();

    await act(async () => {
      fireEvent.press(closeBtn);
    });

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });
});
