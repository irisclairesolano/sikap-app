import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState, useEffect } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { profileApi } from '../../api/profile';
import Button from '../../components/common/Button';
import { MonthYearPickerModal, MonthYearValue } from '../../components/common/MonthYearPickerModal';
import CustomInput from '../../components/common/Input';
import { useAlert } from '../../contexts/AlertContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { TranslationKey } from '../../locales/en';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts } from '../../theme';

const MONTH_NAMES_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

const formatMonthYear = (val: MonthYearValue | null): string => {
  if (!val) return '';
  return `${MONTH_NAMES_SHORT[val.month]} ${val.year}`;
};

const parseMonthYearString = (str?: string | null): MonthYearValue | null => {
  if (!str) return null;
  const match = str.trim().match(/^([A-Za-z]{3,9})\s+(\d{4})$/);
  if (!match) return null;
  const mStr = match[1].toLowerCase().slice(0, 3);
  const mIndex = MONTH_NAMES_SHORT.findIndex((m) => m.toLowerCase() === mStr);
  const year = parseInt(match[2], 10);
  if (mIndex >= 0 && !isNaN(year)) {
    return { month: mIndex, year };
  }
  return null;
};

const computeExperienceDuration = (
  start: MonthYearValue | null,
  end: MonthYearValue | null,
  isCurrent: boolean,
  presentLabel: string = 'Present',
): string => {
  if (!start) return '';
  const startStr = formatMonthYear(start);
  const endStr = isCurrent ? presentLabel : end ? formatMonthYear(end) : '';

  const endMonth = isCurrent ? new Date().getMonth() : end ? end.month : start.month;
  const endYear = isCurrent ? new Date().getFullYear() : end ? end.year : start.year;

  const totalMonths = Math.max(1, (endYear - start.year) * 12 + (endMonth - start.month) + 1);
  const years = Math.floor(totalMonths / 12);
  const remainingMonths = totalMonths % 12;

  let lengthPart = '';
  if (years > 0 && remainingMonths > 0) {
    lengthPart = `${years} yr${years > 1 ? 's' : ''} ${remainingMonths} mo${remainingMonths > 1 ? 's' : ''}`;
  } else if (years > 0) {
    lengthPart = `${years} yr${years > 1 ? 's' : ''}`;
  } else {
    lengthPart = `${totalMonths} mo${totalMonths > 1 ? 's' : ''}`;
  }

  if (!endStr) {
    return `${startStr} (${lengthPart})`;
  }
  return `${startStr} – ${endStr} (${lengthPart})`;
};

export const AddWorkHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const [isAdding, setIsAdding] = useState(false);
  const [experiences, setExperiences] = useState<any[]>([]);

  useEffect(() => {
    if (profile?.worker_profile?.experiences) {
      setExperiences(profile.worker_profile.experiences);
    }
  }, [profile?.worker_profile?.experiences]);

  const [jobTitle, setJobTitle] = useState('');
  const [employer, setEmployer] = useState('');
  const [startDate, setStartDate] = useState<MonthYearValue | null>(null);
  const [endDate, setEndDate] = useState<MonthYearValue | null>(null);
  const [isCurrentJob, setIsCurrentJob] = useState(false);
  const [description, setDescription] = useState('');

  const [jobTitleError, setJobTitleError] = useState('');
  const [employerError, setEmployerError] = useState('');
  const [startDateError, setStartDateError] = useState('');
  const [endDateError, setEndDateError] = useState('');

  const [pickerTarget, setPickerTarget] = useState<'start' | 'end' | null>(null);

  const [selectedExperienceId, setSelectedExperienceId] = useState<number | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const { showAlert } = useAlert();

  const saveMutation = useMutation({
    mutationFn: (payload: {
      job_title: string;
      employer_name: string;
      duration: string;
      start_date?: string | null;
      end_date?: string | null;
      is_current?: boolean;
      description: string;
    }) => {
      if (editingExperienceId !== null) {
        return profileApi.updateExperience(editingExperienceId, payload as any);
      } else {
        return profileApi.addExperience(payload as any);
      }
    },
    onMutate: async (payload) => {
      const tempId = -Date.now();
      const optimisticItem = {
        id: editingExperienceId !== null ? editingExperienceId : tempId,
        ...payload,
      };

      if (editingExperienceId !== null) {
        setExperiences((prev) =>
          prev.map((exp) => (exp.id === editingExperienceId ? optimisticItem : exp)),
        );
      } else {
        setExperiences((prev) => [...prev, optimisticItem]);
      }

      handleCancel();
      return { tempId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      const realExp = (data as any)?.experience || data;
      if (
        realExp &&
        typeof realExp === 'object' &&
        'id' in realExp &&
        editingExperienceId === null
      ) {
        setExperiences((prev) =>
          prev.map((exp) => (exp.id === context?.tempId ? (realExp as any) : exp)),
        );
      }
    },
    onError: (err) => {
      console.error('Failed to save work experience', err);
      if (profile?.worker_profile?.experiences) {
        setExperiences(profile.worker_profile.experiences);
      }
      showAlert('Error', t('work_history_err_save_failed'));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileApi.removeExperience(id),
    onMutate: (id) => {
      setExperiences((prev) => prev.filter((exp) => exp.id !== id));
      setSelectedExperienceId(null);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      console.error('Failed to delete work experience', err);
      if (profile?.worker_profile?.experiences) {
        setExperiences(profile.worker_profile.experiences);
      }
      showAlert('Error', t('work_history_err_delete_failed'));
    },
  });

  const handleCancel = () => {
    setJobTitle('');
    setEmployer('');
    setStartDate(null);
    setEndDate(null);
    setIsCurrentJob(false);
    setDescription('');
    setIsAdding(false);
    setEditingExperienceId(null);
    setSelectedExperienceId(null);
    setPickerTarget(null);
    setJobTitleError('');
    setEmployerError('');
    setStartDateError('');
    setEndDateError('');
  };

  const handleJobTitleChange = (text: string) => {
    setJobTitle(text);
    setJobTitleError('');
  };

  const handleEmployerChange = (text: string) => {
    setEmployer(text);
    setEmployerError('');
  };

  const handleCardPress = (id: number) => {
    setSelectedExperienceId(selectedExperienceId === id ? null : id);
  };

  const handleEditPress = (exp: any) => {
    setJobTitle(exp.job_title);
    setEmployer(exp.employer_name || '');

    // Parse start_date & end_date if present
    const parsedStart = parseMonthYearString(exp.start_date);
    const parsedEnd = parseMonthYearString(exp.end_date);

    if (parsedStart) {
      setStartDate(parsedStart);
      setIsCurrentJob(Boolean(exp.is_current));
      setEndDate(exp.is_current ? null : parsedEnd);
    } else {
      // Legacy fallback: attempt to extract date range from duration string
      // e.g. "Jan 2023 – Nov 2024 (1 yr)" or "Jan 2023 – Present"
      const rangeMatch = (exp.duration || '').match(
        /^([A-Za-z]{3,9}\s+\d{4})\s*[–\-]\s*(Present|[A-Za-z]{3,9}\s+\d{4})/i,
      );
      if (rangeMatch) {
        const s = parseMonthYearString(rangeMatch[1]);
        setStartDate(s);
        if (/present/i.test(rangeMatch[2])) {
          setIsCurrentJob(true);
          setEndDate(null);
        } else {
          setIsCurrentJob(false);
          setEndDate(parseMonthYearString(rangeMatch[2]));
        }
      } else {
        setStartDate(null);
        setEndDate(null);
        setIsCurrentJob(false);
      }
    }

    setDescription(exp.description || '');
    setEditingExperienceId(exp.id);
    setIsAdding(true);
  };

  const handleDeleteExperience = (id: number) => {
    setSelectedExperienceId(id);
    showAlert(t('work_history_delete_title'), t('work_history_delete_msg'), [
      { text: t('work_history_btn_cancel'), style: 'cancel' },
      {
        text: t('work_history_action_delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const handleBackPress = () => {
    if (showForm && experiences.length > 0) {
      handleCancel();
    } else {
      navigation.goBack();
    }
  };

  const showForm = isAdding || experiences.length === 0;

  const countWords = (text: string) => {
    return text.trim().split(/\s+/).filter(Boolean).length;
  };

  const descWordCount = countWords(description);

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAwareScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          enableOnAndroid={true}
          extraScrollHeight={40}
        >
          <Text style={styles.title}>
            {editingExperienceId !== null
              ? t('work_history_title_edit')
              : showForm
                ? t('work_history_title_add')
                : t('work_history_title_list')}
          </Text>
          <Text style={styles.subtitle}>
            {editingExperienceId !== null
              ? t('work_history_subtitle_edit')
              : showForm
                ? t('work_history_subtitle_add')
                : t('work_history_subtitle_count').replace('{count}', String(experiences.length))}
          </Text>

          {/* Added job history list (shown above form, if any exist) */}
          {experiences.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.sectionHeader}>
                {t('work_history_added_jobs_header').replace('{count}', String(experiences.length))}
              </Text>
              {experiences.map((exp) => {
                const isSelected = selectedExperienceId === exp.id;
                const isMenuOpen = activeMenuId === exp.id;
                return (
                  <View key={exp.id} style={[styles.card, isSelected && styles.cardSelected]}>
                    <View style={styles.cardHeader}>
                      <View style={styles.cardMain}>
                        <View style={styles.cardIcon}>
                          <Ionicons name="briefcase" size={20} color={colors.inkMuted} />
                        </View>
                        <View style={styles.cardContent}>
                          <Text style={styles.cardTitle}>{exp.job_title}</Text>
                          <Text style={styles.cardSubtitle}>{exp.employer_name}</Text>
                          <Text style={styles.cardMeta}>{exp.duration}</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        onPress={() => setActiveMenuId(isMenuOpen ? null : exp.id)}
                        style={styles.threeDotsButton}
                        accessibilityLabel="Job options"
                        accessibilityRole="button"
                      >
                        <Ionicons name="ellipsis-vertical" size={20} color={colors.inkMuted} />
                      </TouchableOpacity>
                    </View>

                    {exp.description ? (
                      <Text style={styles.cardDesc}>{exp.description}</Text>
                    ) : null}

                    {isMenuOpen && (
                      <View style={styles.menuDropdown}>
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            handleEditPress(exp);
                            setActiveMenuId(null);
                          }}
                          accessibilityLabel="Edit job"
                          accessibilityRole="button"
                        >
                          <Ionicons name="create-outline" size={16} color={colors.inkSoft} />
                          <Text style={styles.menuItemText}>{t('work_history_action_edit')}</Text>
                        </TouchableOpacity>
                        <View style={styles.menuDivider} />
                        <TouchableOpacity
                          style={styles.menuItem}
                          onPress={() => {
                            handleDeleteExperience(exp.id);
                            setActiveMenuId(null);
                          }}
                          accessibilityLabel="Delete job"
                          accessibilityRole="button"
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text style={[styles.menuItemText, { color: colors.error }]}>
                            {t('work_history_action_delete')}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          )}

          {showForm ? (
            <View style={styles.formContainer}>
              <Text style={styles.sectionHeader}>
                {editingExperienceId !== null
                  ? t('work_history_form_header_edit')
                  : t('work_history_form_header_add')}
              </Text>
              <CustomInput
                label={t('work_history_job_title_label')}
                value={jobTitle}
                onChangeText={handleJobTitleChange}
                placeholder={t('work_history_job_title_placeholder')}
                icon="briefcase-outline"
                maxLength={85}
                error={jobTitleError}
                status={jobTitleError ? 'invalid' : null}
              />
              <Text style={styles.inputLimitHelper}>{jobTitle.length}/85 characters</Text>

              <CustomInput
                label={t('work_history_employer_label')}
                value={employer}
                onChangeText={handleEmployerChange}
                placeholder={t('work_history_employer_placeholder')}
                icon="business-outline"
                maxLength={85}
                error={employerError}
                status={employerError ? 'invalid' : null}
              />
              <Text style={styles.inputLimitHelper}>{employer.length}/85 characters</Text>

              {/* Start Date & End Date Picker */}
              <View style={styles.datesContainer}>
                <View style={styles.row}>
                  {/* Start Date */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>{t('work_history_start_date_label')}</Text>
                    <TouchableOpacity
                      style={[
                        styles.dateSelectButton,
                        startDateError ? styles.dateSelectButtonError : null,
                      ]}
                      onPress={() => setPickerTarget('start')}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar-outline" size={18} color={colors.primary} />
                      <Text
                        style={[styles.dateSelectText, !startDate && styles.dateSelectPlaceholder]}
                        numberOfLines={1}
                      >
                        {startDate
                          ? formatMonthYear(startDate)
                          : t('work_history_start_date_placeholder')}
                      </Text>
                    </TouchableOpacity>
                    {startDateError ? (
                      <Text style={styles.fieldErrorText}>{startDateError}</Text>
                    ) : null}
                  </View>

                  {/* End Date */}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inputLabel}>{t('work_history_end_date_label')}</Text>
                    <TouchableOpacity
                      style={[
                        styles.dateSelectButton,
                        isCurrentJob ? styles.dateSelectButtonDisabled : null,
                        endDateError ? styles.dateSelectButtonError : null,
                      ]}
                      onPress={() => {
                        if (!isCurrentJob) setPickerTarget('end');
                      }}
                      disabled={isCurrentJob}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color={isCurrentJob ? colors.inkMuted : colors.primary}
                      />
                      <Text
                        style={[
                          styles.dateSelectText,
                          isCurrentJob && styles.dateSelectTextDisabled,
                          !endDate && !isCurrentJob && styles.dateSelectPlaceholder,
                        ]}
                        numberOfLines={1}
                      >
                        {isCurrentJob
                          ? t('work_history_present')
                          : endDate
                            ? formatMonthYear(endDate)
                            : t('work_history_end_date_placeholder')}
                      </Text>
                    </TouchableOpacity>
                    {endDateError && !isCurrentJob ? (
                      <Text style={styles.fieldErrorText}>{endDateError}</Text>
                    ) : null}
                  </View>
                </View>

                {/* Currently working here Toggle */}
                <View style={styles.currentJobRow}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={styles.currentJobLabel}>
                      {t('work_history_current_job_label')}
                    </Text>
                  </View>
                  <Switch
                    value={isCurrentJob}
                    onValueChange={(val) => {
                      setIsCurrentJob(val);
                      if (val) {
                        setEndDate(null);
                        setEndDateError('');
                      }
                    }}
                    trackColor={{ false: colors.inkFaint, true: colors.primary }}
                    thumbColor={Platform.OS === 'android' ? colors.white : undefined}
                  />
                </View>

                {/* Duration Preview */}
                {startDate ? (
                  <View style={styles.durationPill}>
                    <Ionicons name="time-outline" size={15} color={colors.primaryDark} />
                    <Text style={styles.durationPillText}>
                      {computeExperienceDuration(
                        startDate,
                        endDate,
                        isCurrentJob,
                        t('work_history_present'),
                      )}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View>
                <CustomInput
                  label={t('work_history_desc_label')}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={t('work_history_desc_placeholder')}
                  multiline
                  icon="document-text-outline"
                />
                <Text
                  style={[styles.wordCountText, descWordCount > 250 && styles.wordCountTextError]}
                >
                  {descWordCount}/250 words
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
              <View style={styles.addIconCircle}>
                <Ionicons name="add" size={22} color={colors.white} />
              </View>
              <Text style={styles.addTitle}>{t('work_history_btn_add_another')}</Text>
            </TouchableOpacity>
          )}
        </KeyboardAwareScrollView>

        {/* Month & Year Picker Modal */}
        <MonthYearPickerModal
          visible={pickerTarget !== null}
          onClose={() => setPickerTarget(null)}
          title={
            pickerTarget === 'start'
              ? t('work_history_start_date_label')
              : t('work_history_end_date_label')
          }
          initialValue={pickerTarget === 'start' ? startDate : endDate}
          minDate={pickerTarget === 'end' && startDate ? startDate : undefined}
          maxDate={{ month: new Date().getMonth(), year: new Date().getFullYear() }}
          onSelect={(val) => {
            if (pickerTarget === 'start') {
              setStartDate(val);
              setStartDateError('');
              // If end date precedes new start date, reset end date
              if (
                endDate &&
                (val.year > endDate.year ||
                  (val.year === endDate.year && val.month > endDate.month))
              ) {
                setEndDate(null);
              }
            } else if (pickerTarget === 'end') {
              setEndDate(val);
              setEndDateError('');
            }
          }}
        />

        <View style={styles.bottomBar}>
          {showForm ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {experiences.length > 0 && (
                <Button
                  label={t('work_history_btn_cancel')}
                  size="lg"
                  variant="outline"
                  onPress={handleCancel}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                label={
                  saveMutation.isPending
                    ? t('work_history_btn_saving')
                    : editingExperienceId !== null
                      ? t('work_history_btn_save_changes')
                      : t('work_history_btn_save_job')
                }
                size="lg"
                style={{ flex: experiences.length > 0 ? 2 : 1 }}
                loading={saveMutation.isPending}
                onPress={() => {
                  const errors: Record<string, string> = {};
                  if (!jobTitle.trim()) {
                    errors.jobTitle = t('work_history_err_job_title_req');
                  } else if (jobTitle.length > 85) {
                    errors.jobTitle = 'Job title cannot exceed 85 characters';
                  }

                  if (!employer.trim()) {
                    errors.employer = t('work_history_err_employer_req');
                  } else if (employer.length > 85) {
                    errors.employer = 'Employer name cannot exceed 85 characters';
                  }

                  if (!startDate) {
                    errors.startDate = t('work_history_err_start_date_req');
                  }

                  if (!isCurrentJob && !endDate) {
                    errors.endDate = t('work_history_err_end_date_req');
                  }

                  if (startDate && endDate && !isCurrentJob) {
                    if (
                      endDate.year < startDate.year ||
                      (endDate.year === startDate.year && endDate.month < startDate.month)
                    ) {
                      errors.endDate = t('work_history_err_dates_order');
                    }
                  }

                  if (Object.keys(errors).length > 0) {
                    setJobTitleError(errors.jobTitle || '');
                    setEmployerError(errors.employer || '');
                    setStartDateError(errors.startDate || '');
                    setEndDateError(errors.endDate || '');
                    return;
                  }

                  const computedDuration = computeExperienceDuration(
                    startDate,
                    endDate,
                    isCurrentJob,
                    t('work_history_present'),
                  );

                  saveMutation.mutate({
                    job_title: jobTitle,
                    employer_name: employer,
                    duration: computedDuration,
                    start_date: formatMonthYear(startDate),
                    end_date: isCurrentJob ? null : formatMonthYear(endDate),
                    is_current: isCurrentJob,
                    description: description,
                  });
                }}
                disabled={
                  saveMutation.isPending ||
                  jobTitle.length > 85 ||
                  employer.length > 85 ||
                  descWordCount > 250
                }
              />
            </View>
          ) : (
            <Button
              label={t('work_history_btn_done')}
              size="lg"
              variant="soft"
              fullWidth
              onPress={() => navigation.goBack()}
            />
          )}
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.8,
    paddingBottom: 4,
  },
  titleAccent: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    marginTop: 8,
  },
  formContainer: {
    marginTop: 32,
    gap: 16,
  },
  listContainer: {
    marginTop: 32,
    gap: 12,
  },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 8,
  },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    borderWidth: 2,
    borderColor: colors.paperBright,
    position: 'relative',
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMain: {
    flexDirection: 'row',
    gap: 14,
    flex: 1,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.paperCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 2,
  },
  cardMeta: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  threeDotsButton: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
  menuDropdown: {
    position: 'absolute',
    top: 40,
    right: 8,
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingVertical: 6,
    width: 120,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    zIndex: 1000,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  menuItemText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.inkSoft,
  },
  menuDivider: {
    height: 1,
    backgroundColor: colors.inkFaint,
  },
  inputLimitHelper: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: -8,
    marginBottom: 4,
  },
  wordCountText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: 4,
  },
  wordCountTextError: {
    color: colors.error,
    fontFamily: fonts.bodyBold,
  },
  addButton: {
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.skyDeep,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.skyDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.skyDeep,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.paper,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 6,
    lineHeight: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 4,
  },
  inputLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  unitSelector: {
    flexDirection: 'row',
    backgroundColor: colors.paperCream,
    borderRadius: 12,
    padding: 4,
    height: 56,
  },
  unitBtn: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: colors.white,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unitBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  unitBtnTextActive: {
    color: colors.primary,
  },
  datesContainer: {
    marginTop: -4,
    marginBottom: 4,
  },
  dateSelectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    height: 56,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: colors.white,
  },
  dateSelectButtonError: {
    borderColor: colors.error,
  },
  dateSelectButtonDisabled: {
    backgroundColor: colors.paperCream,
    opacity: 0.6,
  },
  dateSelectText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    flex: 1,
  },
  dateSelectPlaceholder: {
    color: colors.inkMuted,
  },
  dateSelectTextDisabled: {
    color: colors.inkMuted,
  },
  fieldErrorText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.error,
    marginTop: 4,
    marginLeft: 2,
  },
  currentJobRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingVertical: 4,
  },
  currentJobLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.primaryTint,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  durationPillText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.primaryDark,
  },
});

export default AddWorkHistoryScreen;
