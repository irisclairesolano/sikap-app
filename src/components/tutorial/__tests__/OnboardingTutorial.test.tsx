import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { render, fireEvent, act } from '@testing-library/react-native';
import {
  OnboardingTutorialProvider,
  useOnboardingTutorial,
  getTutorialStorageKey,
  resetTutorialSessionCacheForTests,
  WORKER_TUTORIAL_STEPS,
  EMPLOYER_TUTORIAL_STEPS,
  TutorialRoute,
} from '../../../contexts/OnboardingTutorialContext';
import { TutorialSpotlightModal } from '../TutorialSpotlightModal';
import { TutorialTarget } from '../TutorialTarget';
import {
  LanguageProvider,
  useLanguage,
  getLanguageStorageKey,
} from '../../../contexts/LanguageContext';
import { notifyAuthChanged } from '../../../store/authEvents';
import * as storage from '../../../utils/storage';

jest.mock('../../../utils/storage', () => {
  const store: Record<string, string> = {};
  return {
    getItemSync: jest.fn((key: string) => store[key] ?? null),
    getItemAsync: jest.fn(async (key: string) => store[key] ?? null),
    setItemAsync: jest.fn(async (key: string, val: string) => {
      store[key] = val;
    }),
    deleteItemAsync: jest.fn(async (key: string) => {
      delete store[key];
    }),
    __clearStore: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
  };
});

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, bottom: 16, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: { children: React.ReactNode }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

const TestHarness: React.FC<{
  includeOptionalTargets?: boolean;
  onReady?: (
    api: ReturnType<typeof useOnboardingTutorial> & ReturnType<typeof useLanguage>,
  ) => void;
}> = ({ includeOptionalTargets = true, onReady }) => {
  const tutorial = useOnboardingTutorial();
  const lang = useLanguage();

  onReady?.({ ...tutorial, ...lang });

  return (
    <View>
      <TutorialTarget id="worker_search_filter">
        <Text>Search & Filter</Text>
      </TutorialTarget>
      {includeOptionalTargets && (
        <TutorialTarget id="worker_skill_chips">
          <Text>Skill Chips</Text>
        </TutorialTarget>
      )}
      <TutorialTarget id="worker_applications_overview">
        <Text>Applications</Text>
      </TutorialTarget>
      <TutorialTarget id="shared_messages_overview">
        <Text>Messages</Text>
      </TutorialTarget>
      <TutorialTarget id="worker_notifications_overview">
        <Text>Notifications</Text>
      </TutorialTarget>
      <TutorialTarget id="worker_profile_overview">
        <Text>Worker Profile</Text>
      </TutorialTarget>

      <TutorialTarget id="employer_stats_grid">
        <Text>Employer Stats</Text>
      </TutorialTarget>
      <TutorialTarget id="employer_post_job_btn">
        <Text>Post Job</Text>
      </TutorialTarget>
      {includeOptionalTargets && (
        <TutorialTarget id="employer_action_required">
          <Text>Action Required</Text>
        </TutorialTarget>
      )}
      <TutorialTarget id="employer_myjobs_tabs">
        <Text>My Jobs Tabs</Text>
      </TutorialTarget>
      <TutorialTarget id="employer_profile_overview">
        <Text>Employer Profile</Text>
      </TutorialTarget>

      <TouchableOpacity
        testID="replay-worker-btn"
        onPress={() => tutorial.startTutorial('worker', { isReplay: true, userId: 42 })}
      >
        <Text>Replay Worker</Text>
      </TouchableOpacity>
      <TutorialSpotlightModal />
    </View>
  );
};

describe('OnboardingTutorial', () => {
  jest.setTimeout(30000);

  beforeEach(() => {
    jest.useFakeTimers();
    (storage as any).__clearStore();
    resetTutorialSessionCacheForTests();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('triggers Worker tutorial on first login, navigates across screens, and persists completion', async () => {
    const navigatedRoutes: TutorialRoute[] = [];
    let api: any;

    const { getByTestId, queryByTestId } = await render(
      <LanguageProvider>
        <OnboardingTutorialProvider onNavigate={(route) => navigatedRoutes.push(route)}>
          <TestHarness
            onReady={(ctx) => {
              api = ctx;
            }}
          />
        </OnboardingTutorialProvider>
      </LanguageProvider>,
    );

    await act(async () => {
      await api.checkAndStartFirstTimeTutorial(101, 'worker');
      jest.runAllTimers();
    });

    expect(getByTestId('tutorial-step-title').props.children).toBe('Find Nearby Jobs');
    expect(navigatedRoutes[0]).toEqual({ root: 'Worker', tab: 'Find' });

    // Advance through all 6 Worker steps
    for (let i = 1; i < WORKER_TUTORIAL_STEPS.length; i++) {
      await act(async () => {
        fireEvent.press(getByTestId('tutorial-next-btn'));
        jest.runAllTimers();
      });
      expect(navigatedRoutes[navigatedRoutes.length - 1]).toEqual(WORKER_TUTORIAL_STEPS[i].route);
    }

    // Test Previous button on final step
    await act(async () => {
      fireEvent.press(getByTestId('tutorial-prev-btn'));
      jest.runAllTimers();
    });
    expect(getByTestId('tutorial-step-title').props.children).toBe('Real-Time Alerts');

    // Advance back to final step and finish
    await act(async () => {
      fireEvent.press(getByTestId('tutorial-next-btn'));
      jest.runAllTimers();
    });
    expect(getByTestId('tutorial-step-title').props.children).toBe('Your Profile & Settings');

    await act(async () => {
      fireEvent.press(getByTestId('tutorial-next-btn'));
      jest.runAllTimers();
    });

    expect(queryByTestId('tutorial-step-title')).toBeNull();
    expect(storage.setItemAsync).toHaveBeenCalledWith(getTutorialStorageKey(101, 'worker'), 'true');

    // Calling checkAndStartFirstTimeTutorial again for same user+role should NOT re-open tutorial
    await act(async () => {
      const startedAgain = await api.checkAndStartFirstTimeTutorial(101, 'worker');
      expect(startedAgain).toBe(false);
    });
  }, 30000);

  it('persists completion when user skips the first-time Employer tutorial and allows replay without overwriting storage', async () => {
    const navigatedRoutes: TutorialRoute[] = [];
    let api: any;

    const { getByTestId, queryByTestId } = await render(
      <LanguageProvider>
        <OnboardingTutorialProvider onNavigate={(route) => navigatedRoutes.push(route)}>
          <TestHarness
            onReady={(ctx) => {
              api = ctx;
            }}
          />
        </OnboardingTutorialProvider>
      </LanguageProvider>,
    );

    await act(async () => {
      await api.checkAndStartFirstTimeTutorial(202, 'employer');
      jest.runAllTimers();
    });

    expect(getByTestId('tutorial-step-title').props.children).toBe('Your Hiring Overview');
    expect(EMPLOYER_TUTORIAL_STEPS).toHaveLength(6);

    // Skip on step 1
    await act(async () => {
      fireEvent.press(getByTestId('tutorial-skip-btn'));
      jest.runAllTimers();
    });

    expect(queryByTestId('tutorial-step-title')).toBeNull();
    expect(storage.setItemAsync).toHaveBeenCalledWith(
      getTutorialStorageKey(202, 'employer'),
      'true',
    );

    (storage.setItemAsync as jest.Mock).mockClear();

    // Replay tutorial from Settings
    await act(async () => {
      fireEvent.press(getByTestId('replay-worker-btn'));
      jest.runAllTimers();
    });

    expect(getByTestId('tutorial-step-title').props.children).toBe('Find Nearby Jobs');

    // Skipping replay does NOT mutate persistence
    await act(async () => {
      fireEvent.press(getByTestId('tutorial-skip-btn'));
      jest.runAllTimers();
    });

    expect(storage.setItemAsync).not.toHaveBeenCalled();
  }, 30000);

  it('gracefully skips optional steps whose targets are not rendered and supports Tagalog localization', async () => {
    let api: any;

    const { getByTestId } = await render(
      <LanguageProvider>
        <OnboardingTutorialProvider>
          <TestHarness
            includeOptionalTargets={false}
            onReady={(ctx) => {
              api = ctx;
            }}
          />
        </OnboardingTutorialProvider>
      </LanguageProvider>,
    );

    await act(async () => {
      await api.setLanguage('tl');
      api.startTutorial('worker', { isReplay: true, userId: 55 });
      jest.runAllTimers();
    });

    // Step 1 in Tagalog
    expect(getByTestId('tutorial-step-title').props.children).toBe('Maghanap ng Trabaho');

    // Pressing Next when Step 2 (worker_skill_chips, skipIfUnavailable: true) is unmounted auto-advances to Step 3
    await act(async () => {
      fireEvent.press(getByTestId('tutorial-next-btn'));
      jest.runAllTimers();
    });

    expect(getByTestId('tutorial-step-title').props.children).toBe('Subaybayan ang Aplikasyon');
  }, 30000);

  it('scopes language preference per user account and resets to English when switching to another account', async () => {
    let api: any;

    await storage.setItemAsync('auth_token', 'token-101');
    await storage.setItemAsync('user_profile', JSON.stringify({ id: 101, name: 'Juan Worker' }));

    await render(
      <LanguageProvider>
        <OnboardingTutorialProvider>
          <TestHarness
            onReady={(ctx) => {
              api = ctx;
            }}
          />
        </OnboardingTutorialProvider>
      </LanguageProvider>,
    );

    // Account A selects Filipino ('tl')
    await act(async () => {
      await api.setLanguage('tl');
    });

    expect(api.language).toBe('tl');
    expect(api.t('my_profile')).toBe('Profile Ko');
    expect(await storage.getItemAsync(getLanguageStorageKey(101))).toBe('tl');

    // Account A logs out -> language resets to English
    await act(async () => {
      await storage.deleteItemAsync('auth_token');
      await storage.deleteItemAsync('user_profile');
      notifyAuthChanged();
    });

    expect(api.language).toBe('en');
    expect(api.t('my_profile')).toBe('My Profile');

    // Account B (id: 202) logs in with no saved language -> stays English
    await act(async () => {
      await storage.setItemAsync('auth_token', 'token-202');
      await storage.setItemAsync(
        'user_profile',
        JSON.stringify({ id: 202, name: 'Maria Employer' }),
      );
      notifyAuthChanged();
    });

    expect(api.language).toBe('en');
    expect(api.t('my_profile')).toBe('My Profile');

    // Account A (id: 101) logs back in -> restores Filipino ('tl') automatically
    await act(async () => {
      await storage.setItemAsync('auth_token', 'token-101');
      await storage.setItemAsync('user_profile', JSON.stringify({ id: 101, name: 'Juan Worker' }));
      notifyAuthChanged();
    });

    expect(api.language).toBe('tl');
    expect(api.t('my_profile')).toBe('Profile Ko');
  }, 30000);
});
