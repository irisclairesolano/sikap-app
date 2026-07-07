import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useMarkJobComplete, useDeleteJob } from '../../hooks/useJobs';

type JobStatusScreenRouteProp = RouteProp<EmployerStackParamList, 'JobStatusManagement'>;
type JobStatusScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'JobStatusManagement'
>;

export const JobStatusManagementScreen: React.FC = () => {
  const route = useRoute<JobStatusScreenRouteProp>();
  const navigation = useNavigation<JobStatusScreenNavigationProp>();
  const { id } = route.params;

  const { mutate: markComplete, isPending: isCompleting } = useMarkJobComplete();
  const { mutate: deleteJob, isPending: isDeleting } = useDeleteJob();
  const { showAlert } = useAlert();

  const handleMarkComplete = () => {
    showAlert(
      'Mark as Complete',
      'Are you sure you want to mark this job as complete? This will notify the hired worker(s) and allow you to rate them.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () => {
            markComplete(id, {
              onSuccess: () => {
                navigation.navigate('MyJobs');
              },
              onError: (err: any) => {
                showAlert(
                  'Error',
                  err.response?.data?.message || 'Could not mark job as complete.',
                );
              },
            });
          },
        },
      ],
    );
  };

  const handleCancelJob = () => {
    showAlert('Cancel Job', 'Are you sure you want to cancel this job? This cannot be undone.', [
      { text: 'No', style: 'cancel' },
      {
        text: 'Cancel Job',
        style: 'destructive',
        onPress: () => {
          deleteJob(id, {
            onSuccess: () => {
              navigation.navigate('MyJobs');
            },
            onError: (err: any) => {
              showAlert('Error', err.response?.data?.message || 'Could not delete job.');
            },
          });
        },
      },
    ]);
  };

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

      <View style={styles.content}>
        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <Ionicons name="briefcase" size={32} color={colors.primary} />
          </View>
          <Text style={styles.jobTitle}>Job #{id}</Text>
          <Text style={styles.statusText}>
            Currently: <Text style={styles.statusActive}>Active</Text>
          </Text>

          <View style={styles.actionsContainer}>
            <Button
              title="Mark as Complete"
              onPress={handleMarkComplete}
              style={styles.actionBtn}
            />

            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelJob}>
              <Ionicons name="close-circle-outline" size={20} color={colors.error} />
              <Text style={styles.cancelBtnText}>Cancel Job</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
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
  content: { flex: 1, padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    ...shadows.base,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  jobTitle: { fontFamily: fonts.bodyBold, fontSize: 20, color: colors.ink, marginBottom: 8 },
  statusText: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginBottom: 32 },
  statusActive: { color: colors.mintDeep, fontFamily: fonts.bodyBold },
  actionsContainer: { width: '100%', gap: 16 },
  actionBtn: { width: '100%', paddingVertical: 14 },
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
