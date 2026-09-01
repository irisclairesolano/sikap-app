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
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { profileApi } from '../../api/profile';
import Button from '../../components/common/Button';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import CustomInput from '../../components/common/Input';
import { useAlert } from '../../contexts/AlertContext';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts } from '../../theme';

const DURATION_UNITS = ['Days', 'Weeks', 'Months', 'Years'];

export const AddWorkHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const queryClient = useQueryClient();

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
  const [durationVal, setDurationVal] = useState('');
  const [durationUnit, setDurationUnit] = useState('Months');
  const [description, setDescription] = useState('');
  const [jobTitleError, setJobTitleError] = useState('');
  const [employerError, setEmployerError] = useState('');
  const [durationError, setDurationError] = useState('');

  const [selectedExperienceId, setSelectedExperienceId] = useState<number | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);
  const [activeMenuId, setActiveMenuId] = useState<number | null>(null);

  const { showAlert } = useAlert();

  const saveMutation = useMutation({
    mutationFn: (payload: {
      job_title: string;
      employer_name: string;
      duration: string;
      description: string;
    }) => {
      if (editingExperienceId !== null) {
        return profileApi.updateExperience(editingExperienceId, payload);
      } else {
        return profileApi.addExperience(payload);
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
      showAlert('Error', 'Failed to save experience');
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
      showAlert('Error', 'Failed to delete experience');
    },
  });

  const handleCancel = () => {
    setJobTitle('');
    setEmployer('');
    setDurationVal('');
    setDurationUnit('Months');
    setDescription('');
    setIsAdding(false);
    setEditingExperienceId(null);
    setSelectedExperienceId(null);
    setJobTitleError('');
    setEmployerError('');
    setDurationError('');
  };

  const handleJobTitleChange = (text: string) => {
    setJobTitle(text);
    setJobTitleError('');
  };

  const handleEmployerChange = (text: string) => {
    setEmployer(text);
    setEmployerError('');
  };

  const handleDurationChange = (text: string) => {
    setDurationVal(text);
    setDurationError('');
  };

  const handleCardPress = (id: number) => {
    setSelectedExperienceId(selectedExperienceId === id ? null : id);
  };

  const handleEditPress = (exp: any) => {
    setJobTitle(exp.job_title);
    setEmployer(exp.employer_name || '');

    const durStr = exp.duration || '';
    const match = durStr
      .trim()
      .match(/^(\d+)\s*(Days|Weeks|Months|Years|Day|Week|Month|Year)(s)?$/i);
    if (match) {
      setDurationVal(match[1]);
      let unit = match[2];
      if (!unit.endsWith('s')) {
        unit = unit + 's';
      }
      const normalizedUnit = unit.charAt(0).toUpperCase() + unit.slice(1).toLowerCase();
      setDurationUnit(normalizedUnit);
    } else {
      setDurationVal(durStr);
      setDurationUnit('Months');
    }

    setDescription(exp.description || '');
    setEditingExperienceId(exp.id);
    setIsAdding(true);
  };

  const handleDeleteExperience = (id: number) => {
    setSelectedExperienceId(id);
    showAlert('Delete Work History', 'Are you sure you want to delete this experience?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
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
            {editingExperienceId !== null ? (
              <>
                Edit <Text style={styles.titleAccent}>job</Text>
                {'\n'}details.
              </>
            ) : showForm ? (
              <>
                Add a <Text style={styles.titleAccent}>recent</Text>
                {'\n'}job.
              </>
            ) : (
              <>
                Your <Text style={styles.titleAccent}>work</Text>
                {'\n'}history.
              </>
            )}
          </Text>
          <Text style={styles.subtitle}>
            {editingExperienceId !== null
              ? 'Update the details of your previous job.'
              : showForm
                ? 'You can add more later.'
                : `${experiences.length} experience${experiences.length > 1 ? 's' : ''} added.`}
          </Text>

          {/* Added job history list (shown above form, if any exist) */}
          {experiences.length > 0 && (
            <View style={styles.listContainer}>
              <Text style={styles.sectionHeader}>Added Jobs ({experiences.length})</Text>
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
                          <Text style={styles.menuItemText}>Edit</Text>
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
                          <Text style={[styles.menuItemText, { color: colors.error }]}>Delete</Text>
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
                {editingExperienceId !== null ? 'Edit Job' : 'Add New Job'}
              </Text>
              <CustomInput
                label="Job title"
                value={jobTitle}
                onChangeText={handleJobTitleChange}
                placeholder="E.g. Tile setter"
                icon="briefcase-outline"
                maxLength={85}
                error={jobTitleError}
                status={jobTitleError ? 'invalid' : null}
              />
              <Text style={styles.inputLimitHelper}>{jobTitle.length}/85 characters</Text>

              <CustomInput
                label="Employer or project"
                value={employer}
                onChangeText={handleEmployerChange}
                placeholder="E.g. Reyes household renovation"
                icon="business-outline"
                maxLength={85}
                error={employerError}
                status={employerError ? 'invalid' : null}
              />
              <Text style={styles.inputLimitHelper}>{employer.length}/85 characters</Text>

              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <CustomInput
                    label="Duration"
                    value={durationVal}
                    onChangeText={handleDurationChange}
                    placeholder="E.g. 3"
                    keyboardType="numeric"
                    icon="calendar-outline"
                    error={durationError}
                    status={durationError ? 'invalid' : null}
                  />
                </View>
                <View style={{ flex: 1.5 }}>
                  <Text style={styles.inputLabel}>Unit</Text>
                  <View style={styles.unitSelector}>
                    {DURATION_UNITS.map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        style={[styles.unitBtn, durationUnit === unit && styles.unitBtnActive]}
                        onPress={() => setDurationUnit(unit)}
                      >
                        <Text
                          style={[
                            styles.unitBtnText,
                            durationUnit === unit && styles.unitBtnTextActive,
                          ]}
                        >
                          {unit}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </View>

              <View>
                <CustomInput
                  label="Description (optional)"
                  value={description}
                  onChangeText={setDescription}
                  placeholder="What did you do?"
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
              <Text style={styles.addTitle}>Add another job</Text>
            </TouchableOpacity>
          )}
        </KeyboardAwareScrollView>

        <View style={styles.bottomBar}>
          {showForm ? (
            <View style={{ flexDirection: 'row', gap: 12 }}>
              {experiences.length > 0 && (
                <Button
                  label="Cancel"
                  size="lg"
                  variant="outline"
                  onPress={handleCancel}
                  style={{ flex: 1 }}
                />
              )}
              <Button
                label={
                  saveMutation.isPending
                    ? 'Saving...'
                    : editingExperienceId !== null
                      ? 'Save changes'
                      : 'Save job'
                }
                size="lg"
                style={{ flex: experiences.length > 0 ? 2 : 1 }}
                loading={saveMutation.isPending}
                onPress={() => {
                  const errors: Record<string, string> = {};
                  if (!jobTitle.trim()) {
                    errors.jobTitle = 'Job title is required';
                  } else if (jobTitle.length > 85) {
                    errors.jobTitle = 'Job title cannot exceed 85 characters';
                  }

                  if (!employer.trim()) {
                    errors.employer = 'Employer name is required';
                  } else if (employer.length > 85) {
                    errors.employer = 'Employer name cannot exceed 85 characters';
                  }

                  if (!durationVal.trim()) {
                    errors.duration = 'Duration is required';
                  } else {
                    const parsed = Number(durationVal);
                    if (isNaN(parsed) || parsed <= 0) {
                      errors.duration = 'Duration must be a positive number';
                    }
                  }

                  if (Object.keys(errors).length > 0) {
                    setJobTitleError(errors.jobTitle || '');
                    setEmployerError(errors.employer || '');
                    setDurationError(errors.duration || '');
                    return;
                  }

                  saveMutation.mutate({
                    job_title: jobTitle,
                    employer_name: employer,
                    duration: `${durationVal} ${durationUnit}`,
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
              label="Done"
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
    backgroundColor: colors.peach,
    borderWidth: 2,
    borderColor: colors.peachBright,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  addTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primaryDark,
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
});

export default AddWorkHistoryScreen;
