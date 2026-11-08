import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { useMarkJobComplete } from '../../hooks/useJobs';
import { useAlert } from '../../contexts/AlertContext';

import { useEmployerJobs } from '../../hooks/useEmployerJobs';
import { useLanguage } from '../../contexts/LanguageContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { safeGoBack } from '../../utils/navigation';

type MarkCompleteScreenRouteProp = RouteProp<EmployerStackParamList, 'MarkComplete'>;
type MarkCompleteScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'MarkComplete'
>;

const MarkCompleteScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const route = useRoute<MarkCompleteScreenRouteProp>();
  const navigation = useNavigation<MarkCompleteScreenNavigationProp>();
  const { id, jobTitle, workerName } = route.params;

  const markCompleteMutation = useMarkJobComplete();
  const { data: myJobsData } = useEmployerJobs();
  const { showAlert } = useAlert();

  const handleGoBack = React.useCallback(() => {
    safeGoBack(navigation, 'JobStatusManagement', { id });
  }, [navigation, id]);

  React.useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleGoBack]);

  const handleMarkComplete = () => {
    markCompleteMutation.mutate(id, {
      onSuccess: () => {
        const completedJobs = myJobsData?.data?.filter((j) => j.status === 'completed') || [];
        const isFirstCompleted = completedJobs.length === 0;

        navigation.replace('Success', {
          variant: isFirstCompleted ? 'milestone' : 'confirm',
          title: isFirstCompleted
            ? t('mark_complete_first_job_title')
            : t('mark_complete_job_done_title'),
          message: isFirstCompleted
            ? t('mark_complete_first_job_msg', { workerName: workerName || 'your worker' })
            : t('mark_complete_job_done_msg', { workerName: workerName || 'your worker' }),
          detail: [
            { label: 'Job', value: jobTitle },
            ...(workerName ? [{ label: 'Worker', value: workerName }] : []),
          ],
          primaryAction: {
            label: t('mark_complete_rate_worker_btn'),
            navigateTo: {
              name: 'RateWorkerList',
              params: { jobId: id, jobTitle },
            },
          },
          secondaryAction: {
            label: t('mark_complete_later_btn'),
            navigateTo: {
              name: 'JobStatusManagement',
              params: { id },
            },
          },
        });
      },
      onError: (err: any) => {
        showAlert('Error', err.message || t('mark_complete_failed_error'));
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('mark_as_completed')}</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>
          {t('hiring_mark_complete_prompt', { jobTitle: jobTitle || 'this job' })}
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('hiring_mark_complete_explainer')}</Text>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label={t('hiring_mark_complete_confirm_btn')}
          onPress={handleMarkComplete}
          loading={markCompleteMutation.isPending}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Button
          label={t('hiring_not_yet_btn')}
          variant="outline"
          size="base"
          fullWidth
          onPress={handleGoBack}
          disabled={markCompleteMutation.isPending}
        />
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
    backgroundColor: colors.paper,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
    letterSpacing: 0.3,
  },
  content: { padding: 20 },
  prompt: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 24,
    lineHeight: 24,
  },
  bold: { fontFamily: fonts.bodyBold, color: colors.primary },
  infoBox: {
    backgroundColor: colors.status.accepted.bg,
    borderColor: colors.mint,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
  },
  infoText: { fontFamily: fonts.body, fontSize: 14, color: colors.mintDeep, lineHeight: 20 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    gap: 8,
  },
});

export default MarkCompleteScreen;
