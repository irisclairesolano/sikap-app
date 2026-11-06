import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { TranslationKey } from '../locales/en';
import { getItemAsync, getItemSync, setItemAsync } from '../utils/storage';

export type TutorialRole = 'worker' | 'employer';

export interface TargetRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface TutorialRoute {
  root: 'Worker' | 'Employer';
  tab: string;
  screen?: string;
}

export interface TutorialStep {
  id: string;
  targetIds: string[];
  titleKey: TranslationKey;
  descKey: TranslationKey;
  icon: string;
  route: TutorialRoute;
  /** Optional 0-4 index of the bottom tab to highlight alongside or as fallback */
  tabSlotIndex?: number;
  /** If true and none of targetIds are mounted after navigation settles, auto-skip */
  skipIfUnavailable?: boolean;
}

export const WORKER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'worker_step_1_find',
    targetIds: ['worker_search_filter', 'worker_setup_progress'],
    titleKey: 'tutorial_worker_step1_title',
    descKey: 'tutorial_worker_step1_desc',
    icon: 'search-outline',
    route: { root: 'Worker', tab: 'Find' },
    tabSlotIndex: 0,
  },
  {
    id: 'worker_step_2_skills',
    targetIds: ['worker_skill_chips', 'worker_setup_tasks'],
    titleKey: 'tutorial_worker_step2_title',
    descKey: 'tutorial_worker_step2_desc',
    icon: 'construct-outline',
    route: { root: 'Worker', tab: 'Find' },
    tabSlotIndex: 0,
    skipIfUnavailable: true,
  },
  {
    id: 'worker_step_3_applications',
    targetIds: ['worker_applications_overview'],
    titleKey: 'tutorial_worker_step3_title',
    descKey: 'tutorial_worker_step3_desc',
    icon: 'document-text-outline',
    route: { root: 'Worker', tab: 'Mine', screen: 'Applications' },
    tabSlotIndex: 1,
  },
  {
    id: 'worker_step_4_messages',
    targetIds: ['shared_messages_overview'],
    titleKey: 'tutorial_worker_step4_title',
    descKey: 'tutorial_worker_step4_desc',
    icon: 'chatbubble-ellipses-outline',
    route: { root: 'Worker', tab: 'Messages', screen: 'ConversationsList' },
    tabSlotIndex: 2,
  },
  {
    id: 'worker_step_5_notifications',
    targetIds: ['worker_notifications_overview'],
    titleKey: 'tutorial_worker_step5_title',
    descKey: 'tutorial_worker_step5_desc',
    icon: 'notifications-outline',
    route: { root: 'Worker', tab: 'Notifications', screen: 'NotificationsList' },
    tabSlotIndex: 3,
  },
  {
    id: 'worker_step_6_profile',
    targetIds: ['worker_profile_overview'],
    titleKey: 'tutorial_worker_step6_title',
    descKey: 'tutorial_worker_step6_desc',
    icon: 'person-outline',
    route: { root: 'Worker', tab: 'Me', screen: 'ProfileMain' },
    tabSlotIndex: 4,
  },
];

export const EMPLOYER_TUTORIAL_STEPS: TutorialStep[] = [
  {
    id: 'employer_step_1_stats',
    targetIds: ['employer_stats_grid'],
    titleKey: 'tutorial_employer_step1_title',
    descKey: 'tutorial_employer_step1_desc',
    icon: 'stats-chart-outline',
    route: { root: 'Employer', tab: 'Home', screen: 'EmployerDashboard' },
    tabSlotIndex: 0,
  },
  {
    id: 'employer_step_2_post_job',
    targetIds: ['employer_post_job_btn'],
    titleKey: 'tutorial_employer_step2_title',
    descKey: 'tutorial_employer_step2_desc',
    icon: 'add-circle-outline',
    route: { root: 'Employer', tab: 'Home', screen: 'EmployerDashboard' },
    tabSlotIndex: 0,
    skipIfUnavailable: true,
  },
  {
    id: 'employer_step_3_action_required',
    targetIds: ['employer_action_required'],
    titleKey: 'tutorial_employer_step3_title',
    descKey: 'tutorial_employer_step3_desc',
    icon: 'flash-outline',
    route: { root: 'Employer', tab: 'Home', screen: 'EmployerDashboard' },
    tabSlotIndex: 0,
    skipIfUnavailable: true,
  },
  {
    id: 'employer_step_4_my_jobs',
    targetIds: ['employer_myjobs_tabs'],
    titleKey: 'tutorial_employer_step4_title',
    descKey: 'tutorial_employer_step4_desc',
    icon: 'briefcase-outline',
    route: { root: 'Employer', tab: 'MyJobs', screen: 'MyJobsList' },
    tabSlotIndex: 1,
  },
  {
    id: 'employer_step_5_messages',
    targetIds: ['shared_messages_overview'],
    titleKey: 'tutorial_employer_step5_title',
    descKey: 'tutorial_employer_step5_desc',
    icon: 'chatbubble-ellipses-outline',
    route: { root: 'Employer', tab: 'Messages', screen: 'ConversationsList' },
    tabSlotIndex: 2,
  },
  {
    id: 'employer_step_6_profile',
    targetIds: ['employer_profile_overview'],
    titleKey: 'tutorial_employer_step6_title',
    descKey: 'tutorial_employer_step6_desc',
    icon: 'person-outline',
    route: { root: 'Employer', tab: 'Profile', screen: 'ProfileMain' },
    tabSlotIndex: 4,
  },
];

export const getTutorialStorageKey = (userId: number | string, role: TutorialRole): string =>
  `sikap_tutorial_completed_${userId}_${role}`;

// In-memory session cache so we never re-trigger during the same app session
const sessionCompletedKeys = new Set<string>();

export const resetTutorialSessionCacheForTests = () => {
  sessionCompletedKeys.clear();
};

type MeasureFn = () => Promise<TargetRect | null>;

interface StartTutorialOptions {
  isReplay?: boolean;
  userId?: number | string;
}

interface OnboardingTutorialContextValue {
  isActive: boolean;
  isTransitioning: boolean;
  isReplay: boolean;
  activeRole: TutorialRole | null;
  currentStepIndex: number;
  steps: TutorialStep[];
  currentStep: TutorialStep | null;
  targetRect: TargetRect | null;
  startTutorial: (role: TutorialRole, options?: StartTutorialOptions) => void;
  checkAndStartFirstTimeTutorial: (
    userId: number | string | undefined,
    role: TutorialRole,
  ) => Promise<boolean>;
  nextStep: () => void;
  prevStep: () => void;
  skipTutorial: () => void;
  registerTarget: (id: string, measureFn: MeasureFn) => void;
  unregisterTarget: (id: string) => void;
  refreshCurrentTarget: () => Promise<void>;
}

const OnboardingTutorialContext = createContext<OnboardingTutorialContextValue>({
  isActive: false,
  isTransitioning: false,
  isReplay: false,
  activeRole: null,
  currentStepIndex: 0,
  steps: [],
  currentStep: null,
  targetRect: null,
  startTutorial: () => {},
  checkAndStartFirstTimeTutorial: async () => false,
  nextStep: () => {},
  prevStep: () => {},
  skipTutorial: () => {},
  registerTarget: () => {},
  unregisterTarget: () => {},
  refreshCurrentTarget: async () => {},
});

interface ProviderProps {
  children: React.ReactNode;
  onNavigate?: (route: TutorialRoute) => void;
}

export const OnboardingTutorialProvider: React.FC<ProviderProps> = ({ children, onNavigate }) => {
  const [isActive, setIsActive] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isReplay, setIsReplay] = useState(false);
  const [activeRole, setActiveRole] = useState<TutorialRole | null>(null);
  const [activeUserId, setActiveUserId] = useState<number | string | undefined>(undefined);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  const targetsRef = useRef<Map<string, MeasureFn>>(new Map());
  const directionRef = useRef<'next' | 'prev'>('next');
  const lastNavigatedTabRef = useRef<string | null>(null);

  const steps = useMemo(() => {
    if (activeRole === 'employer') return EMPLOYER_TUTORIAL_STEPS;
    if (activeRole === 'worker') return WORKER_TUTORIAL_STEPS;
    return [];
  }, [activeRole]);

  const currentStep = useMemo(() => {
    if (!isActive || currentStepIndex < 0 || currentStepIndex >= steps.length) {
      return null;
    }
    return steps[currentStepIndex];
  }, [isActive, currentStepIndex, steps]);

  const persistCompletionIfNeeded = useCallback(
    async (userId?: number | string, role?: TutorialRole | null, replayMode?: boolean) => {
      // Replaying from Settings must not alter or overwrite the original completion status
      if (replayMode) return;
      if (userId != null && role) {
        const key = getTutorialStorageKey(userId, role);
        sessionCompletedKeys.add(key);
        try {
          await setItemAsync(key, 'true');
        } catch (e) {
          console.warn('Failed to persist tutorial completion:', e);
        }
      }
    },
    [],
  );

  const measureStepTarget = useCallback(
    async (step: TutorialStep | null): Promise<TargetRect | null> => {
      if (!step) return null;
      for (const id of step.targetIds) {
        const fn = targetsRef.current.get(id);
        if (fn) {
          try {
            const rect = await fn();
            if (rect && rect.width > 0 && rect.height > 0) {
              return rect;
            }
          } catch {
            // Ignore measurement failure and try next fallback ID
          }
        }
      }
      return null;
    },
    [],
  );

  const refreshCurrentTarget = useCallback(async () => {
    if (!currentStep) {
      setTargetRect(null);
      return;
    }
    const rect = await measureStepTarget(currentStep);
    setTargetRect(rect);
  }, [currentStep, measureStepTarget]);

  // Handle actual screen navigation and target measurement whenever currentStep changes
  useEffect(() => {
    if (!isActive || !currentStep) {
      setTargetRect(null);
      setIsTransitioning(false);
      return;
    }

    let isCancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const routeKey = `${currentStep.route.root}:${currentStep.route.tab}:${currentStep.route.screen || ''}`;
    const needsTabChange = lastNavigatedTabRef.current !== routeKey;

    if (onNavigate && needsTabChange) {
      lastNavigatedTabRef.current = routeKey;
      setIsTransitioning(true);
      setTargetRect(null);
      try {
        onNavigate(currentStep.route);
      } catch (e) {
        console.warn('Tutorial navigation error:', e);
      }
    }

    const attemptMeasurement = async (attempt: number) => {
      if (isCancelled) return;
      const rect = await measureStepTarget(currentStep);
      if (isCancelled) return;

      if (rect) {
        setTargetRect(rect);
        setIsTransitioning(false);
        return;
      }

      if (attempt < 3) {
        const delay = attempt === 1 ? 140 : 220;
        const t = setTimeout(() => attemptMeasurement(attempt + 1), delay);
        timers.push(t);
      } else {
        // Target remained unavailable after transition settled
        setIsTransitioning(false);
        if (currentStep.skipIfUnavailable && steps.length > 1) {
          const dir = directionRef.current;
          const nextIdx = dir === 'prev' ? currentStepIndex - 1 : currentStepIndex + 1;
          if (nextIdx >= 0 && nextIdx < steps.length) {
            setCurrentStepIndex(nextIdx);
            return;
          }
        }
        setTargetRect(null);
      }
    };

    const initialDelay = needsTabChange ? 120 : 40;
    const initialTimer = setTimeout(() => attemptMeasurement(1), initialDelay);
    timers.push(initialTimer);

    return () => {
      isCancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [isActive, currentStep, currentStepIndex, steps.length, measureStepTarget, onNavigate]);

  const registerTarget = useCallback((id: string, measureFn: MeasureFn) => {
    targetsRef.current.set(id, measureFn);
  }, []);

  const unregisterTarget = useCallback((id: string) => {
    targetsRef.current.delete(id);
  }, []);

  const startTutorial = useCallback((role: TutorialRole, options?: StartTutorialOptions) => {
    const replay = Boolean(options?.isReplay);
    directionRef.current = 'next';
    lastNavigatedTabRef.current = null;
    setIsReplay(replay);
    if (options?.userId !== undefined) {
      setActiveUserId(options.userId);
    }
    setActiveRole(role);
    setCurrentStepIndex(0);
    setTargetRect(null);
    setIsActive(true);
  }, []);

  const checkAndStartFirstTimeTutorial = useCallback(
    async (userId: number | string | undefined, role: TutorialRole): Promise<boolean> => {
      if (userId == null || isActive) return false;
      const key = getTutorialStorageKey(userId, role);

      if (sessionCompletedKeys.has(key) || getItemSync(key) === 'true') {
        sessionCompletedKeys.add(key);
        return false;
      }

      try {
        const stored = await getItemAsync(key);
        if (stored === 'true') {
          sessionCompletedKeys.add(key);
          return false;
        }
      } catch {
        // Proceed if storage read fails
      }

      // Mark in session cache immediately so concurrent effects don't double-launch
      sessionCompletedKeys.add(key);
      startTutorial(role, { isReplay: false, userId });
      return true;
    },
    [isActive, startTutorial],
  );

  const returnToHomeTab = useCallback(
    (role: TutorialRole | null) => {
      if (!onNavigate || !role) return;
      try {
        if (role === 'worker') {
          onNavigate({ root: 'Worker', tab: 'Find' });
        } else {
          onNavigate({ root: 'Employer', tab: 'Home', screen: 'EmployerDashboard' });
        }
      } catch {}
    },
    [onNavigate],
  );

  const finishOrSkip = useCallback(async () => {
    const roleToFinish = activeRole;
    const userToFinish = activeUserId;
    const wasReplay = isReplay;

    setIsActive(false);
    setIsTransitioning(false);
    setTargetRect(null);
    lastNavigatedTabRef.current = null;

    await persistCompletionIfNeeded(userToFinish, roleToFinish, wasReplay);
    returnToHomeTab(roleToFinish);
  }, [activeRole, activeUserId, isReplay, persistCompletionIfNeeded, returnToHomeTab]);

  const nextStep = useCallback(() => {
    directionRef.current = 'next';
    const currentRouteKey = currentStep
      ? `${currentStep.route.root}:${currentStep.route.tab}:${currentStep.route.screen || ''}`
      : '';

    let idx = currentStepIndex + 1;
    while (idx < steps.length) {
      const candidate = steps[idx];
      const candidateRouteKey = `${candidate.route.root}:${candidate.route.tab}:${candidate.route.screen || ''}`;
      const isSameScreen = !onNavigate || candidateRouteKey === currentRouteKey;
      const hasMountedTarget = candidate.targetIds.some((id) => targetsRef.current.has(id));
      if (candidate.skipIfUnavailable && isSameScreen && !hasMountedTarget) {
        idx += 1;
        continue;
      }
      break;
    }

    if (idx < steps.length) {
      setCurrentStepIndex(idx);
    } else {
      finishOrSkip();
    }
  }, [currentStep, currentStepIndex, steps, onNavigate, finishOrSkip]);

  const prevStep = useCallback(() => {
    directionRef.current = 'prev';
    const currentRouteKey = currentStep
      ? `${currentStep.route.root}:${currentStep.route.tab}:${currentStep.route.screen || ''}`
      : '';

    let idx = currentStepIndex - 1;
    while (idx >= 0) {
      const candidate = steps[idx];
      const candidateRouteKey = `${candidate.route.root}:${candidate.route.tab}:${candidate.route.screen || ''}`;
      const isSameScreen = !onNavigate || candidateRouteKey === currentRouteKey;
      const hasMountedTarget = candidate.targetIds.some((id) => targetsRef.current.has(id));
      if (candidate.skipIfUnavailable && isSameScreen && !hasMountedTarget && idx > 0) {
        idx -= 1;
        continue;
      }
      break;
    }

    if (idx >= 0) {
      setCurrentStepIndex(idx);
    }
  }, [currentStep, currentStepIndex, steps, onNavigate]);

  const skipTutorial = useCallback(() => {
    finishOrSkip();
  }, [finishOrSkip]);

  const value = useMemo<OnboardingTutorialContextValue>(
    () => ({
      isActive,
      isTransitioning,
      isReplay,
      activeRole,
      currentStepIndex,
      steps,
      currentStep,
      targetRect,
      startTutorial,
      checkAndStartFirstTimeTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      registerTarget,
      unregisterTarget,
      refreshCurrentTarget,
    }),
    [
      isActive,
      isTransitioning,
      isReplay,
      activeRole,
      currentStepIndex,
      steps,
      currentStep,
      targetRect,
      startTutorial,
      checkAndStartFirstTimeTutorial,
      nextStep,
      prevStep,
      skipTutorial,
      registerTarget,
      unregisterTarget,
      refreshCurrentTarget,
    ],
  );

  return (
    <OnboardingTutorialContext.Provider value={value}>
      {children}
    </OnboardingTutorialContext.Provider>
  );
};

export const useOnboardingTutorial = () => useContext(OnboardingTutorialContext);
