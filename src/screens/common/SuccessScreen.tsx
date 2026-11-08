import React, { useEffect, useRef, useState, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import SuccessView, { SuccessAction, SuccessDetailItem } from '../../components/common/SuccessView';
import { triggerHaptic } from '../../utils/haptics';

export interface SuccessParams {
  variant?: 'confirm' | 'milestone';
  title: string;
  message: string;
  detail?: SuccessDetailItem[];
  primaryAction: SuccessAction;
  secondaryAction?: SuccessAction;
}

export const SuccessScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const isNavigating = useRef(false);
  const [navigatingState, setNavigatingState] = useState(false);

  const params: SuccessParams = route?.params || {
    variant: 'confirm',
    title: 'Success',
    message: 'Operation completed successfully.',
    primaryAction: { label: 'Continue', goBack: true },
  };

  const { variant = 'confirm', title, message, detail, primaryAction, secondaryAction } = params;

  // Trigger success haptic on screen mount
  useEffect(() => {
    triggerHaptic('success');
  }, []);

  const handleAction = useCallback(
    (action: SuccessAction) => {
      if (isNavigating.current) return;
      isNavigating.current = true;
      setNavigatingState(true);

      // Brief lock to prevent double navigation
      setTimeout(() => {
        isNavigating.current = false;
        setNavigatingState(false);
      }, 750);

      if ('goBack' in action && action.goBack) {
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Home');
        }
      } else if ('popToTop' in action && action.popToTop) {
        navigation.popToTop();
      } else if ('navigateTo' in action && action.navigateTo) {
        const state = navigation.getState?.();
        const routes = state?.routes || [];
        const targetName = action.navigateTo.name;
        const targetParams = action.navigateTo.params;

        // 1. If target screen is already in our backstack, pop back to it directly
        const targetIndex = routes.findIndex((r: any) => r.name === targetName);
        if (
          targetIndex >= 0 &&
          targetIndex < routes.length - 1 &&
          typeof navigation.pop === 'function'
        ) {
          const popCount = routes.length - 1 - targetIndex;
          navigation.pop(popCount);
          return;
        }

        // 2. Otherwise REPLACE the Success screen with the target screen
        // so Success never lingers in the backstack!
        if (typeof navigation.replace === 'function') {
          navigation.replace(targetName, targetParams);
        } else {
          navigation.navigate(targetName, targetParams);
        }
      }
    },
    [navigation],
  );

  // Hardware back button behavior on Android:
  // If secondaryAction is a dismiss/deferral option (e.g. "Later", "Skip", "Not now"), execute it.
  // Otherwise default to primaryAction (safe exit to target/list) so user is never trapped or forced into secondary workflows like "Post another job".
  useEffect(() => {
    const onBackPress = () => {
      const isDismissiveSecondary =
        secondaryAction && /later|skip|not now|dismiss|cancel/i.test(secondaryAction.label || '');

      if (isDismissiveSecondary) {
        handleAction(secondaryAction);
      } else {
        handleAction(primaryAction);
      }
      return true; // Consume event
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => backSubscription.remove();
  }, [secondaryAction, primaryAction, handleAction]);

  const handleClose = useCallback(() => {
    const isDismissiveSecondary =
      secondaryAction && /later|skip|not now|dismiss|cancel/i.test(secondaryAction.label || '');

    if (isDismissiveSecondary) {
      handleAction(secondaryAction);
    } else {
      handleAction(primaryAction);
    }
  }, [secondaryAction, primaryAction, handleAction]);

  return (
    <SuccessView
      variant={variant}
      title={title}
      message={message}
      detail={detail}
      primaryAction={primaryAction}
      secondaryAction={secondaryAction}
      onPrimaryPress={() => handleAction(primaryAction)}
      onSecondaryPress={secondaryAction ? () => handleAction(secondaryAction) : undefined}
      onClosePress={handleClose}
      isNavigating={navigatingState}
    />
  );
};

export default SuccessScreen;
