import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  AccessibilityInfo,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';
import Button from './Button';

export type SuccessAction =
  | { label: string; goBack: true; onPress?: () => void }
  | { label: string; navigateTo: { name: string; params?: object }; onPress?: () => void }
  | { label: string; popToTop: true; onPress?: () => void }
  | { label: string; onPress: () => void };

export interface SuccessDetailItem {
  label: string;
  value: string;
}

export interface SuccessViewProps {
  variant?: 'confirm' | 'milestone';
  title: string;
  message: string;
  detail?: SuccessDetailItem[];
  primaryAction: SuccessAction;
  secondaryAction?: SuccessAction;
  onPrimaryPress?: () => void;
  onSecondaryPress?: () => void;
  isNavigating?: boolean;
}

export const SuccessView: React.FC<SuccessViewProps> = ({
  variant = 'confirm',
  title,
  message,
  detail,
  primaryAction,
  secondaryAction,
  onPrimaryPress,
  onSecondaryPress,
  isNavigating = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Accessibility announcement for screen readers
    try {
      if (typeof AccessibilityInfo?.announceForAccessibility === 'function') {
        AccessibilityInfo.announceForAccessibility(`${title}. ${message}`);
      }
    } catch (_) {}

    if (process.env.NODE_ENV === 'test') {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
      return;
    }

    // Check system reduced motion preferences
    let isMounted = true;
    try {
      if (typeof AccessibilityInfo?.isReduceMotionEnabled === 'function') {
        const res = AccessibilityInfo.isReduceMotionEnabled();
        if (res && typeof res.then === 'function') {
          res
            .then((enabled) => {
              if (!isMounted) return;
              setReduceMotion(Boolean(enabled));
              if (enabled) {
                scaleAnim.setValue(1);
                opacityAnim.setValue(1);
              } else {
                Animated.parallel([
                  Animated.spring(scaleAnim, {
                    toValue: 1,
                    friction: 6,
                    tension: 50,
                    useNativeDriver: true,
                  }),
                  Animated.timing(opacityAnim, {
                    toValue: 1,
                    duration: 350,
                    useNativeDriver: true,
                  }),
                ]).start();
              }
            })
            .catch(() => {
              if (!isMounted) return;
              scaleAnim.setValue(1);
              opacityAnim.setValue(1);
            });
        } else {
          scaleAnim.setValue(1);
          opacityAnim.setValue(1);
        }
      } else {
        scaleAnim.setValue(1);
        opacityAnim.setValue(1);
      }
    } catch (_) {
      scaleAnim.setValue(1);
      opacityAnim.setValue(1);
    }

    return () => {
      isMounted = false;
    };
  }, [title, message, scaleAnim, opacityAnim]);

  const isMilestone = variant === 'milestone';
  const badgeBg = isMilestone ? '#FEF9C3' : '#DCFCE7';
  const badgeBorder = isMilestone ? '#FDE047' : '#86EFAC';
  const iconColor = isMilestone ? colors.gold : colors.success;
  const iconName = isMilestone ? 'star' : 'checkmark-circle';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Animated Hero Icon Badge */}
          <Animated.View
            testID="success-icon-badge"
            style={[
              styles.iconWrapper,
              {
                backgroundColor: badgeBg,
                borderColor: badgeBorder,
                transform: [{ scale: reduceMotion ? 1 : scaleAnim }],
                opacity: reduceMotion ? 1 : opacityAnim,
              },
            ]}
            accessible={true}
            accessibilityRole="image"
            accessibilityLabel={isMilestone ? 'Celebration Star Icon' : 'Success Checkmark Icon'}
          >
            <Ionicons name={iconName} size={48} color={iconColor} />
          </Animated.View>

          {isMilestone && (
            <View style={styles.milestonePill} testID="milestone-badge">
              <Ionicons name="sparkles" size={14} color="#854D0E" style={{ marginRight: 4 }} />
              <Text style={styles.milestonePillText}>MILESTONE UNLOCKED</Text>
            </View>
          )}

          {/* Title */}
          <Text style={styles.title} accessibilityRole="header" accessibilityLabel={title}>
            {title}
          </Text>

          {/* Subtitle / Message */}
          <Text style={styles.message}>{message}</Text>

          {/* Optional Summary Card */}
          {detail && detail.length > 0 && (
            <View style={styles.detailCard} testID="success-detail-card">
              {detail.map((item, index) => (
                <View
                  key={index}
                  style={[styles.detailRow, index < detail.length - 1 && styles.detailRowBorder]}
                >
                  <Text style={styles.detailLabel}>{item.label}</Text>
                  <Text style={styles.detailValue} numberOfLines={2}>
                    {item.value}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        {/* Footer Actions */}
        <View style={styles.footer}>
          <Button
            label={primaryAction.label}
            variant="primary"
            size="lg"
            fullWidth
            onPress={onPrimaryPress || primaryAction.onPress}
            disabled={isNavigating}
            accessibilityLabel={primaryAction.label}
            style={styles.primaryButton}
          />

          {secondaryAction && (onSecondaryPress || secondaryAction.onPress) && (
            <Button
              label={secondaryAction.label}
              variant="outline"
              size="base"
              fullWidth
              onPress={onSecondaryPress || secondaryAction.onPress}
              disabled={isNavigating}
              accessibilityLabel={secondaryAction.label}
              style={styles.secondaryButton}
            />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  milestonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF9C3',
    borderColor: '#FDE047',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 16,
  },
  milestonePillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#854D0E',
    letterSpacing: 0.5,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
    marginBottom: 24,
  },
  detailCard: {
    width: '100%',
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginTop: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 6,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.inkFaint,
  },
  detailLabel: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkMuted,
  },
  detailValue: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'right',
    flexShrink: 1,
    marginLeft: 16,
  },
  footer: {
    paddingVertical: 16,
    gap: 12,
  },
  primaryButton: {
    marginBottom: 2,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(15, 23, 42, 0.15)',
  },
});

export default SuccessView;
