import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { onlineManager } from '@tanstack/react-query';
import { colors, fonts } from '../../theme';

export const OfflineNotice: React.FC = () => {
  const [isOnline, setIsOnline] = useState(onlineManager.isOnline());
  const insets = useSafeAreaInsets();
  const [slideAnim] = useState(new Animated.Value(-60));

  useEffect(() => {
    // Check initial state
    setIsOnline(onlineManager.isOnline());

    const handleStatus = () => {
      setIsOnline(onlineManager.isOnline());
    };

    let removeListeners: (() => void) | undefined;
    if (typeof window !== 'undefined' && window.addEventListener) {
      const onOnline = () => {
        onlineManager.setOnline(true);
        handleStatus();
      };
      const onOffline = () => {
        onlineManager.setOnline(false);
        handleStatus();
      };
      window.addEventListener('online', onOnline);
      window.addEventListener('offline', onOffline);
      removeListeners = () => {
        window.removeEventListener('online', onOnline);
        window.removeEventListener('offline', onOffline);
      };
    }

    return () => {
      if (removeListeners) removeListeners();
    };
  }, []);

  useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: !isOnline ? 0 : -60,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isOnline, slideAnim]);

  if (isOnline) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: insets.top + 4,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.pill}>
        <Ionicons name="cloud-offline" size={16} color="white" />
        <Text style={styles.text}>You are offline · Showing cached data</Text>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1E293BEE',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  text: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#F8FAFC',
  },
});
