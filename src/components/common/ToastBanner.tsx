import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import { triggerHaptic } from '../../utils/haptics';

export type ToastType = 'success' | 'info' | 'warning' | 'error';

export interface ToastConfig {
  id?: string;
  type?: ToastType;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}

interface ToastBannerProps {
  toast: ToastConfig | null;
  onDismiss: () => void;
}

export const ToastBanner: React.FC<ToastBannerProps> = ({ toast, onDismiss }) => {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      // Haptic feedback on presentation
      if (toast.type === 'success') {
        triggerHaptic('success');
      } else if (toast.type === 'error') {
        triggerHaptic('error');
      } else if (toast.type === 'warning') {
        triggerHaptic('warning');
      } else {
        triggerHaptic('light');
      }

      // Animate In
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      const duration = toast.duration || 3200;
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -80,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!toast) return null;

  const type = toast.type || 'info';

  const typeConfig = {
    success: {
      icon: 'checkmark-circle' as const,
      color: '#10B981',
      bgColor: '#DCFCE7',
      borderColor: 'rgba(16, 185, 129, 0.3)',
    },
    info: {
      icon: 'information-circle' as const,
      color: colors.primary,
      bgColor: colors.primaryTint,
      borderColor: 'rgba(232, 116, 74, 0.3)',
    },
    warning: {
      icon: 'warning' as const,
      color: '#F59E0B',
      bgColor: '#FEF3C7',
      borderColor: 'rgba(245, 158, 11, 0.3)',
    },
    error: {
      icon: 'alert-circle' as const,
      color: colors.error,
      bgColor: '#FEE2E2',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
  }[type];

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          top: insets.top + (Platform.OS === 'ios' ? 8 : 12),
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents="box-none"
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={handleDismiss}
        style={[styles.container, { borderColor: typeConfig.borderColor }]}
      >
        <View style={[styles.iconBox, { backgroundColor: typeConfig.bgColor }]}>
          <Ionicons name={typeConfig.icon} size={18} color={typeConfig.color} />
        </View>

        <Text style={styles.messageText} numberOfLines={2}>
          {toast.message}
        </Text>

        {toast.actionLabel && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => {
              triggerHaptic('light');
              toast.onAction?.();
              handleDismiss();
            }}
          >
            <Text style={styles.actionText}>{toast.actionLabel}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.closeBtn} onPress={handleDismiss}>
          <Ionicons name="close" size={16} color={colors.inkMuted} />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 999999,
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxWidth: 440,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1.2,
    ...shadows.base,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  messageText: {
    flex: 1,
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  actionBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.primaryTint,
    marginLeft: 8,
  },
  actionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
  closeBtn: {
    padding: 4,
    marginLeft: 4,
  },
});

export default ToastBanner;
