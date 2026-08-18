import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useEmployerJobs } from '../../hooks/useEmployerJobs';
import { JobPost } from '../../types';
import { JobCardSkeleton } from '../../components/common/SkeletonLoader';

type MyJobsNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'MyJobs'>;

export const MyJobsScreen: React.FC = () => {
  const navigation = useNavigation<MyJobsNavigationProp>();
  const [activeTab, setActiveTab] = useState<'Active' | 'Past'>('Active');

  const { data: jobsResponse, isLoading, isError } = useEmployerJobs();
  const jobs = jobsResponse?.data || [];

  const filteredJobs = jobs.filter((job) =>
    activeTab === 'Active' ? job.status === 'open' : job.status !== 'open',
  );

  const renderJobCard = useCallback(
    ({ item }: { item: JobPost }) => (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate('JobDetails', { id: item.id })}
      >
        <View style={styles.jobHeader}>
          <Text style={styles.jobCategory}>
            {item.categories && item.categories.length > 0 ? item.categories[0] : 'General'}
          </Text>
          <Text style={styles.jobTime}>{item.status}</Text>
        </View>
        <Text style={styles.jobTitle}>{item.title}</Text>

        <View style={styles.jobFooter}>
          <View style={styles.applicantsBadge}>
            <Ionicons name="people" size={14} color={colors.primary} />
            <Text style={styles.applicantsText}>{item.applications?.length || 0} applicants</Text>
          </View>
          <TouchableOpacity
            style={styles.manageBtn}
            onPress={() => navigation.navigate('ViewApplicants', { id: item.id })}
          >
            <Text style={styles.manageBtnText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    ),
    [navigation],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.iconBtn} />
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>My Posts</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Active' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Active')}
        >
          <Text style={[styles.tabText, activeTab === 'Active' && styles.tabTextActive]}>
            Active ({jobs.filter((j) => j.status === 'open').length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'Past' && styles.tabBtnActive]}
          onPress={() => setActiveTab('Past')}
        >
          <Text style={[styles.tabText, activeTab === 'Past' && styles.tabTextActive]}>
            Past ({jobs.filter((j) => j.status !== 'open').length})
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={{ padding: 20 }}>
          <JobCardSkeleton />
          <JobCardSkeleton />
        </View>
      ) : isError ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Error loading jobs</Text>
        </View>
      ) : filteredJobs.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="briefcase-outline" size={48} color={colors.inkFaint} />
          <Text style={styles.emptyTitle}>No {activeTab.toLowerCase()} jobs</Text>
          <Text style={styles.emptyBody}>
            You don't have any {activeTab.toLowerCase()} job postings right now.
          </Text>
          {activeTab === 'Active' && (
            <Button
              label="Post a job"
              onPress={() => navigation.navigate('PostJob')}
              style={{ marginTop: 20 }}
            />
          )}
        </View>
      ) : (
        <FlatList
          data={filteredJobs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderJobCard}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={5}
          removeClippedSubviews={true}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('PostJob')}>
        <Ionicons name="add" size={30} color={colors.white} />
      </TouchableOpacity>
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
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  tabContainer: { flexDirection: 'row', paddingHorizontal: 20, marginBottom: 10 },
  tabBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: colors.inkFaint,
  },
  tabBtnActive: { borderBottomColor: colors.primary },
  tabText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  tabTextActive: { color: colors.primary },
  listContent: { padding: 20, paddingBottom: 40, gap: 14 },
  jobCard: { backgroundColor: colors.paperBright, borderRadius: 16, padding: 16, ...shadows.sm },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  jobCategory: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  jobTime: { fontFamily: fonts.body, fontSize: 11, color: colors.inkLight },
  jobTitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.ink, marginBottom: 16 },
  jobFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  applicantsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.peach,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
    gap: 6,
  },
  applicantsText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primaryDark },
  manageBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.primary,
  },
  manageBtnText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.paperBright },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
});

export default MyJobsScreen;
