import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../theme';

interface SkeletonProps {
  width?: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const JobCardSkeleton: React.FC = () => (
  <Animated.View style={styles.cardSkeleton}>
    <Skeleton width="40%" height={14} borderRadius={4} style={{ marginBottom: 12 }} />
    <Skeleton width="85%" height={22} borderRadius={6} style={{ marginBottom: 16 }} />
    <Skeleton width="60%" height={14} borderRadius={4} style={{ marginBottom: 20 }} />
    <Animated.View style={styles.cardFooterSkeleton}>
      <Skeleton width={100} height={28} borderRadius={14} />
      <Skeleton width={70} height={28} borderRadius={14} />
    </Animated.View>
  </Animated.View>
);

export const DashboardSkeleton: React.FC = () => (
  <Animated.View style={{ paddingHorizontal: 20, gap: 16, marginTop: 20 }}>
    {/* Header Skeleton */}
    <Animated.View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Skeleton width={140} height={28} borderRadius={8} />
      <Skeleton width={40} height={40} borderRadius={20} />
    </Animated.View>

    {/* Stat Card Skeleton */}
    <Animated.View style={{ flexDirection: 'row', gap: 12, marginTop: 10 }}>
      <Skeleton width="48%" height={90} borderRadius={16} />
      <Skeleton width="48%" height={90} borderRadius={16} />
    </Animated.View>

    {/* Main Action Skeleton */}
    <Skeleton width="100%" height={52} borderRadius={26} style={{ marginTop: 12 }} />

    {/* Section Skeleton */}
    <Skeleton width={120} height={18} borderRadius={6} style={{ marginTop: 20 }} />
    <JobCardSkeleton />
    <JobCardSkeleton />
  </Animated.View>
);

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: colors.inkFaint || '#E5E7EB',
  },
  cardSkeleton: {
    backgroundColor: colors.paperBright || '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardFooterSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
});

export default Skeleton;
