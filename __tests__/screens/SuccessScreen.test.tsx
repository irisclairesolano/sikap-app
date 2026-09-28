import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { BackHandler, AccessibilityInfo } from 'react-native';
import SuccessScreen from '../../src/screens/common/SuccessScreen';
import { triggerHaptic } from '../../src/utils/haptics';

let mockRoute: any = { params: {} };

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../src/utils/haptics', () => ({
  triggerHaptic: jest.fn(),
}));

jest.mock('@react-navigation/native', () => ({
  useRoute: () => mockRoute,
  useNavigation: () => mockNavigation,
}));

let mockNavigation: any = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  popToTop: jest.fn(),
  canGoBack: jest.fn().mockReturnValue(true),
};

describe('SuccessScreen Component', () => {
  let backHandlerCallback: (() => boolean) | null = null;

  beforeEach(() => {
    jest.clearAllMocks();
    backHandlerCallback = null;
    jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(true);

    jest.spyOn(BackHandler, 'addEventListener').mockImplementation((event, handler) => {
      if (event === 'hardwareBackPress') {
        backHandlerCallback = handler;
      }
      return { remove: jest.fn() } as any;
    });

    mockNavigation = {
      navigate: jest.fn(),
      goBack: jest.fn(),
      popToTop: jest.fn(),
      canGoBack: jest.fn().mockReturnValue(true),
    };
  });

  afterEach(() => {
    jest.clearAllTimers();
  });

  it('triggers success haptic feedback on mount', async () => {
    mockRoute = {
      params: {
        title: 'Review sent',
        message: 'Salamat!',
        primaryAction: { label: 'Done', goBack: true },
      },
    };

    await render(<SuccessScreen />);

    expect(triggerHaptic).toHaveBeenCalledWith('success');
  });

  it('navigates to target screen on primary action tap', async () => {
    mockRoute = {
      params: {
        title: 'Your job is live!',
        message: 'Workers can now see it and apply.',
        primaryAction: {
          label: 'View my jobs',
          navigateTo: { name: 'MyJobsList' },
        },
      },
    };

    const { getByText } = await render(<SuccessScreen />);

    await act(async () => {
      fireEvent.press(getByText('View my jobs'));
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('MyJobsList', undefined);
  });

  it('executes secondaryAction on hardware back press', async () => {
    mockRoute = {
      params: {
        title: 'Job completed!',
        message: 'Please rate your worker.',
        primaryAction: {
          label: 'Rate worker',
          navigateTo: { name: 'RateWorkerList', params: { jobId: 1 } },
        },
        secondaryAction: {
          label: 'Later',
          navigateTo: { name: 'JobStatusManagement', params: { id: 1 } },
        },
      },
    };

    await render(<SuccessScreen />);

    expect(backHandlerCallback).toBeTruthy();
    await act(async () => {
      backHandlerCallback!();
    });

    expect(mockNavigation.navigate).toHaveBeenCalledWith('JobStatusManagement', { id: 1 });
  });

  it('debounces rapid repeated taps to prevent double navigation', async () => {
    mockRoute = {
      params: {
        title: 'Offer sent',
        message: 'Notification sent.',
        primaryAction: {
          label: 'Back to applicants',
          goBack: true,
        },
      },
    };

    const { getByText } = await render(<SuccessScreen />);

    const button = getByText('Back to applicants');
    await act(async () => {
      fireEvent.press(button);
      fireEvent.press(button);
      fireEvent.press(button);
    });

    expect(mockNavigation.goBack).toHaveBeenCalledTimes(1);
  });
});
