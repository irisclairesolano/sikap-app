import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useOnboardingTutorial } from '../../contexts/OnboardingTutorialContext';
import { colors, fonts, shadows } from '../../theme';

const SPOTLIGHT_PADDING = 8;
const SPOTLIGHT_RADIUS = 16;
const MIN_SCREEN_MARGIN = 16;
const ESTIMATED_TOOLTIP_HEIGHT = 140;
const BACKDROP_OVERLAY_COLOR = 'rgba(15, 23, 42, 0.6)';
const MASK_BORDER_WIDTH = 2500;

interface CutoutRect {
  left: number;
  top: number;
  width: number;
  height: number;
  right: number;
  bottom: number;
  centerX: number;
}

export const TutorialSpotlightModal: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const {
    isActive,
    isTransitioning,
    currentStepIndex,
    steps,
    currentStep,
    targetRect,
    nextStep,
    prevStep,
    skipTutorial,
  } = useOnboardingTutorial();

  const [measuredTooltipHeight, setMeasuredTooltipHeight] = useState(ESTIMATED_TOOLTIP_HEIGHT);
  const hasInitializedRef = useRef(false);
  const prevStepIndexRef = useRef<number>(currentStepIndex);

  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Reset initialization tracking when tutorial closes
  useEffect(() => {
    if (!isActive) {
      hasInitializedRef.current = false;
    }
  }, [isActive]);

  // Compute clamped spotlight cutout rectangle
  const cutout = useMemo<CutoutRect | null>(() => {
    if (targetRect && targetRect.width > 0 && targetRect.height > 0) {
      const left = Math.max(8, targetRect.x - SPOTLIGHT_PADDING);
      const right = Math.min(windowWidth - 8, targetRect.x + targetRect.width + SPOTLIGHT_PADDING);
      const width = Math.max(0, right - left);

      const safeTopBound = Math.max(insets.top, 8);
      const safeBottomBound = Math.max(insets.bottom, 8);
      const top = Math.max(safeTopBound, targetRect.y - SPOTLIGHT_PADDING);
      const bottom = Math.min(
        windowHeight - safeBottomBound,
        targetRect.y + targetRect.height + SPOTLIGHT_PADDING,
      );
      const rawHeight = Math.max(0, bottom - top);

      // Safe maximum height so spotlight never overflows the visible screen viewport
      const maxAllowedHeight = Math.max(80, windowHeight - insets.top - insets.bottom - 150);
      const height = Math.min(rawHeight, maxAllowedHeight);

      if (width > 20 && height > 20) {
        return {
          left,
          top,
          width,
          height,
          right: left + width,
          bottom: top + height,
          centerX: left + width / 2,
        };
      }
    }

    return null;
  }, [targetRect, insets.top, insets.bottom, windowWidth, windowHeight]);

  // Compute adaptive tooltip position (above vs below spotlight, or centered if no cutout)
  const tooltipLayout = useMemo(() => {
    const safeTop = Math.max(insets.top + 12, 24);
    const safeBottom = Math.max(insets.bottom + 16, 24);
    const cardHeight = measuredTooltipHeight || ESTIMATED_TOOLTIP_HEIGHT;

    if (!cutout) {
      const centeredTop = Math.max(
        safeTop,
        Math.min((windowHeight - cardHeight) / 2, windowHeight - safeBottom - cardHeight),
      );
      return {
        top: centeredTop,
        placement: 'center' as const,
        arrowLeft: windowWidth / 2 - MIN_SCREEN_MARGIN - 8,
      };
    }

    const gap = 12;
    const spaceBelow = windowHeight - safeBottom - cutout.bottom - gap;
    const spaceAbove = cutout.top - safeTop - gap;

    const placeBelow = spaceBelow >= cardHeight || spaceBelow >= spaceAbove;
    const rawTop = placeBelow ? cutout.bottom + gap : cutout.top - gap - cardHeight;

    // Strictly clamp within safe screen bounds for small screens
    const minTop = safeTop;
    const maxTop = Math.max(safeTop, windowHeight - safeBottom - cardHeight);
    const clampedTop = Math.max(minTop, Math.min(rawTop, maxTop));

    const cardWidth = Math.min(windowWidth - MIN_SCREEN_MARGIN * 2, 380);
    const cardLeft = (windowWidth - cardWidth) / 2;
    const arrowLeft = Math.max(20, Math.min(cutout.centerX - cardLeft - 8, cardWidth - 36));

    return {
      top: clampedTop,
      placement: placeBelow ? ('below' as const) : ('above' as const),
      arrowLeft,
    };
  }, [cutout, insets.top, insets.bottom, measuredTooltipHeight, windowHeight, windowWidth]);

  // Animated values for smooth gliding spotlight cutout, boundary, tooltip, and pointer caret
  const animLeft = useRef(new Animated.Value(cutout?.left ?? windowWidth / 2)).current;
  const animTop = useRef(new Animated.Value(cutout?.top ?? windowHeight / 2)).current;
  const animWidth = useRef(new Animated.Value(cutout?.width ?? 0)).current;
  const animHeight = useRef(new Animated.Value(cutout?.height ?? 0)).current;
  const animOpacity = useRef(new Animated.Value(cutout ? 1 : 0)).current;
  const animTooltipTop = useRef(new Animated.Value(tooltipLayout.top)).current;
  const animArrowLeft = useRef(new Animated.Value(tooltipLayout.arrowLeft)).current;
  const animCardOpacity = useRef(new Animated.Value(1)).current;
  const animCardTranslateY = useRef(new Animated.Value(0)).current;

  // Smoothly crossfade/slide card content when changing steps
  useEffect(() => {
    if (!isActive) return;
    if (prevStepIndexRef.current !== currentStepIndex) {
      const dir = currentStepIndex > prevStepIndexRef.current ? 1 : -1;
      prevStepIndexRef.current = currentStepIndex;
      animCardOpacity.setValue(0.68);
      animCardTranslateY.setValue(dir * 6);
      Animated.parallel([
        Animated.timing(animCardOpacity, {
          toValue: 1,
          duration: 190,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(animCardTranslateY, {
          toValue: 0,
          duration: 210,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isActive, currentStepIndex, animCardOpacity, animCardTranslateY]);

  // Smooth animate cutout bounds, tooltip position, and caret position in lockstep
  useEffect(() => {
    if (!cutout) {
      Animated.parallel([
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 160,
          useNativeDriver: false,
        }),
        Animated.spring(animTooltipTop, {
          toValue: tooltipLayout.top,
          friction: 9,
          tension: 70,
          useNativeDriver: false,
        }),
      ]).start();
      return;
    }

    if (!hasInitializedRef.current) {
      hasInitializedRef.current = true;
      animLeft.setValue(cutout.left);
      animTop.setValue(cutout.top);
      animWidth.setValue(cutout.width);
      animHeight.setValue(cutout.height);
      animTooltipTop.setValue(tooltipLayout.top);
      animArrowLeft.setValue(tooltipLayout.arrowLeft);
      animOpacity.setValue(0);
      Animated.timing(animOpacity, {
        toValue: 1,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      return;
    }

    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: isTransitioning ? 0.85 : 1,
        duration: 160,
        useNativeDriver: false,
      }),
      Animated.spring(animLeft, {
        toValue: cutout.left,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(animTop, {
        toValue: cutout.top,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(animWidth, {
        toValue: cutout.width,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(animHeight, {
        toValue: cutout.height,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(animTooltipTop, {
        toValue: tooltipLayout.top,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
      Animated.spring(animArrowLeft, {
        toValue: tooltipLayout.arrowLeft,
        friction: 9,
        tension: 70,
        useNativeDriver: false,
      }),
    ]).start();
  }, [
    cutout,
    isTransitioning,
    tooltipLayout.top,
    tooltipLayout.arrowLeft,
    animLeft,
    animTop,
    animWidth,
    animHeight,
    animOpacity,
    animTooltipTop,
    animArrowLeft,
  ]);

  if (!isActive || !currentStep) {
    return null;
  }

  const cardWidth = Math.min(windowWidth - MIN_SCREEN_MARGIN * 2, 380);

  return (
    <Modal
      visible={isActive}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={skipTutorial}
    >
      <View style={styles.root} testID="tutorial-modal">
        {/* Seamless Inverted Cutout (Smooth Rounded Corners, No Gaps or Rough Seams) */}
        {cutout ? (
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {/* The single punch-hole mask wrapper with overflow hidden */}
            <View pointerEvents="none" style={styles.punchHoleContainer}>
              <Animated.View
                style={[
                  styles.punchHoleMask,
                  {
                    left: Animated.subtract(animLeft, MASK_BORDER_WIDTH),
                    top: Animated.subtract(animTop, MASK_BORDER_WIDTH),
                    width: Animated.add(animWidth, MASK_BORDER_WIDTH * 2),
                    height: Animated.add(animHeight, MASK_BORDER_WIDTH * 2),
                    opacity: animOpacity,
                  },
                ]}
              />
            </View>

            {/* Clean 2px Solid Spotlight Boundary (No Pseudo-Glass, No Multi-Layered Glow/Shadow) */}
            <Animated.View
              pointerEvents="none"
              testID="tutorial-spotlight-ring"
              style={[
                styles.spotlightRing,
                {
                  left: animLeft,
                  top: animTop,
                  width: animWidth,
                  height: animHeight,
                  opacity: animOpacity,
                },
              ]}
            />

            {/* Catch direct touches inside the cutout so user uses Next/Prev/Skip */}
            <TouchableOpacity
              activeOpacity={1}
              style={[
                styles.touchBlocker,
                {
                  left: cutout.left,
                  top: cutout.top,
                  width: cutout.width,
                  height: cutout.height,
                },
              ]}
            />
          </View>
        ) : (
          <View pointerEvents="auto" style={[StyleSheet.absoluteFill, styles.fallbackBackdrop]} />
        )}

        {/* Tooltip Card */}
        <Animated.View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 40 && Math.abs(h - measuredTooltipHeight) > 4) {
              setMeasuredTooltipHeight(h);
            }
          }}
          style={[
            styles.tooltipWrapper,
            {
              top: animTooltipTop,
              width: cardWidth,
              left: (windowWidth - cardWidth) / 2,
              opacity: animCardOpacity,
              transform: [{ translateY: animCardTranslateY }],
            },
          ]}
        >
          {/* Top Pointer Caret (when tooltip is below target) */}
          {cutout && tooltipLayout.placement === 'below' && (
            <Animated.View style={[styles.arrowUp, { left: animArrowLeft }]} />
          )}

          <View style={styles.card}>
            {/* Row 1: Header Row (Leading Icon + Title Inline | Close/Skip Button) */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  {isTransitioning && !cutout ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={(currentStep.icon as any) || 'sparkles-outline'}
                      size={16}
                      color={colors.primary}
                    />
                  )}
                </View>
                <Text
                  style={styles.title}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  testID="tutorial-step-title"
                >
                  {t(currentStep.titleKey)}
                </Text>
              </View>

              <TouchableOpacity
                onPress={skipTutorial}
                activeOpacity={0.7}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={styles.closeBtn}
                testID="tutorial-skip-btn"
                accessibilityLabel={t('tutorial_skip')}
                accessibilityRole="button"
              >
                <Ionicons name="close" size={18} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            {/* Row 2: Body Row (Compact description) */}
            <Text style={styles.description} testID="tutorial-step-desc">
              {t(currentStep.descKey)}
            </Text>

            {/* Row 3: Footer Row (Step counter on Left | Back link + Next button on Right) */}
            <View style={styles.footer}>
              <Text style={styles.stepIndicator} testID="tutorial-step-counter">
                {t('tutorial_step_of', {
                  current: currentStepIndex + 1,
                  total: totalSteps,
                })}
              </Text>

              <View style={styles.navControls}>
                {!isFirstStep && (
                  <TouchableOpacity
                    onPress={prevStep}
                    activeOpacity={0.65}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.prevLink}
                    testID="tutorial-prev-btn"
                    accessibilityRole="button"
                  >
                    <Ionicons name="chevron-back" size={14} color={colors.inkSoft} />
                    <Text style={styles.prevLinkText}>{t('tutorial_prev')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={nextStep}
                  activeOpacity={0.85}
                  style={styles.nextBtn}
                  testID="tutorial-next-btn"
                  accessibilityRole="button"
                >
                  <Text style={styles.nextBtnText}>
                    {isLastStep ? t('tutorial_done') : t('tutorial_next')}
                  </Text>
                  <Ionicons
                    name={isLastStep ? 'checkmark-circle-outline' : 'chevron-forward'}
                    size={14}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Pointer Caret (when tooltip is above target) */}
          {cutout && tooltipLayout.placement === 'above' && (
            <Animated.View style={[styles.arrowDown, { left: animArrowLeft }]} />
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  punchHoleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  punchHoleMask: {
    position: 'absolute',
    borderWidth: MASK_BORDER_WIDTH,
    borderColor: BACKDROP_OVERLAY_COLOR,
    borderRadius: SPOTLIGHT_RADIUS + MASK_BORDER_WIDTH,
    backgroundColor: 'transparent',
  },
  fallbackBackdrop: {
    backgroundColor: BACKDROP_OVERLAY_COLOR,
  },
  spotlightRing: {
    position: 'absolute',
    borderRadius: SPOTLIGHT_RADIUS,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  touchBlocker: {
    position: 'absolute',
  },
  tooltipWrapper: {
    position: 'absolute',
    zIndex: 20,
  },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    gap: 8,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 15,
    color: colors.ink,
    letterSpacing: -0.2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.paper,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.inkSoft,
    marginBottom: 10,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
  },
  stepIndicator: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11.5,
    color: colors.inkMuted,
    letterSpacing: 0.2,
  },
  navControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  prevLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  prevLinkText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12.5,
    color: colors.inkSoft,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 7,
    paddingHorizontal: 13,
    borderRadius: 10,
    backgroundColor: colors.primary,
  },
  nextBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12.5,
    color: colors.white,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.paperBright,
    marginBottom: -1,
    zIndex: 2,
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.paperBright,
    marginTop: -1,
    zIndex: 2,
  },
});

export default TutorialSpotlightModal;
