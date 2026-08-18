import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useDeleteJob } from '../../hooks/useJobs';
import { useJob } from '../../hooks/useJob';

type JobStatusScreenRouteProp = RouteProp<EmployerStackParamList, 'JobStatusManagement'>;
type JobStatusScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'JobStatusManagement'
>;

export const JobStatusManagementScreen: React.FC = () => {
  const route = useRoute<JobStatusScreenRouteProp>();
  const navigation = useNavigation<JobStatusScreenNavigationProp>();
  const { id } = route.params;

  const { data: job, isLoading, isError, error, refetch } = useJob(id);
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob();
  const { showAlert } = useAlert();

  const handleEditJob = () => {
    if (!job) return;
    navigation.navigate('PostJob', { job } as any);
  };

  const handleMarkComplete = () => {
    navigation.navigate('MarkComplete', { id, jobTitle: job?.title || 'Job' });
  };

  const handleCancelJob = () => {
    showAlert(
      'Cancel Job',
      'Are you sure you want to cancel this job? This will notify any applied or hired workers.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: () => {
            deleteJob(id, {
              onSuccess: () => {
                showAlert('Cancelled', 'Your job post has been cancelled.', [
                  { text: 'OK', onPress: () => navigation.navigate('MyJobs') },
                ]);
              },
              onError: (err: any) => {
                showAlert('Error', err.message || 'Could not cancel job.');
              },
            });
          },
        },
      ],
    );
  };

  const handleDeleteJob = () => {
    showAlert(
      'Archive Post',
      'Are you sure you want to archive this post? It will no longer show up in your post history.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Archive',
          style: 'destructive',
          onPress: () => {
            deleteJob(id, {
              onSuccess: () => {
                navigation.navigate('MyJobs');
              },
              onError: (err: any) => {
                showAlert('Error', err.message || 'Could not archive job.');
              },
            });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (isError || !job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Error</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>
        <View style={{ flex: 1, padding: 20, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.bodyBold, color: colors.error, marginBottom: 12 }}>
            {error?.message || 'Failed to load job details.'}
          </Text>
          <Button label="Retry" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  // Get dynamic status properties from colors.status
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open':
        return {
          label: 'Active / Open',
          bg: colors.status.accepted.bg,
          text: colors.status.accepted.text,
        };
      case 'closed_in_progress':
        return {
          label: 'In Progress',
          bg: colors.status.pending_negotiation.bg,
          text: colors.status.pending_negotiation.text,
        };
      case 'completed':
        return {
          label: 'Completed',
          bg: colors.status.completed.bg,
          text: colors.status.completed.text,
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          bg: colors.status.rejected.bg,
          text: colors.status.rejected.text,
        };
      default:
        return { label: status, bg: colors.inkFaint, text: colors.inkSoft };
    }
  };

  const statusConfig = getStatusConfig(job.status);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Manage Job Status</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.statusBanner}>
          <View style={[styles.statusBadge, { backgroundColor: statusConfig.bg }]}>
            <Text style={[styles.statusBadgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
          <Text style={styles.refNumber}>{job.reference_number}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.jobTitle}>{job.title}</Text>
          <Text style={styles.categoryText}>
            {job.categories && job.categories.length > 0 ? job.categories.join(' · ') : 'General'}
          </Text>

          <View style={styles.metaGrid}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.metaValue}>
                {job.barangay}, {job.municipality}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="cash-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.metaValue}>
                ₱{job.compensation} / {job.duration_type === 'daily' ? 'day' : 'project'}
              </Text>
            </View>

            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.metaValue}>
                Slots: {job.accepted_count} / {job.slots} hired
              </Text>
            </View>
          </View>

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.descriptionText}>{job.description}</Text>

          {job.tools_required ? (
            <>
              <View style={styles.divider} />
              <Text style={styles.sectionTitle}>Tools Required</Text>
              <Text style={styles.descriptionText}>{job.tools_required}</Text>
            </>
          ) : null}
        </View>

        <View style={styles.actionsCard}>
          {job.status === 'open' && (
            <>
              <Button label="Edit Job Post" onPress={handleEditJob} style={styles.actionBtn} />
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
                <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                <Text style={styles.cancelBtnText}>Cancel / Archive Job</Text>
              </TouchableOpacity>
            </>
          )}

          {job.status === 'closed_in_progress' && (
            <>
              <Button
                label="Mark as Completed"
                onPress={handleMarkComplete}
                style={styles.actionBtn}
              />
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
                <Ionicons name="close-circle-outline" size={20} color={colors.error} />
                <Text style={styles.cancelBtnText}>Cancel Job</Text>
              </TouchableOpacity>
            </>
          )}

          {(job.status === 'completed' || job.status === 'cancelled') && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.inkSoft }]}
              onPress={handleDeleteJob}
            >
              <Ionicons name="archive-outline" size={20} color={colors.inkSoft} />
              <Text style={[styles.cancelBtnText, { color: colors.inkSoft }]}>
                Archive Job History
              </Text>
            </TouchableOpacity>
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
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, gap: 16, paddingBottom: 60 },
  statusBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    ...shadows.sm,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusBadgeText: { fontFamily: fonts.bodyBold, fontSize: 13 },
  refNumber: { fontFamily: fonts.numericBlack, fontSize: 12, color: colors.inkMuted },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 20,
    ...shadows.sm,
  },
  jobTitle: { fontFamily: fonts.bodyBold, fontSize: 22, color: colors.ink, marginBottom: 4 },
  categoryText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primarySoft,
    textTransform: 'uppercase',
    marginBottom: 16,
  },
  metaGrid: { gap: 10 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaValue: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft },
  divider: { height: 1, backgroundColor: colors.inkFaint, marginVertical: 16 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, marginBottom: 8 },
  descriptionText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, lineHeight: 20 },
  actionsCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    ...shadows.sm,
  },
  actionBtn: { width: '100%' },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 12,
  },
  cancelBtnText: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.error },
});

export default JobStatusManagementScreen;
