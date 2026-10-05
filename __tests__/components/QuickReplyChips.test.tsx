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
  it('renders worker quick replies when role is worker', async () => {
    const onSelectChip = jest.fn();
    const { getByText } = await render(
      <QuickReplyChips userRole="worker" onSelectChip={onSelectChip} />,
    );

    expect(getByText('Available bukas')).toBeTruthy();
    expect(getByText('Exact location?')).toBeTruthy();

    const chip = getByText('Available bukas');
    await act(async () => {
      fireEvent.press(chip);
    });

    expect(onSelectChip).toHaveBeenCalledWith('Available po ako bukas magsimula.');
  });

  it('renders employer quick replies when role is employer', async () => {
    const onSelectChip = jest.fn();
    const { getByText } = await render(
      <QuickReplyChips userRole="employer" onSelectChip={onSelectChip} />,
    );

    expect(getByText('Kailan puwede?')).toBeTruthy();
    expect(getByText('Nasa Bulan ka ba?')).toBeTruthy();

    const chip = getByText('Kailan puwede?');
    await act(async () => {
      fireEvent.press(chip);
    });

    expect(onSelectChip).toHaveBeenCalledWith(
      'Kailan ka pinakamaagang puwede magsimula sa trabaho?',
    );
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
