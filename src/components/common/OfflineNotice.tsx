import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onlineManager } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { fonts } from '../../theme';
import { BASE_URL } from '../../api/client';

export const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const [isReconnectedNotice, setIsReconnectedNotice] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const insets = useSafeAreaInsets();

  const slideAnim = useRef(new Animated.Value(-100)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const wasOfflineRef = useRef(false);

  // Manual & automatic connection check
  const checkConnection = useCallback(async () => {
    if (isChecking) return;
    setIsChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${BASE_URL}/health`, {
        method: 'GET',
        signal: controller.signal as any,
        cache: 'no-store',
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        onlineManager.setOnline(true);
        setIsOnline(true);
        try {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          // Ignore haptic errors on unsupported platforms
        }
      }
    } catch {
      // Still offline
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {
        // Ignore haptic errors
      }
    } finally {
      setIsChecking(false);
    }
  }, [isChecking]);

  // Subscribe to TanStack Query onlineManager and window events
  useEffect(() => {
    setIsOnline(onlineManager.isOnline());

    const unsubscribe = onlineManager.subscribe((online) => {
      setIsOnline(online);
    });

    let removeWebListeners: (() => void) | undefined;
    if (typeof window !== 'undefined' && window.addEventListener) {
      const onOnline = () => {
        onlineManager.setOnline(true);
        setIsOnline(true);
      };
      const onOffline = () => {
        onlineManager.setOnline(false);
        setIsOnline(false);
      };
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      removeWebListeners = () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }

    return () => {
      unsubscribe();
      if (removeWebListeners) removeWebListeners();
    };
  }, []);

  // Periodic health ping while offline
  useEffect(() => {
    if (isOnline) return;

    const interval = setInterval(() => {
      checkConnection();
    }, 6000);

    return () => clearInterval(interval);
  }, [isOnline, checkConnection]);

  // Pulse animation for the offline indicator
  useEffect(() => {
    if (!isOnline) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.4,
            duration: 900,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            useNativeDriver: true,
          }),
        ]),
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOnline, pulseAnim]);

  // Handle visibility and transition animations
  useEffect(() => {
    if (!isOnline) {
      wasOfflineRef.current = true;
      setIsReconnectedNotice(false);

      // Slide and fade in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (wasOfflineRef.current) {
      // Just reconnected: show "Back Online" briefly, then slide away
      setIsReconnectedNotice(true);
      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(slideAnim, {
            toValue: -100,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setIsReconnectedNotice(false);
          wasOfflineRef.current = false;
        });
      }, 1500);

      return () => clearTimeout(timer);
    } else {
      // Initially online - keep hidden
      slideAnim.setValue(-100);
      opacityAnim.setValue(0);
    }
  }, [isOnline, slideAnim, opacityAnim]);

  // If online and not in the brief reconnected state, don't take up any layout
  if (isOnline && !isReconnectedNotice) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + (Platform.OS === 'ios' ? 6 : 10),
          opacity: opacityAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
      pointerEvents={isOnline && !isReconnectedNotice ? 'none' : 'box-none'}
      testID="sikap-offline-banner"
    >
      <View
        style={[styles.banner, isReconnectedNotice ? styles.bannerConnected : styles.bannerOffline]}
      >
        {/* Left Status Icon */}
        <View
          style={[
            styles.iconContainer,
            isReconnectedNotice ? styles.iconConnected : styles.iconOffline,
          ]}
        >
          {isReconnectedNotice ? (
            <Ionicons name="checkmark-circle" size={18} color="#10B981" />
          ) : (
            <Ionicons name="cloud-offline" size={17} color="#F59E0B" />
          )}
        </View>

        {/* Text Details */}
        <View style={styles.textContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.brandText}>SIKAP</Text>
            <Animated.View
              style={[
                styles.statusDot,
                isReconnectedNotice ? styles.statusDotConnected : styles.statusDotOffline,
                !isReconnectedNotice && { opacity: pulseAnim },
              ]}
            />
            <Text
              style={[
                styles.statusTitle,
                isReconnectedNotice ? styles.statusTitleConnected : styles.statusTitleOffline,
              ]}
            >
              {isReconnectedNotice ? 'BACK ONLINE' : 'OFFLINE MODE'}
            </Text>
          </View>
          <Text style={styles.messageText} numberOfLines={1}>
            {isReconnectedNotice
              ? 'Connection restored · Syncing latest data...'
              : 'Showing saved data · Changes will sync when online'}
          </Text>
        </View>

        {/* Right Action (Retry button when offline) */}
        {!isReconnectedNotice && (
          <TouchableOpacity
            style={styles.retryButton}
            onPress={checkConnection}
            activeOpacity={0.7}
            disabled={isChecking}
            testID="sikap-offline-retry-btn"
          >
            {isChecking ? (
              <ActivityIndicator size="small" color="#F59E0B" />
            ) : (
              <View style={styles.retryContent}>
                <Ionicons name="refresh-outline" size={13} color="#F59E0B" />
                <Text style={styles.retryText}>Retry</Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 99999,
    alignItems: 'center',
    paddingHorizontal: 12,
  },
  banner: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0D1B3D', // SIKAP Midnight Navy
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 9,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  bannerOffline: {
    borderColor: 'rgba(245, 158, 11, 0.3)', // Subtle amber accent
  },
  bannerConnected: {
    borderColor: 'rgba(16, 185, 129, 0.35)', // Subtle emerald accent
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
  },
  iconOffline: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  iconConnected: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 11,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  statusDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginHorizontal: 6,
  },
  statusDotOffline: {
    backgroundColor: '#F59E0B',
  },
  statusDotConnected: {
    backgroundColor: '#10B981',
  },
  statusTitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 10.5,
    letterSpacing: 0.6,
  },
  statusTitleOffline: {
    color: '#F59E0B',
  },
  statusTitleConnected: {
    color: '#10B981',
  },
  messageText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#94A3B8',
    lineHeight: 14,
  },
  retryButton: {
    paddingVertical: 5,
    paddingHorizontal: 9,
    borderRadius: 7,
    backgroundColor: 'rgba(245, 158, 11, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
    marginLeft: 8,
    minWidth: 54,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  retryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: '#F59E0B',
  },
});
