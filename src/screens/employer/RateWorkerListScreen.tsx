import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import { useJob } from '../../hooks/useJob';
import { useReviews } from '../../hooks/useReviews';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import Button from '../../components/common/Button';

type RateWorkerListScreenRouteProp = RouteProp<EmployerStackParamList, 'RateWorkerList'>;
type RateWorkerListScreenNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'RateWorkerList'>;

const RateWorkerListScreen: React.FC = () => {
  const route = useRoute<RateWorkerListScreenRouteProp>();
  const navigation = useNavigation<RateWorkerListScreenNavigationProp>();
  const { jobId, jobTitle } = route.params;

  const { data: jobData, isLoading: isLoadingJob } = useJob(jobId);
  const { data: reviewsData, isLoading: isLoadingReviews } = useReviews();

  const completedApplications = useMemo(() => {
    if (!jobData?.applications) return [];
    return jobData.applications.filter((app: any) => app.status === 'completed');
  }, [jobData]);

  const reviewedApplicationIds = useMemo(() => {
    if (!reviewsData?.reviews) return new Set<number>();
    return new Set(reviewsData.reviews.filter(r => r.reviewer_role === 'employer').map(r => r.id)); // wait, the review doesn't expose application_id in ReviewsResponse!
  }, [reviewsData]);

  if (isLoadingJob || isLoadingReviews) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  const renderWorkerCard = ({ item }: { item: any }) => {
    // Assuming backend returns application_id in reviews, but it doesn't currently. 
    // For now we'll just show the Rate button always, and backend will throw 422 if already rated.
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.worker.name.charAt(0)}</Text>
          </View>
          <View style={styles.workerInfo}>
            <Text style={styles.workerName}>{item.worker.name}</Text>
            <Text style={styles.jobTitle}>{jobTitle}</Text>
          </View>
        </View>
        <Button
          label="Rate Worker"
          variant="primary"
          onPress={() => navigation.navigate('RateWorker', { 
            id: item.id, 
            workerName: item.worker.name, 
            jobTitle 
          })}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.navigate('MyJobs')}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Rate Workers</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Completed Workers</Text>
        <Text style={styles.subtitle}>Select a worker to leave a rating and review for this job.</Text>

        {completedApplications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color={colors.inkFaint} />
            <Text style={styles.emptyTitle}>No Workers Found</Text>
            <Text style={styles.emptySubtitle}>There are no completed workers for this job yet.</Text>
          </View>
        ) : (
          <FlatList
            data={completedApplications}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderWorkerCard}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
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
  content: { padding: 20, flex: 1 },
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 8 },
  subtitle: { fontFamily: fonts.body, fontSize: 15, color: colors.inkSoft, marginBottom: 24 },
  listContainer: { paddingBottom: 20, gap: 12 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.display,
    fontSize: 20,
    color: colors.primaryDark,
  },
  workerInfo: { flex: 1 },
  workerName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  jobTitle: { fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft, marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 40 },
  emptyTitle: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, marginTop: 16 },
  emptySubtitle: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, textAlign: 'center', marginTop: 8 },
});

export default RateWorkerListScreen;
