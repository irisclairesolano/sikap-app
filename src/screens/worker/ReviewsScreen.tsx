import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkerStackParamList } from '../../navigation/workerTypes';
import { colors, fonts, shadows } from '../../theme';

type ReviewsScreenNavigationProp = NativeStackNavigationProp<WorkerStackParamList, 'Reviews'>;

import { ActivityIndicator } from 'react-native';
import { useReviews } from '../../hooks/useReviews';

export const ReviewsScreen: React.FC = () => {
  const navigation = useNavigation<ReviewsScreenNavigationProp>();
  const { data, isLoading, error } = useReviews();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const reputationScore = data?.reputation_score || 0;
  const reviewsCount = data?.reviews_count || 0;
  const reviewsList = data?.reviews || [];

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

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.scoreSection}>
            <Text style={styles.scoreNumber}>{reputationScore.toFixed(1)}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Ionicons key={s} name={s <= Math.round(reputationScore) ? "star" : "star-outline"} size={12} color={colors.gold} />
              ))}
            </View>
            <Text style={styles.reviewsCount}>{reviewsCount} reviews</Text>
          </View>

          <View style={styles.distributionSection}>
            {/* 5 Stars */}
            <View style={styles.distRow}>
              <Text style={styles.distLabel}>5</Text>
              <Ionicons name="star" size={9} color={colors.gold} />
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: '75%' }]} />
              </View>
              <Text style={styles.distCount}>6</Text>
            </View>
            {/* 4 Stars */}
            <View style={styles.distRow}>
              <Text style={styles.distLabel}>4</Text>
              <Ionicons name="star" size={9} color={colors.gold} />
              <View style={styles.barBackground}>
                <View style={[styles.barFill, { width: '25%' }]} />
              </View>
              <Text style={styles.distCount}>2</Text>
            </View>
            {/* 3 Stars */}
            <View style={styles.distRow}>
              <Text style={styles.distLabel}>3</Text>
              <Ionicons name="star" size={9} color={colors.gold} />
              <View style={styles.barBackground} />
              <Text style={styles.distCount}>0</Text>
            </View>
          </View>
        </View>

        {/* Reviews List */}
        <View style={styles.reviewsList}>
          {reviewsList.map((review) => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewHeader}>
                <View style={styles.reviewerInfo}>
                  <View style={[styles.avatar, { backgroundColor: colors.sky }]}>
                    <Text style={styles.avatarText}>{review.reviewer?.name?.charAt(0) || 'U'}</Text>
                  </View>
                  <View>
                    <Text style={styles.reviewerName}>{review.reviewer?.name}</Text>
                    <Text style={styles.reviewMeta}>
                      {review.reviewer_role}
                    </Text>
                  </View>
                </View>
                <View style={styles.reviewStars}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons 
                      key={s} 
                      name={s <= review.overall_rating ? "star" : "star-outline"} 
                      size={12} 
                      color={s <= review.overall_rating ? colors.gold : colors.inkLight} 
                    />
                  ))}
                </View>
              </View>
              {review.comment ? <Text style={styles.reviewComment}>"{review.comment}"</Text> : null}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: { backgroundColor: colors.paperBright, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, ...shadows.sm },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  summaryCard: { backgroundColor: colors.peach, borderRadius: 20, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 16 },
  scoreSection: { alignItems: 'center' },
  scoreNumber: { fontFamily: fonts.display, fontSize: 44, color: colors.ink, lineHeight: 48 },
  starsRow: { flexDirection: 'row', gap: 1, marginTop: 4 },
  reviewsCount: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.primaryDark, marginTop: 4 },
  distributionSection: { flex: 1, gap: 5 },
  distRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  distLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft, width: 8 },
  barBackground: { flex: 1, height: 4, backgroundColor: 'rgba(0,0,0,0.08)', borderRadius: 2 },
  barFill: { height: '100%', backgroundColor: colors.gold, borderRadius: 2 },
  distCount: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft, width: 12, textAlign: 'right' },
  reviewsList: { marginTop: 14, gap: 10 },
  reviewCard: { backgroundColor: colors.paperBright, borderRadius: 16, padding: 14, ...shadows.sm },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  reviewerInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  reviewerName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  reviewMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  reviewStars: { flexDirection: 'row', gap: 1 },
  reviewComment: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 20, marginTop: 10, fontStyle: 'italic' },
});

export default ReviewsScreen;
