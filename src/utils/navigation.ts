import { triggerHaptic } from './haptics';

/**
 * Safe navigation helpers to enforce:
 * 1. Hierarchical Up Navigation (pops directly to parent route if already in stack history)
 * 2. Wizard Flow Pruning (skips transient/wizard screens like Success, ConfirmHire, MarkComplete)
 * 3. Deep-link / Notification fallbacks so users are never stranded.
 */
export const safeGoBack = (navigation: any, fallbackRoute = 'Home', fallbackParams?: object) => {
  if (!navigation) return;

  triggerHaptic('light');

  const state = navigation.getState?.();
  const routes = state?.routes || [];
  const currentIndex = typeof state?.index === 'number' ? state.index : routes.length - 1;

  if (currentIndex > 0) {
    // 1. Hierarchical Up Navigation: If the fallback parent route already exists in history,
    // pop back directly to it rather than blindly unwinding intermediate steps!
    if (fallbackRoute) {
      const precedingRoutes = routes.slice(0, currentIndex);
      let targetIndex = -1;
      for (let i = precedingRoutes.length - 1; i >= 0; i--) {
        if (precedingRoutes[i].name === fallbackRoute) {
          targetIndex = i;
          break;
        }
      }

      if (targetIndex >= 0 && typeof navigation.pop === 'function') {
        const popCount = currentIndex - targetIndex;
        navigation.pop(popCount);
        return;
      }
    }

    // 2. Wizard & Transient Screen Pruning: Skip transient/action screens
    const prevRoute = routes[currentIndex - 1];
    const transientScreens = [
      'Success',
      'ConfirmHire',
      'MarkComplete',
      'CancelHire',
      'SendRequest',
    ];

    if (transientScreens.includes(prevRoute?.name)) {
      if (currentIndex > 1 && typeof navigation.pop === 'function') {
        navigation.pop(2);
        return;
      }
      if (typeof navigation.popToTop === 'function') {
        navigation.popToTop();
        return;
      }
    }

    if (navigation.canGoBack?.()) {
      navigation.goBack();
      return;
    }
  }

  // 3. Fallback for deep-links, notifications, or root stacks
  if (navigation.canGoBack?.()) {
    navigation.goBack();
  } else if (typeof navigation.navigate === 'function') {
    navigation.navigate(fallbackRoute, fallbackParams);
  }
};
