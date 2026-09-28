import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { AccessibilityInfo } from 'react-native';
import SuccessView from '../../src/components/common/SuccessView';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

describe('SuccessView Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);
  });

  it('renders confirmation variant with title, message, and details card', async () => {
    const onPrimary = jest.fn();
    const onSecondary = jest.fn();

    const { getByText } = await render(
      <SuccessView
        variant="confirm"
        title="Job completed!"
        message="Nice work! Please rate your worker."
        detail={[
          { label: 'Job', value: 'Plumbing Repair' },
          { label: 'Worker', value: 'Juan Dela Cruz' },
        ]}
        primaryAction={{ label: 'Rate worker', onPress: onPrimary }}
        secondaryAction={{ label: 'Later', onPress: onSecondary }}
      />,
    );

    expect(getByText('Job completed!')).toBeTruthy();
    expect(getByText('Nice work! Please rate your worker.')).toBeTruthy();
    expect(getByText('Plumbing Repair')).toBeTruthy();
    expect(getByText('Juan Dela Cruz')).toBeTruthy();

    const primaryBtn = getByText('Rate worker');
    await act(async () => {
      fireEvent.press(primaryBtn);
    });
    expect(onPrimary).toHaveBeenCalledTimes(1);

    const secondaryBtn = getByText('Later');
    await act(async () => {
      fireEvent.press(secondaryBtn);
    });
    expect(onSecondary).toHaveBeenCalledTimes(1);
  });

  it('renders milestone celebration variant with milestone badge', async () => {
    const { getByText } = await render(
      <SuccessView
        variant="milestone"
        title="Your first job is live!"
        message="Congratulations po! This is the first of many."
        primaryAction={{ label: 'View my jobs', onPress: jest.fn() }}
      />,
    );

    expect(getByText('MILESTONE UNLOCKED')).toBeTruthy();
    expect(getByText('Your first job is live!')).toBeTruthy();
    expect(getByText('Congratulations po! This is the first of many.')).toBeTruthy();
  });

  it('announces accessibility message on mount', async () => {
    const announceSpy = jest
      .spyOn(AccessibilityInfo, 'announceForAccessibility')
      .mockImplementation(() => {});

    await render(
      <SuccessView
        title="Review sent"
        message="Salamat!"
        primaryAction={{ label: 'Done', onPress: jest.fn() }}
      />,
    );

    expect(announceSpy).toHaveBeenCalledWith('Review sent. Salamat!');
  });
});
