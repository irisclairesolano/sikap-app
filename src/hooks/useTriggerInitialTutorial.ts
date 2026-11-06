import { useEffect } from 'react';
import { useIsFocused } from '@react-navigation/native';
import { TutorialRole, useOnboardingTutorial } from '../contexts/OnboardingTutorialContext';

interface TriggerTutorialParams {
  user: any;
  role: TutorialRole;
  isScreenReady: boolean;
}

/**
 * Safely triggers the first-time user onboarding tutorial ONLY when:
 * 1. The user is authenticated and admin-approved (`registration_status === 'approved'`).
 * 2. Initial role onboarding (`RoleOnboardingScreen`) is already complete.
 * 3. The target home screen is focused and finished loading its initial layout.
 * 4. The user has not previously completed or skipped the tutorial for this role.
 */
export const useTriggerInitialTutorial = ({ user, role, isScreenReady }: TriggerTutorialParams) => {
  const isFocused = useIsFocused();
  const { isActive, checkAndStartFirstTimeTutorial } = useOnboardingTutorial();

  useEffect(() => {
    if (!isFocused || !isScreenReady || isActive || !user?.id) {
      return;
    }

    // Must be an approved account (never trigger during OTP, ID upload, or pending review)
    const isApproved =
      user.registration_status === 'approved' || user.verification_status === 'approved';
    if (!isApproved || user.is_suspended) {
      return;
    }

    // Ensure role profile onboarding is complete so we never conflict with RoleOnboardingScreen
    if (role === 'worker') {
      const workerSkills = user.worker_profile?.skills || (user as any).workerProfile?.skills || [];
      const hasWorkerProf =
        (user.has_worker_profile || !!user.worker_profile || !!(user as any).workerProfile) &&
        workerSkills.length > 0;
      if (!hasWorkerProf) return;
    } else if (role === 'employer') {
      const hasEmployerProf =
        user.has_employer_profile || !!user.employer_profile || !!(user as any).employerProfile;
      if (!hasEmployerProf) return;
    }

    const timer = setTimeout(() => {
      checkAndStartFirstTimeTutorial(user.id, role);
    }, 350);

    return () => clearTimeout(timer);
  }, [isFocused, isScreenReady, isActive, user, role, checkAndStartFirstTimeTutorial]);
};
