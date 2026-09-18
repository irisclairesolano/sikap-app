import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts, shadows } from '../../theme';
import { useReviews } from '../../hooks/useReviews';

type ReviewsScreenNavigationProp = NativeStackNavigationProp<WorkerStackParamList, 'Reviews'>;

export const ReviewsScreen: React.FC = () => {
  const navigation = useNavigation<ReviewsScreenNavigationProp>();
  const { data, isLoading, refetch, isFetching } = useReviews(undefined, 'worker');

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const reputationScore = data?.reputation_score ?? 0;
  const reviewsCount = data?.reviews_count ?? 0;
  const reviewsList = data?.reviews || [];

  const distribution: Record<number, number> = data?.distribution
    ? {
        5: data.distribution[5] || 0,
        4: data.distribution[4] || 0,
        3: data.distribution[3] || 0,
        2: data.distribution[2] || 0,
        1: data.distribution[1] || 0,
      }
    : (() => {
        const counts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        reviewsList.forEach((r) => {
          const star = Math.min(5, Math.max(1, Math.round(Number(r.overall_rating))));
          counts[star] = (counts[star] || 0) + 1;
        });
        return counts;
      })();

  const totalReviews = reviewsCount || reviewsList.length;

  const formatScore = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '' || val === 'N/A') return 'N/A';
    const num = Number(val);
    if (isNaN(num) || num <= 0) return '0.0';
    if (num % 1 === 0) return num.toFixed(1);
    if (Number(num.toFixed(1)) === num) return num.toFixed(1);
    return Number(num.toFixed(2)).toString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>All reviews</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
        {/* Summary Card (Frosted Crystal Glass) */}
        <View style={styles.summaryWrapper}>
          <View style={styles.ambientGlowGold} pointerEvents="none" />
          <View style={styles.ambientGlowSky} pointerEvents="none" />
          <View style={styles.summaryCard}>
            <View style={styles.scoreSection}>
              <Text style={styles.scoreNumber}>{formatScore(reputationScore)}</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Ionicons
                    key={s}
                    name={s <= Math.round(reputationScore) ? 'star' : 'star-outline'}
                    size={14}
                    color={colors.gold}
                  />
                ))}
              </View>
              <Text style={styles.reviewsCount}>
                {reviewsCount} {reviewsCount === 1 ? 'review' : 'reviews'}
              </Text>
            </View>

            <View style={styles.distributionSection}>
              {[5, 4, 3, 2, 1].map((star) => {
                const count = distribution[star] || 0;
                const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                return (
                  <View key={star} style={styles.distRow}>
                    <Text style={styles.distLabel}>{star}</Text>
                    <Ionicons name="star" size={9} color={colors.gold} />
                    <View style={styles.barBackground}>
                      {pct > 0 && <View style={[styles.barFill, { width: `${pct}%` }]} />}
                    </View>
                    <Text style={styles.distCount}>{count}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviewsList.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="chatbox-outline" size={32} color={colors.inkLight} />
              <Text style={styles.emptyTitle}>No reviews yet</Text>
              <Text style={styles.emptySubtitle}>
                Ratings and reviews from completed jobs will appear here.
              </Text>
            </View>
          ) : (
            reviewsList.map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewerInfo}>
                    <View style={[styles.avatar, { backgroundColor: colors.sky }]}>
                      <Text style={styles.avatarText}>
                        {review.reviewer?.name?.charAt(0) || 'U'}
                      </Text>
                    </View>
                    <View>
                      <Text style={styles.reviewerName}>{review.reviewer?.name || 'User'}</Text>
                      <Text style={styles.reviewMeta}>
                        {review.reviewer_role === 'worker' ? 'Worker' : 'Employer'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.reviewRatingRow}>
                    <View style={styles.reviewStars}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Ionicons
                          key={s}
                          name={s <= Math.round(review.overall_rating) ? 'star' : 'star-outline'}
                          size={12}
                          color={
                            s <= Math.round(review.overall_rating) ? colors.gold : colors.inkLight
                          }
                        />
                      ))}
                    </View>
                    <Text style={styles.reviewRatingText}>
                      {formatScore(review.overall_rating)}
                    </Text>
                  </View>
                </View>
                {review.comment ? (
                  <Text style={styles.reviewComment}>"{review.comment}"</Text>
                ) : null}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  summaryWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  ambientGlowGold: {
    position: 'absolute',
    top: -15,
    left: 15,
    width: 140,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(234, 179, 8, 0.16)',
  },
  ambientGlowSky: {
    position: 'absolute',
    bottom: -15,
    right: 15,
    width: 150,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(56, 189, 248, 0.16)',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  scoreSection: { alignItems: 'center', minWidth: 90 },
  scoreNumber: { fontFamily: fonts.display, fontSize: 44, color: '#0F172A', lineHeight: 48 },
  starsRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  reviewsCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 6,
  },
  distributionSection: { flex: 1, gap: 5 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft, width: 8 },
  barBackground: {
    flex: 1,
    height: 6,
    backgroundColor: 'rgba(15, 23, 42, 0.06)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 3 },
  distCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkSoft,
    width: 14,
    textAlign: 'right',
  },
  reviewsList: { marginTop: 16, gap: 12 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginTop: 10,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
  },
  reviewCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.65)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  reviewerName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  reviewMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  reviewRatingRow: { alignItems: 'flex-end', gap: 2 },
  reviewStars: { flexDirection: 'row', gap: 2 },
  reviewRatingText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft },
  reviewComment: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
    marginTop: 10,
    fontStyle: 'italic',
  },
});

export default ReviewsScreen;
