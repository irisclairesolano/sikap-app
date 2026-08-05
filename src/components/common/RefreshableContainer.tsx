import React, { useState, useRef, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Animated } from 'react-native';
import { colors } from '../../theme';

interface RefreshableContainerProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  showsVerticalScrollIndicator?: boolean;
  contentContainerStyle?: any;
}

export const RefreshableContainer: React.FC<RefreshableContainerProps> = ({
  children,
  onRefresh,
  showsVerticalScrollIndicator = false,
  contentContainerStyle,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const contentAnim = useRef(new Animated.Value(1)).current;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);

    // Subtle tactile scale dip on refresh start
    Animated.timing(contentAnim, {
      toValue: 0.98,
      duration: 150,
      useNativeDriver: true,
    }).start();

    try {
      await onRefresh();
    } catch (e) {
      console.log('Refresh error:', e);
    } finally {
      setRefreshing(false);

      // Smooth spring snap back when refreshed
      Animated.spring(contentAnim, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }).start();
    }
  }, [onRefresh, contentAnim]);

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={contentContainerStyle}
        showsVerticalScrollIndicator={showsVerticalScrollIndicator}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
        <Animated.View style={{ flex: 1, transform: [{ scale: contentAnim }] }}>
          {children}
        </Animated.View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default RefreshableContainer;
