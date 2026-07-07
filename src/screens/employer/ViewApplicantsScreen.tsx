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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import Button from '../../components/common/Button';
import { useJob } from '../../hooks/useJob';
import { useJobApplications } from '../../hooks/useJobApplications';

type ViewApplicantsRouteProp = RouteProp<EmployerStackParamList, 'ViewApplicants'>;

const FILTERS = ['All', 'pending', 'employer_requested', 'employer_confirmed', 'rejected'];

export const ViewApplicantsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const route = useRoute<ViewApplicantsRouteProp>();
  const { id: jobId } = route.params;

  const [activeFilter, setActiveFilter] = useState('All');

  const { data: job, isLoading: isJobLoading } = useJob(jobId);
  const { data: applications = [], isLoading: isAppsLoading } = useJobApplications(jobId);

  const filteredApps = applications.filter(
    (app) => activeFilter === 'All' || app.status === activeFilter,
  );

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return 'New';
      case 'employer_requested':
        return 'Shortlisted';
      case 'employer_confirmed':
        return 'Hired';
      case 'rejected':
        return 'Rejected';
      case 'accepted':
        return 'Accepted by Worker';
      default:
        return status;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.appBarBadge}>
          <Text style={styles.appBarBadgeText}>Review applicants</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isJobLoading || isAppsLoading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBanner}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={colors.primaryDark}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.infoText}>
              <Text style={{ fontFamily: fonts.bodyBold, color: colors.primaryDark }}>
                Privacy Shield is active.
              </Text>{' '}
              Only public profile data is visible right now. Shortlist a worker to see their contact
              info.
            </Text>
          </View>

          {job && (
            <View style={styles.jobSummary}>
              <Text style={styles.jobTitle}>{job.title}</Text>
              <Text style={styles.jobSubtitle}>
                {job.barangay}, {job.municipality} · ₱{job.compensation}/
                {job.duration_type === 'daily' ? 'day' : 'project'} · {job.slots} slots
              </Text>
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            {FILTERS.map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.chip, activeFilter === filter && styles.chipActive]}
                onPress={() => setActiveFilter(filter)}
              >
                <Text style={[styles.chipText, activeFilter === filter && styles.chipTextActive]}>
                  {filter === 'All' ? `All · ${applications.length}` : getStatusLabel(filter)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={styles.listContainer}>
            {filteredApps.map((app) => (
              <TouchableOpacity
                key={app.id}
                style={styles.applicantCard}
                onPress={() =>
                  navigation.navigate('ApplicantDetail', {
                    applicantId: app.id,
                    applicantName: `${app.worker?.first_name || ''} ${app.worker?.last_name || ''}`,
                    jobTitle: job?.title || '',
                    status: app.status,
                  })
                }
                activeOpacity={0.7}
              >
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: colors.peach }]}>
                    <Text style={styles.avatarText}>
                      {app.worker?.first_name?.charAt(0) || 'U'}
                    </Text>
                  </View>
                  <View style={styles.applicantDetails}>
                    <View style={styles.nameRow}>
                      <Text style={styles.applicantName}>
                        {app.worker?.first_name} {app.worker?.last_name}
                      </Text>
                      {app.worker?.workerProfile?.verified && (
                        <Ionicons
                          name="checkmark-circle"
                          size={14}
                          color={colors.mintDeep}
                          style={{ marginLeft: 4 }}
                        />
                      )}
                    </View>
                    <Text style={styles.applicantLocation}>{getStatusLabel(app.status)}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}

            {filteredApps.length === 0 && (
              <Text
                style={{
                  textAlign: 'center',
                  marginTop: 20,
                  color: colors.inkSoft,
                  fontFamily: fonts.body,
                }}
              >
                No applicants in this category.
              </Text>
            )}
          </View>
        </ScrollView>
      )}
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  appBarBadge: {
    backgroundColor: colors.paperBright,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  appBarBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.peach,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 20,
    marginTop: 8,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.primaryDark,
  },
  jobSummary: {
    marginHorizontal: 20,
    marginTop: 16,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  jobSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginTop: 14,
    gap: 8,
    flexDirection: 'row',
    paddingBottom: 4,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipActive: {
    backgroundColor: colors.ink,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextActive: {
    color: colors.white,
  },
  listContainer: {
    marginHorizontal: 20,
    marginTop: 14,
    gap: 10,
  },
  applicantCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  applicantDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  applicantName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  applicantLocation: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 6,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    fontFamily: fonts.numericBold,
    fontSize: 13,
    color: colors.ink,
  },
  statText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
});

export default ViewApplicantsScreen;
