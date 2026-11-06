import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
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
const ESTIMATED_TOOLTIP_HEIGHT = 200;

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

  const totalSteps = steps.length;
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  // Compute clamped spotlight cutout rectangle (or fallback to bottom tab bar slot if target not measured)
  const cutout = useMemo(() => {
    if (isTransitioning) return null;

    if (targetRect && targetRect.width > 0 && targetRect.height > 0) {
      const left = Math.max(8, targetRect.x - SPOTLIGHT_PADDING);
      const top = Math.max(insets.top + 4, targetRect.y - SPOTLIGHT_PADDING);
      const right = Math.min(windowWidth - 8, targetRect.x + targetRect.width + SPOTLIGHT_PADDING);
      const bottom = Math.min(
        windowHeight - 8,
        targetRect.y + targetRect.height + SPOTLIGHT_PADDING,
      );
      const width = Math.max(0, right - left);
      const height = Math.max(0, bottom - top);

      // Avoid full-screen cutout if a container spans nearly the entire screen height
      const maxSpotHeight = Math.min(height, windowHeight * 0.42);
      if (width > 20 && maxSpotHeight > 20) {
        return {
          left,
          top,
          width,
          height: maxSpotHeight,
          right,
          bottom: top + maxSpotHeight,
          centerX: left + width / 2,
        };
      }
    }

    return null;
  }, [isTransitioning, targetRect, insets.top, windowWidth, windowHeight]);

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

    const gap = 14;
    const spaceBelow = windowHeight - safeBottom - cutout.bottom - gap;
    const spaceAbove = cutout.top - safeTop - gap;

    const placeBelow = spaceBelow >= cardHeight || spaceBelow >= spaceAbove;
    let rawTop = placeBelow ? cutout.bottom + gap : cutout.top - gap - cardHeight;

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
        {/* 4-Rectangle Dimmed Backdrop Cutout */}
        {cutout ? (
          <>
            {/* Top mask */}
            <View
              pointerEvents="auto"
              style={[
                styles.backdropMask,
                { top: 0, left: 0, right: 0, height: Math.max(0, cutout.top) },
              ]}
            />
            {/* Bottom mask */}
            <View
              pointerEvents="auto"
              style={[
                styles.backdropMask,
                {
                  top: cutout.bottom,
                  left: 0,
                  right: 0,
                  bottom: 0,
                },
              ]}
            />
            {/* Left mask */}
            <View
              pointerEvents="auto"
              style={[
                styles.backdropMask,
                {
                  top: cutout.top,
                  left: 0,
                  width: Math.max(0, cutout.left),
                  height: cutout.height,
                },
              ]}
            />
            {/* Right mask */}
            <View
              pointerEvents="auto"
              style={[
                styles.backdropMask,
                {
                  top: cutout.top,
                  left: cutout.right,
                  right: 0,
                  height: cutout.height,
                },
              ]}
            />
            {/* Spotlight Highlight Ring */}
            <View
              pointerEvents="none"
              testID="tutorial-spotlight-ring"
              style={[
                styles.spotlightRing,
                {
                  top: cutout.top - 2,
                  left: cutout.left - 2,
                  width: cutout.width + 4,
                  height: cutout.height + 4,
                },
              ]}
            />
            {/* Block direct touches inside the cutout during walkthrough so user uses Next/Prev/Skip */}
            <View
              pointerEvents="auto"
              style={{
                position: 'absolute',
                top: cutout.top,
                left: cutout.left,
                width: cutout.width,
                height: cutout.height,
              }}
            />
          </>
        ) : (
          <View pointerEvents="auto" style={[StyleSheet.absoluteFill, styles.backdropMask]} />
        )}

        {/* Tooltip Card */}
        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            if (h > 40 && Math.abs(h - measuredTooltipHeight) > 4) {
              setMeasuredTooltipHeight(h);
            }
          }}
          style={[
            styles.tooltipWrapper,
            {
              top: tooltipLayout.top,
              width: cardWidth,
              left: (windowWidth - cardWidth) / 2,
            },
          ]}
        >
          {/* Top Pointer Caret (when tooltip is below target) */}
          {cutout && tooltipLayout.placement === 'below' && (
            <View style={[styles.arrowUp, { left: tooltipLayout.arrowLeft }]} />
          )}

          <View style={styles.card}>
            {/* Header Row: Icon + Step Counter Pill + Skip */}
            <View style={styles.cardHeader}>
              <View style={styles.headerLeft}>
                <View style={styles.iconCircle}>
                  {isTransitioning ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Ionicons
                      name={(currentStep.icon as any) || 'sparkles-outline'}
                      size={18}
                      color={colors.primary}
                    />
                  )}
                </View>
                <View style={styles.stepPill}>
                  <Text style={styles.stepPillText} testID="tutorial-step-counter">
                    {t('tutorial_step_of', {
                      current: currentStepIndex + 1,
                      total: totalSteps,
                    })}
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                onPress={skipTutorial}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={styles.skipBtn}
                testID="tutorial-skip-btn"
              >
                <Text style={styles.skipBtnText}>{t('tutorial_skip')}</Text>
              </TouchableOpacity>
            </View>

            {/* Step Title & Concise Explanation */}
            <Text style={styles.title} testID="tutorial-step-title">
              {t(currentStep.titleKey)}
            </Text>
            <Text style={styles.description} testID="tutorial-step-desc">
              {t(currentStep.descKey)}
            </Text>

            {/* Footer Controls: Progress Dots + Previous / Next */}
            <View style={styles.footer}>
              <View style={styles.dotsRow}>
                {steps.map((s, idx) => {
                  const active = idx === currentStepIndex;
                  return (
                    <View
                      key={s.id}
                      style={[styles.dot, active ? styles.dotActive : styles.dotInactive]}
                    />
                  );
                })}
              </View>

              <View style={styles.navBtnsRow}>
                {!isFirstStep && (
                  <TouchableOpacity
                    onPress={prevStep}
                    activeOpacity={0.75}
                    style={styles.prevBtn}
                    testID="tutorial-prev-btn"
                  >
                    <Ionicons name="chevron-back" size={15} color={colors.ink} />
                    <Text style={styles.prevBtnText}>{t('tutorial_prev')}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={nextStep}
                  activeOpacity={0.85}
                  style={styles.nextBtn}
                  testID="tutorial-next-btn"
                >
                  <Text style={styles.nextBtnText}>
                    {isLastStep ? t('tutorial_done') : t('tutorial_next')}
                  </Text>
                  <Ionicons
                    name={isLastStep ? 'checkmark-circle-outline' : 'chevron-forward'}
                    size={16}
                    color={colors.white}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Bottom Pointer Caret (when tooltip is above target) */}
          {cutout && tooltipLayout.placement === 'above' && (
            <View style={[styles.arrowDown, { left: tooltipLayout.arrowLeft }]} />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdropMask: {
    position: 'absolute',
    backgroundColor: 'rgba(6, 12, 27, 0.72)',
  },
  spotlightRing: {
    position: 'absolute',
    borderRadius: SPOTLIGHT_RADIUS,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  tooltipWrapper: {
    position: 'absolute',
    zIndex: 20,
  },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.base,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepPill: {
    backgroundColor: colors.paper,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  stepPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  skipBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 6,
  },
  description: {
    fontFamily: fonts.body,
    fontSize: 13.5,
    lineHeight: 19,
    color: colors.inkSoft,
    marginBottom: 16,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
  dotInactive: {
    width: 6,
    backgroundColor: colors.inkFaint,
  },
  navBtnsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  prevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  prevBtnText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.ink,
  },
  nextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: colors.primary,
  },
  nextBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  arrowUp: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.paperBright,
    marginBottom: -1,
    zIndex: 2,
  },
  arrowDown: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderTopWidth: 9,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.paperBright,
    marginTop: -1,
    zIndex: 2,
  },
});

export default TutorialSpotlightModal;
