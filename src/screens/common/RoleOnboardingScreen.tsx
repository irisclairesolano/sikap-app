import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { notifyAuthChanged } from '../../store/authEvents';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Skill } from '../../types';
import Input from '../../components/common/Input';
import { skillsApi } from '../../api/skills';

export const RoleOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetRole } = route.params;
  const { onboardRole, isOnboardingRole, user, switchRole } = useAuth();
  const { showAlert } = useAlert();

  const handleCancel = async () => {
    showAlert(
      'Cancel Setup?',
      `Are you sure you want to cancel setup? This will switch your role back to ${user?.role === 'worker' ? 'Employer' : 'Worker'} Mode.`,
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Switch Back',
          style: 'destructive',
          onPress: async () => {
            try {
              await switchRole();
            } catch (e) {
              showAlert('Error', 'Failed to switch roles.');
            }
          },
        },
      ],
    );
  };

  const handleBackPress = () => {
    if (targetRole === 'employer') {
      showAlert(
        'Skip Document Upload?',
        'You can upload your business documents later in Settings. Would you like to skip this step for now?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Skip & Continue',
            onPress: async () => {
              try {
                await onboardRole({ targetRole, data: {} });
                notifyAuthChanged();
              } catch (error: any) {
                showAlert('Error', error.message || 'Failed to skip onboarding');
              }
            },
          },
        ],
      );
    } else {
      handleCancel();
    }
  };

  const [selectedBusinessDocs, setSelectedBusinessDocs] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkillError, setCustomSkillError] = useState('');
  const [customSkillsList, setCustomSkillsList] = useState<Skill[]>([]);
  const MAX_SIZE_MB = 5;

  const createSkillMutation = useMutation({
    mutationFn: (name: string) => skillsApi.createSkill(name),
    onSuccess: (newSkill) => {
      // Handled optimistically, success will swap the temp ID in handleAddCustomSkill callbacks
    },
    onError: (err: any) => {
      console.error('Failed to create skill', err);
    },
  });

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;

    const existing =
      skills.find((s) => s.name.toLowerCase() === trimmed.toLowerCase()) ||
      customSkillsList.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());

    if (existing) {
      if (!selectedSkills.includes(existing.id)) {
        setSelectedSkills((prev) => [...prev, existing.id]);
      }
      setCustomSkill('');
      return;
    }

    const tempId = -Date.now();
    const tempSkill: Skill = { id: tempId, name: trimmed };

    // Optimistically add to lists
    setCustomSkillsList((prev) => [...prev, tempSkill]);
    setSelectedSkills((prev) => [...prev, tempId]);
    setCustomSkill('');
    setCustomSkillError('');

    createSkillMutation.mutate(trimmed, {
      onSuccess: (newSkill) => {
        if (newSkill && newSkill.id) {
          setCustomSkillsList((prev) => prev.map((s) => (s.id === tempId ? newSkill : s)));
          setSelectedSkills((prev) => prev.map((id) => (id === tempId ? newSkill.id : id)));
        }
      },
      onError: (err: any) => {
        setCustomSkillsList((prev) => prev.filter((s) => s.id !== tempId));
        setSelectedSkills((prev) => prev.filter((id) => id !== tempId));
        setCustomSkillError(err.message || 'Failed to add custom skill');
      },
    });
  };

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      if (targetRole !== 'worker') return [];
      const res = await apiClient<Skill[]>('/skills');
      return Array.isArray(res) ? res : [];
    },
    enabled: targetRole === 'worker',
  });

  const handleFileSelect = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!pick.canceled && pick.assets) {
        if (pick.assets.length > 3) {
          showAlert('Too Many Files', 'You can only upload up to 3 business documents.');
          return;
        }

        let hasLargeFile = false;
        const validFiles = pick.assets.filter((asset) => {
          if (asset.size && asset.size > MAX_SIZE_MB * 1024 * 1024) {
            hasLargeFile = true;
            return false;
          }
          return true;
        });

        if (hasLargeFile) {
          showAlert('File Too Large', `One or more files exceed the ${MAX_SIZE_MB}MB limit.`);
        }

        setSelectedBusinessDocs(validFiles.slice(0, 3));
      }
    } catch (err) {
      console.log('Document picker error:', err);
    }
  };

  const handleToggleSkill = (skillId: number) => {
    setSelectedSkills((prev) =>
      prev.includes(skillId) ? prev.filter((id) => id !== skillId) : [...prev, skillId],
    );
  };

  const handleComplete = async () => {
    try {
      if (targetRole === 'worker') {
        if (selectedSkills.length === 0) {
          showAlert('Required', 'Please select at least one skill.');
          return;
        }
        await onboardRole({ targetRole, data: { skill_ids: selectedSkills } });
      } else {
        // employer
        const form = new FormData();
        if (selectedBusinessDocs.length > 0) {
          selectedBusinessDocs.forEach((doc, index) => {
            form.append('business_documents[]', {
              uri: doc.uri,
              name: doc.name ?? `business-doc-${index}.pdf`,
              type: doc.mimeType ?? 'application/pdf',
            } as unknown as Blob);
          });
        }
        await onboardRole({ targetRole, data: form });
      }

      notifyAuthChanged();
    } catch (error: any) {
      showAlert('Error', error.message || 'Failed to complete onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleBackPress}
          disabled={isOnboardingRole}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Almost There</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.contentHeader}>
          <Text style={styles.title}>
            {targetRole === 'employer' ? 'Employer Verification' : 'Your Skills'}
          </Text>
          <Text style={styles.subtitle}>
            {targetRole === 'employer'
              ? 'Please provide your business documents so we can verify your employer status.'
              : 'What are you good at? Select the skills that match your expertise.'}
          </Text>
        </View>
        {targetRole === 'employer' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.uploadArea}
              onPress={handleFileSelect}
              disabled={isOnboardingRole}
            >
              <View style={styles.cameraIconBox}>
                <Ionicons name="document-text" size={24} color={colors.white} />
              </View>
              <Text style={styles.uploadTitle}>
                {selectedBusinessDocs.length > 0
                  ? `${selectedBusinessDocs.length} Document(s) Selected ✓`
                  : 'Upload Business Document (Optional)'}
              </Text>
              <Text style={styles.uploadSubtitle}>
                {selectedBusinessDocs.length > 0
                  ? selectedBusinessDocs.map((doc) => doc.name).join('\n')
                  : 'DTI / SEC / TIN Document (Max 3 files, PDF/Image)'}
              </Text>
            </TouchableOpacity>
          </View>
        )}{' '}
        {targetRole === 'worker' && (
          <View>
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionHeader}>Type a custom skill</Text>
              <View style={styles.customInputRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder="e.g. Wood Carving, Hilot Massage"
                    value={customSkill}
                    onChangeText={(text) => {
                      setCustomSkill(text);
                      setCustomSkillError('');
                    }}
                    error={customSkillError}
                  />
                </View>
                <TouchableOpacity
                  style={[styles.addButton, !customSkill.trim() && styles.addButtonDisabled]}
                  onPress={handleAddCustomSkill}
                  disabled={!customSkill.trim()}
                >
                  <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.skillsContainer}>
              {[...skills, ...customSkillsList].map((skill) => {
                const isSelected = selectedSkills.includes(skill.id);
                return (
                  <TouchableOpacity
                    key={skill.id}
                    style={[styles.skillChip, isSelected && styles.skillChipSelected]}
                    onPress={() => handleToggleSkill(skill.id)}
                  >
                    <Text style={[styles.skillText, isSelected && styles.skillTextSelected]}>
                      {skill.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label="Complete Setup" onPress={handleComplete} loading={isOnboardingRole} />
      </View>

      {isOnboardingRole && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {targetRole === 'employer'
              ? 'Uploading documents & completing setup...'
              : 'Saving your skills & completing setup...'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 24, paddingBottom: 40 },
  contentHeader: { marginBottom: 32 },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: colors.ink,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkLight,
    lineHeight: 22,
  },
  section: {
    marginBottom: 24,
  },
  uploadArea: {
    backgroundColor: colors.paperBright,
    borderWidth: 2,
    borderColor: colors.inkFaint,
    borderStyle: 'dashed',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
  },
  cameraIconBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.mint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    ...shadows.sm,
  },
  uploadTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkLight,
    textAlign: 'center',
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  skillChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: colors.paperBright,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  skillChipSelected: {
    backgroundColor: colors.inkFaint,
    borderColor: colors.inkMuted,
  },
  skillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  skillTextSelected: {
    color: colors.inkSoft,
    fontFamily: fonts.bodyBold,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 8,
  },
  customInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 4,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  addButtonDisabled: {
    backgroundColor: colors.inkFaint,
    opacity: 0.5,
  },
  addButtonText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default RoleOnboardingScreen;
