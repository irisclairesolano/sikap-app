import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { EarlyCompletionReason, useMarkJobComplete } from '../../hooks/useJobs';
import { useAlert } from '../../contexts/AlertContext';
import { ApiClientError } from '../../api/client';
import { useEmployerJobs } from '../../hooks/useEmployerJobs';
import { useLanguage } from '../../contexts/LanguageContext';
import { Ionicons } from '@expo/vector-icons';
import { safeGoBack } from '../../utils/navigation';

type MarkCompleteScreenRouteProp = RouteProp<EmployerStackParamList, 'MarkComplete'>;
type MarkCompleteScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'MarkComplete'
>;

const EARLY_REASONS: { value: EarlyCompletionReason; label: string; labelTl: string }[] = [
  {
    value: 'finished_early',
    label: 'Work finished ahead of schedule',
    labelTl: 'Natapos nang mas maaga ang trabaho',
  },
  {
    value: 'mutual_agreement',
    label: 'Mutual agreement to end early',
    labelTl: 'Napagkasunduang tapusin nang maaga',
  },
  {
    value: 'terminated',
    label: 'Ended early / Terminated',
    labelTl: 'Maagang tinapos / Na-terminate',
  },
];

const parseExpectedEndDate = (job: any): { startDay: Date | null; endDay: Date | null } => {
  if (!job?.schedule_date) return { startDay: null, endDay: null };
  const rawStart = new Date(job.schedule_date);
  if (isNaN(rawStart.getTime())) return { startDay: null, endDay: null };

  const startDay = new Date(rawStart.getFullYear(), rawStart.getMonth(), rawStart.getDate());
  const endDay = new Date(startDay);

  const durUnit = String(job.duration_unit || '')
    .toLowerCase()
    .trim();
  const durStr = String(job.duration || '')
    .toLowerCase()
    .trim();

  let durVal: number | null = null;
  let durUnitParsed = '';
  const match = durStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?/);
  if (match) {
    durVal = parseFloat(match[1]);
    durUnitParsed = (match[2] || '').toLowerCase();
  } else if (job.duration !== undefined && job.duration !== null && !isNaN(Number(job.duration))) {
    durVal = Number(job.duration);
  }

  const effectiveUnit = durUnit || durUnitParsed;
  if (durVal && durVal > 0 && effectiveUnit) {
    if (effectiveUnit.includes('day')) {
      const days = Math.max(1, Math.ceil(durVal));
      if (days > 1) endDay.setDate(endDay.getDate() + (days - 1));
    } else if (effectiveUnit.includes('week')) {
      const weeks = Math.max(1, Math.ceil(durVal));
      endDay.setDate(endDay.getDate() + weeks * 7 - 1);
    } else if (effectiveUnit.includes('month')) {
      const months = Math.max(1, Math.ceil(durVal));
      endDay.setMonth(endDay.getMonth() + months);
      endDay.setDate(endDay.getDate() - 1);
    }
  }

  return { startDay, endDay };
};

const formatDateLabel = (d: Date | null) =>
  d ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';

const MarkCompleteScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t, language } = useLanguage();
  const isTagalog = language === 'tl';
  const route = useRoute<MarkCompleteScreenRouteProp>();
  const navigation = useNavigation<MarkCompleteScreenNavigationProp>();
  const { id, jobTitle, workerName } = route.params;

  const markCompleteMutation = useMarkJobComplete();
  const { data: myJobsData } = useEmployerJobs();
  const { showAlert } = useAlert();

  const [earlyReason, setEarlyReason] = useState<EarlyCompletionReason | null>(null);
  const [earlyNote, setEarlyNote] = useState('');
  const [serverRequiresEarlyReason, setServerRequiresEarlyReason] = useState(false);

  const currentJob = useMemo(() => {
    return myJobsData?.data?.find((j: any) => Number(j.id) === Number(id)) || null;
  }, [myJobsData, id]);

  const { isBeforeStartDate, isEarlyMultiDay, startDateLabel, expectedEndDateLabel } =
    useMemo(() => {
      const { startDay, endDay } = parseExpectedEndDate(currentJob);
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const beforeStart = !!startDay && today.getTime() < startDay.getTime();
      const earlyMultiDay = !beforeStart && !!endDay && today.getTime() < endDay.getTime();
      return {
        isBeforeStartDate: beforeStart,
        isEarlyMultiDay: earlyMultiDay,
        startDateLabel: formatDateLabel(startDay),
        expectedEndDateLabel: formatDateLabel(endDay),
      };
    }, [currentJob]);

  const needsEarlyReason = isEarlyMultiDay || serverRequiresEarlyReason;

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
    if (isBeforeStartDate) {
      showAlert(
        isTagalog ? 'Hindi Pa Nagsisimula' : 'Job Has Not Started Yet',
        isTagalog
          ? `Nakatakdang magsimula ang trabahong ito sa ${startDateLabel}. Gamitin ang Cancel Hire kung nakansela ang trabaho.`
          : `This job is scheduled to start on ${startDateLabel} and cannot be marked complete yet. Use Cancel Hire if the job was called off.`,
      );
      return;
    }

    if (needsEarlyReason && !earlyReason) {
      showAlert(
        isTagalog ? 'Pumili ng Dahilan' : 'Select a Reason',
        isTagalog
          ? 'Pumili ng dahilan kung bakit tinatapos nang mas maaga ang trabaho.'
          : 'Please select a reason for ending this multi-day job early.',
      );
      return;
    }

    const payload = needsEarlyReason
      ? {
          jobId: id,
          earlyCompletionReason: earlyReason ?? undefined,
          earlyCompletionNote: earlyNote.trim() || undefined,
        }
      : id;

    markCompleteMutation.mutate(payload, {
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
        if (
          err instanceof ApiClientError &&
          err.metadata?.code === 'early_completion_reason_required'
        ) {
          setServerRequiresEarlyReason(true);
        }
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.prompt}>
          {t('hiring_mark_complete_prompt', { jobTitle: jobTitle || 'this job' })}
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>{t('hiring_mark_complete_explainer')}</Text>
        </View>

        {isBeforeStartDate ? (
          <View style={styles.warningBox}>
            <Ionicons name="calendar-outline" size={20} color="#B45309" />
            <Text style={styles.warningText}>
              {isTagalog
                ? `Nakatakdang magsimula ang trabahong ito sa ${startDateLabel}. Hindi pa ito maaaring markahang tapos. Gamitin ang Cancel Hire kung hindi na ito matutuloy.`
                : `This job is scheduled to start on ${startDateLabel} and cannot be marked complete yet. Use Cancel Hire if the job was called off.`}
            </Text>
          </View>
        ) : needsEarlyReason ? (
          <View style={styles.earlyCard}>
            <View style={styles.earlyHeaderRow}>
              <Ionicons name="time-outline" size={18} color="#B45309" />
              <Text style={styles.earlyTitle}>
                {isTagalog ? 'Maagang Pagtatapos ng Trabaho' : 'Ending Multi-Day Job Early'}
              </Text>
            </View>
            <Text style={styles.earlyDesc}>
              {isTagalog
                ? `Nakatakda ang trabahong ito hanggang ${expectedEndDateLabel || 'takdang petsa'}. Pumili ng dahilan para sa record:`
                : `This job is scheduled until ${expectedEndDateLabel || 'its end date'}. Select a reason for ending it early:`}
            </Text>
            <View style={styles.reasonList}>
              {EARLY_REASONS.map((option) => {
                const selected = earlyReason === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[styles.reasonOption, selected && styles.reasonOptionSelected]}
                    onPress={() => setEarlyReason(option.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons
                      name={selected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={selected ? colors.primary : colors.inkMuted}
                    />
                    <Text
                      style={[styles.reasonOptionText, selected && styles.reasonOptionTextSelected]}
                    >
                      {isTagalog ? option.labelTl : option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <TextInput
              style={styles.noteInput}
              placeholder={
                isTagalog ? 'Maikling paliwanag (opsyonal)...' : 'Short note (optional)...'
              }
              placeholderTextColor={colors.inkMuted}
              value={earlyNote}
              onChangeText={setEarlyNote}
              maxLength={300}
              multiline
            />
          </View>
        ) : null}
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label={t('hiring_mark_complete_confirm_btn')}
          onPress={handleMarkComplete}
          loading={markCompleteMutation.isPending}
          disabled={isBeforeStartDate || (needsEarlyReason && !earlyReason)}
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
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#FEF3C7',
    borderColor: '#FCD34D',
    borderWidth: 1,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  warningText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 19,
  },
  earlyCard: {
    backgroundColor: colors.paperBright,
    borderColor: '#FCD34D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  earlyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  earlyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  earlyDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    marginBottom: 12,
  },
  reasonList: {
    gap: 8,
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.paper,
  },
  reasonOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  reasonOptionText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  reasonOptionTextSelected: {
    fontFamily: fonts.bodyBold,
    color: colors.primary,
  },
  noteInput: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    minHeight: 68,
    textAlignVertical: 'top',
  },
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
