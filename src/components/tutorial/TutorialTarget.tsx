import React, { useCallback, useEffect, useRef } from 'react';
import { LayoutChangeEvent, StyleProp, View, ViewStyle } from 'react-native';
import type { TargetRect } from '../../contexts/OnboardingTutorialContext';
import { useOnboardingTutorial } from '../../contexts/OnboardingTutorialContext';

interface TutorialTargetProps {
  id: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

/**
 * Wraps a target UI region so the OnboardingTutorial spotlight can measure its
 * exact window coordinates (`measureInWindow`) across different screen sizes.
 */
export const TutorialTarget: React.FC<TutorialTargetProps> = ({ id, children, style }) => {
  const viewRef = useRef<View | null>(null);
  const { isActive, currentStep, registerTarget, unregisterTarget, refreshCurrentTarget } =
    useOnboardingTutorial();

  const measure = useCallback((): Promise<TargetRect | null> => {
    return new Promise((resolve) => {
      const node = viewRef.current;
      if (!node || typeof node.measureInWindow !== 'function') {
        resolve(null);
        return;
      }
      try {
        node.measureInWindow((x, y, width, height) => {
          if (
            typeof width === 'number' &&
            typeof height === 'number' &&
            width > 0 &&
            height > 0 &&
            !Number.isNaN(x) &&
            !Number.isNaN(y)
          ) {
            resolve({ x, y, width, height });
          } else {
            resolve(null);
          }
        });
      } catch {
        resolve(null);
      }
    });
  }, []);

  useEffect(() => {
    registerTarget(id, measure);
    return () => {
      unregisterTarget(id);
    };
  }, [id, measure, registerTarget, unregisterTarget]);

  const handleLayout = useCallback(
    (_e: LayoutChangeEvent) => {
      if (isActive && currentStep?.targetIds.includes(id)) {
        refreshCurrentTarget();
      }
    },
    [isActive, currentStep, id, refreshCurrentTarget],
  );

  return (
    <View ref={viewRef} collapsable={false} onLayout={handleLayout} style={style}>
      {children}
    </View>
  );
};

export default TutorialTarget;
