import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { useAuthCheck } from '../../hooks/useAuthCheck';
import Button from '../../components/common/Button';

import { useFocusEffect } from '@react-navigation/native';
import { jobsApi } from '../../api/jobs';
import { JobPost } from '../../types';

export const EmployerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const { user } = useAuthCheck();

  const [activeJobs, setActiveJobs] = useState<JobPost[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      const fetchJobs = async () => {
        try {
          const res = await jobsApi.getMyJobs();
          // Filter to show only open/active jobs
          const jobsList = res?.data || [];
          const active = jobsList.filter(
            (j: JobPost) => j.status === 'open' || j.status === 'in_progress',
          );
          setActiveJobs(active);
        } catch (error) {
          console.log('Error fetching jobs:', error);
        } finally {
          setLoading(false);
        }
      };

      fetchJobs();
    }, []),
  );

  const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : 'E');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(user?.name || 'Employer')}</Text>
          </View>
          <View>
            <Text style={styles.greetingSmall}>Hi,</Text>
            <Text style={styles.greetingName}>
              {user?.name ? user.name.split(' ')[0] : 'Employer'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.peach }]}>
            <Text style={[styles.statNum, { color: colors.primaryDark }]}>
              {loading ? '-' : activeJobs.length}
            </Text>
            <Text style={[styles.statLabel, { color: colors.primaryDark }]}>Active jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statNum, { color: colors.mintDeep }]}>0</Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Total hires</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.butter }]}>
            <Text style={[styles.statNum, { color: colors.ink }]}>₱0</Text>
            <Text style={[styles.statLabel, { color: colors.inkSoft }]}>Total paid</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.sky }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.statNum, { color: colors.skyDeep }]}>0.0</Text>
              <Ionicons
                name="star"
                size={14}
                color={colors.skyDeep}
                style={{ marginLeft: 2, marginBottom: 4 }}
              />
            </View>
            <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Reputation</Text>
          </View>
        </View>

        <Button
          label="Post a new job"
          size="lg"
          fullWidth
          icon="add-circle-outline"
          onPress={() => navigation.navigate('PostJob')}
          style={{ marginTop: 24 }}
        />

        <View style={styles.actionHeader}>
          <Text style={styles.sectionHeader}>Action required</Text>
          <View style={styles.badgeCount}>
            <Text style={styles.badgeCountText}>4</Text>
          </View>
        </View>

        <View style={styles.listContainer}>
          {/* Step 1: Review */}
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.urgentSoft }]}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.urgentSoft }]}>
              <Ionicons name="people" size={24} color={colors.urgent} />
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobTitle}>Review new applicants</Text>
              <Text style={styles.jobSubtitle}>3 people applied for "House painter"</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
          </TouchableOpacity>

          {/* Step 2: Finalize Hire */}
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.butter }]}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.butter }]}>
              <Ionicons name="hand-right" size={24} color={colors.ink} />
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobTitle}>Finalize hire & price</Text>
              <Text style={styles.jobSubtitle}>Confirm agreement with Mario Santos</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
          </TouchableOpacity>

          {/* Step 3: Mark Complete */}
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.mint }]}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.mint }]}>
              <Ionicons name="checkmark-done" size={24} color={colors.mintDeep} />
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobTitle}>Mark job as completed</Text>
              <Text style={styles.jobSubtitle}>Is the "Fence Repair" finished?</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
          </TouchableOpacity>

          {/* Step 4: Rate Worker */}
          <TouchableOpacity
            style={[styles.actionCard, { borderColor: colors.sky }]}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: colors.sky }]}>
              <Ionicons name="star" size={24} color={colors.skyDeep} />
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobTitle}>Rate & review worker</Text>
              <Text style={styles.jobSubtitle}>Leave a review for Anna Dimaculangan</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionHeader, { marginTop: 32 }]}>Recent applicants</Text>

        <View style={styles.listContainer}>
          <TouchableOpacity style={styles.applicantCard} activeOpacity={0.7}>
            <View style={styles.applicantAvatar}>
              <Text style={styles.applicantAvatarText}>M</Text>
              <View style={styles.onlineBadge} />
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobTitle}>Mario Santos</Text>
              <Text style={styles.jobSubtitle}>Applied for Carpenter wanted</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.gold} />
                <Text style={styles.ratingText}>4.9 (24 jobs)</Text>
              </View>
            </View>
            <View style={styles.timeTag}>
              <Text style={styles.timeTagText}>2h ago</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.applicantCard} activeOpacity={0.7}>
            <View style={[styles.applicantAvatar, { backgroundColor: colors.peach }]}>
              <Text style={[styles.applicantAvatarText, { color: colors.primaryDark }]}>A</Text>
            </View>
            <View style={styles.jobDetails}>
              <Text style={styles.jobTitle}>Anna Dimaculangan</Text>
              <Text style={styles.jobSubtitle}>Applied for House painter</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color={colors.gold} />
                <Text style={styles.ratingText}>5.0 (12 jobs)</Text>
              </View>
            </View>
            <View style={styles.timeTag}>
              <Text style={styles.timeTagText}>5h ago</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.skyDeep,
  },
  greetingSmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  greetingName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 12,
  },
  statCard: {
    width: '48.5%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontFamily: fonts.numericBold,
    fontSize: 26,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 32,
    marginBottom: 12,
  },
  badgeCount: {
    backgroundColor: colors.urgent,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeCountText: {
    color: colors.white,
    fontFamily: fonts.numericBold,
    fontSize: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    gap: 12,
  },
  actionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 16,
    gap: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  applicantAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.mintDeep,
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.paperBright,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  ratingText: {
    fontFamily: fonts.numeric,
    fontSize: 12,
    color: colors.inkMuted,
    marginLeft: 4,
  },
  timeTag: {
    alignSelf: 'flex-start',
  },
  timeTagText: {
    fontFamily: fonts.numeric,
    fontSize: 11,
    color: colors.inkMuted,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 12,
    paddingRight: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  jobIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  jobSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  jobApplicantsNum: {
    fontFamily: fonts.numericBold,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  newBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default EmployerDashboardScreen;
