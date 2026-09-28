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
        navigation.navigate(action.navigateTo.name, action.navigateTo.params);
      }
    },
    [navigation],
  );

  // Hardware back button behavior on Android:
  // Must execute secondaryAction if available, otherwise primaryAction or safe back.
  useEffect(() => {
    const onBackPress = () => {
      if (secondaryAction) {
        handleAction(secondaryAction);
      } else {
        handleAction(primaryAction);
      }
      return true; // Consume event
    };

    const backSubscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => backSubscription.remove();
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
      isNavigating={navigatingState}
    />
  );
};

export default SuccessScreen;
