import { BackHandler } from 'react-native';

/**
 * Safe navigation helpers to prevent back-button loops,
 * trapped screens, and landing on one-time congratulatory/success screens.
 */
export const safeGoBack = (navigation: any, fallbackRoute = 'Home', fallbackParams?: object) => {
  if (!navigation) return;

  const state = navigation.getState?.();
  const routes = state?.routes || [];
  const currentIndex = typeof state?.index === 'number' ? state.index : routes.length - 1;

  if (currentIndex > 0) {
    const prevRoute = routes[currentIndex - 1];
    // If the immediately preceding screen is a transient Success/Congratulatory screen,
    // skip it so the user never returns to "Your job is now live!" or "You're hired!"
    if (prevRoute?.name === 'Success') {
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

  // If we cannot go back in the current stack, navigate safely to the fallback route
  if (navigation.canGoBack?.()) {
    navigation.goBack();
  } else if (typeof navigation.navigate === 'function') {
    navigation.navigate(fallbackRoute, fallbackParams);
  }
};
