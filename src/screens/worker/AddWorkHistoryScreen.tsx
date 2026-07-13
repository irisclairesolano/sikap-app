import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileApi } from '../../api/profile';
import Button from '../../components/common/Button';
import { DatePickerModal } from '../../components/common/DatePickerModal';
import CustomInput from '../../components/common/Input';
import { useAlert } from '../../contexts/AlertContext';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts } from '../../theme';

export const AddWorkHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const [isAdding, setIsAdding] = useState(false);
  const experiences = profile?.worker_profile?.experiences || [];

  const [jobTitle, setJobTitle] = useState('');
  const [employer, setEmployer] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');
  const [isDatePickerVisible, setIsDatePickerVisible] = useState(false);

  const [selectedExperienceId, setSelectedExperienceId] = useState<number | null>(null);
  const [editingExperienceId, setEditingExperienceId] = useState<number | null>(null);

  const { showAlert } = useAlert();

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        job_title: jobTitle,
        employer_name: employer,
        duration: duration,
        description: description,
      };
      if (editingExperienceId !== null) {
        return profileApi.updateExperience(editingExperienceId, payload);
      } else {
        return profileApi.addExperience(payload);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      handleCancel();
    },
    onError: (err) => {
      console.error('Failed to save work experience', err);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileApi.removeExperience(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setSelectedExperienceId(null);
    },
    onError: (err) => {
      console.error('Failed to delete work experience', err);
    },
  });

  const handleCancel = () => {
    setJobTitle('');
    setEmployer('');
    setDuration('');
    setDescription('');
    setIsAdding(false);
    setEditingExperienceId(null);
    setSelectedExperienceId(null);
  };

  const handleCardPress = (id: number) => {
    setSelectedExperienceId(selectedExperienceId === id ? null : id);
  };

  const handleEditPress = (exp: any) => {
    setJobTitle(exp.job_title);
    setEmployer(exp.employer_name || '');
    setDuration(exp.duration || '');
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
        onPress: () => deleteMutation.mutate(id)
      }
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

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
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
                : `${experiences.length} experience${experiences.length > 1 ? 's' : ''} added. Tap a card to edit or delete it.`}
          </Text>

          {!showForm && (
            <View style={styles.listContainer}>
              {experiences.map((exp) => {
                const isSelected = selectedExperienceId === exp.id;
                return (
                  <View key={exp.id} style={[styles.card, isSelected && styles.cardSelected]}>
                    <TouchableOpacity onPress={() => handleCardPress(exp.id)} activeOpacity={0.75}>
                      <View style={styles.cardMain}>
                        <View style={styles.cardIcon}>
                          <Ionicons
                            name="briefcase"
                            size={20}
                            color={isSelected ? colors.primaryDark : colors.inkMuted}
                          />
                        </View>
                        <View style={styles.cardContent}>
                          <Text style={styles.cardTitle}>{exp.job_title}</Text>
                          <Text style={styles.cardSubtitle}>{exp.employer_name}</Text>
                          <Text style={styles.cardMeta}>{exp.duration}</Text>
                          {exp.description ? (
                            <Text style={styles.cardDesc}>{exp.description}</Text>
                          ) : null}
                        </View>
                      </View>
                    </TouchableOpacity>

                    {isSelected && (
                      <View style={styles.actionRow}>
                        <TouchableOpacity
                          style={styles.actionButtonEdit}
                          onPress={() => handleEditPress(exp)}
                        >
                          <Ionicons name="create-outline" size={16} color={colors.primaryDark} />
                          <Text style={styles.actionTextEdit}>Edit</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.actionButtonDelete}
                          onPress={() => handleDeleteExperience(exp.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Ionicons name="trash-outline" size={16} color={colors.error} />
                          <Text style={styles.actionTextDelete}>
                            {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                );
              })}
              <TouchableOpacity style={styles.addButton} onPress={() => setIsAdding(true)}>
                <View style={styles.addIconCircle}>
                  <Ionicons name="add" size={22} color={colors.white} />
                </View>
                <Text style={styles.addTitle}>Add another job</Text>
              </TouchableOpacity>
            </View>
          )}

          {showForm && (
            <View style={styles.formContainer}>
              <CustomInput
                label="Job title"
                value={jobTitle}
                onChangeText={setJobTitle}
                placeholder="E.g. Tile setter"
                icon="briefcase-outline"
              />
              <CustomInput
                label="Employer or project"
                value={employer}
                onChangeText={setEmployer}
                placeholder="E.g. Reyes household renovation"
                icon="business-outline"
              />
              <TouchableOpacity onPress={() => setIsDatePickerVisible(true)}>
                <View pointerEvents="none">
                  <CustomInput
                    label="How long?"
                    value={duration}
                    onChangeText={setDuration}
                    placeholder="E.g. 2 weeks · January 2026"
                    icon="calendar-outline"
                    editable={false}
                  />
                </View>
              </TouchableOpacity>
              <CustomInput
                label="Description (optional)"
                value={description}
                onChangeText={setDescription}
                placeholder="What did you do?"
                multiline
                icon="document-text-outline"
              />
            </View>
          )}
        </ScrollView>

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
                onPress={() => saveMutation.mutate()}
                disabled={!jobTitle || !employer || !duration}
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

      {isDatePickerVisible && (
        <DatePickerModal
          visible={isDatePickerVisible}
          onClose={() => setIsDatePickerVisible(false)}
          onConfirm={(text) => setDuration(text)}
        />
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
  },
  cardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  cardMain: {
    flexDirection: 'row',
    gap: 14,
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
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  actionButtonEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.primarySoft,
  },
  actionButtonDelete: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.error + '40',
  },
  actionTextEdit: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
  actionTextDelete: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.error,
  },
  cardDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 6,
    lineHeight: 18,
  },
});

export default AddWorkHistoryScreen;
