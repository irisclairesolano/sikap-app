import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  BackHandler,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { appendFileToFormData } from '../../utils/formData';
import { useLanguage } from '../../contexts/LanguageContext';

export const RoleOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetRole } = route.params;
  const { onboardRole, isOnboardingRole, user, switchRole } = useAuth();
  const { showAlert } = useAlert();
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();

  const [isCancelling, setIsCancelling] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  // For workers, back is only permitted if switching roles from an existing employer account.
  // During initial registration onboarding, skills selection is mandatory and there is no alternate role.
  const hasEmployerProfile =
    !!user?.has_employer_profile || !!user?.employer_profile || !!(user as any)?.employerProfile;
  const hasWorkerProfile =
    !!user?.has_worker_profile || !!user?.worker_profile || !!(user as any)?.workerProfile;

  const canGoBackOrCancel = targetRole === 'worker' ? hasEmployerProfile : true;

  const handleCancel = async () => {
    if (!canGoBackOrCancel) return;
    const isTargetWorker = targetRole === 'worker';
    const previousRole = isTargetWorker ? 'Employer' : 'Worker';

    showAlert(
      t('onboarding_cancel_setup_title'),
      t('onboarding_cancel_setup_msg', { previousRole }),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('onboarding_yes_switch_back_btn'),
          style: 'destructive',
          onPress: async () => {
            try {
              setIsCancelling(true);
              await switchRole();
              notifyAuthChanged();
            } catch (e: any) {
              showAlert('Error', e?.message || 'Failed to switch roles.');
            } finally {
              setIsCancelling(false);
            }
          },
        },
      ],
    );
  };

  const handleBackPress = () => {
    if (!canGoBackOrCancel) return;

    if (targetRole === 'employer') {
      if (hasWorkerProfile) {
        showAlert(
          t('onboarding_cancel_setup_title'),
          t('onboarding_cancel_setup_msg', { previousRole: 'Worker' }),
          [
            { text: t('cancel'), style: 'cancel' },
            {
              text: t('onboarding_yes_switch_back_btn'),
              style: 'destructive',
              onPress: handleCancel,
            },
            {
              text: t('onboarding_skip_and_continue_btn'),
              onPress: async () => {
                try {
                  setIsSkipping(true);
                  await onboardRole({ targetRole, data: {} });
                  notifyAuthChanged();
                } catch (error: any) {
                  showAlert('Error', error.message || 'Failed to skip onboarding');
                } finally {
                  setIsSkipping(false);
                }
              },
            },
          ],
        );
      } else {
        showAlert(t('onboarding_skip_doc_upload_title'), t('onboarding_skip_doc_upload_msg'), [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('onboarding_skip_and_continue_btn'),
            onPress: async () => {
              try {
                setIsSkipping(true);
                await onboardRole({ targetRole, data: {} });
                notifyAuthChanged();
              } catch (error: any) {
                showAlert('Error', error.message || 'Failed to skip onboarding');
              } finally {
                setIsSkipping(false);
              }
            },
          },
        ]);
      }
    } else {
      handleCancel();
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      if (!canGoBackOrCancel) {
        // Prevent accidental hardware back button on Android during initial mandatory onboarding
        return true;
      }
      handleBackPress();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [canGoBackOrCancel]);

  const [selectedBusinessDocs, setSelectedBusinessDocs] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkillError, setCustomSkillError] = useState('');
  const [customSkillsList, setCustomSkillsList] = useState<Skill[]>([]);
  const MAX_SIZE_MB = 5;

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

    setCustomSkillsList((prev) => [...prev, tempSkill]);
    setSelectedSkills((prev) => [...prev, tempId]);
    setCustomSkill('');
    setCustomSkillError('');
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
          showAlert(t('onboarding_too_many_files_title'), t('onboarding_too_many_files_msg'));
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
          showAlert(t('onboarding_file_too_large_title'), t('onboarding_file_too_large_msg'));
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
        const validSkillIds = selectedSkills.filter((id) => id > 0);
        const customNames = customSkillsList
          .filter((s) => selectedSkills.includes(s.id))
          .map((s) => s.name);

        if (validSkillIds.length === 0 && customNames.length === 0) {
          showAlert(t('onboarding_skill_required_title'), t('onboarding_skill_required_msg'));
          return;
        }

        await onboardRole({
          targetRole,
          data: {
            skill_ids: validSkillIds,
            custom_skills: customNames,
          },
        });
      } else {
        // employer
        if (selectedBusinessDocs.length > 0) {
          const form = new FormData();
          for (let index = 0; index < selectedBusinessDocs.length; index++) {
            const doc = selectedBusinessDocs[index];
            const fileName = doc.name ?? `business-doc-${index}.pdf`;
            const ext = fileName.split('.').pop()?.toLowerCase();
            let mimeType = doc.mimeType || doc.type;
            if (!mimeType || mimeType === 'unknown' || mimeType === '*/*') {
              if (ext === 'png') mimeType = 'image/png';
              else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
              else mimeType = 'application/pdf';
            }
            await appendFileToFormData(form, 'business_documents[]', doc.uri, fileName, mimeType);
          }
          await onboardRole({ targetRole, data: form });
        } else {
          // If no documents were selected, send plain JSON payload so no multipart overhead occurs
          await onboardRole({ targetRole, data: {} });
        }
      }

      notifyAuthChanged();
    } catch (error: any) {
      showAlert('Error', error?.message || 'Failed to complete onboarding');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.header}>
        {canGoBackOrCancel ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={handleBackPress}
            disabled={isOnboardingRole}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('onboarding_header_pill')}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.contentHeader}>
          <Text style={styles.title}>
            {targetRole === 'employer'
              ? t('onboarding_employer_title')
              : t('onboarding_worker_title')}
          </Text>
          <Text style={styles.subtitle}>
            {targetRole === 'employer'
              ? t('onboarding_employer_subtitle')
              : t('onboarding_worker_subtitle')}
          </Text>
        </View>
        {targetRole === 'employer' && (
          <View style={styles.section}>
            <TouchableOpacity
              style={[
                styles.uploadArea,
                selectedBusinessDocs.length > 0 && styles.uploadAreaSelected,
              ]}
              onPress={handleFileSelect}
              disabled={isOnboardingRole}
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.cameraIconBox,
                  selectedBusinessDocs.length > 0 && styles.cameraIconBoxSelected,
                ]}
              >
                <Ionicons
                  name={selectedBusinessDocs.length > 0 ? 'checkmark-circle' : 'document-text'}
                  size={26}
                  color={colors.white}
                />
              </View>
              <Text
                style={[
                  styles.uploadTitle,
                  selectedBusinessDocs.length > 0 && styles.uploadTitleSelected,
                ]}
              >
                {selectedBusinessDocs.length > 0
                  ? t('onboarding_docs_selected', { count: selectedBusinessDocs.length })
                  : t('onboarding_upload_doc_title')}
              </Text>
              {selectedBusinessDocs.length > 0 ? (
                <View style={{ width: '100%', marginTop: 12, gap: 8 }}>
                  {selectedBusinessDocs.map((doc, idx) => (
                    <View
                      key={idx}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: colors.white,
                        paddingVertical: 8,
                        paddingHorizontal: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: '#BBF7D0',
                      }}
                    >
                      <Ionicons
                        name="document-attach"
                        size={18}
                        color={colors.success}
                        style={{ marginRight: 8 }}
                      />
                      <Text
                        numberOfLines={1}
                        style={{
                          fontFamily: fonts.bodyMedium,
                          fontSize: 12,
                          color: colors.inkSoft,
                          flex: 1,
                        }}
                      >
                        {doc.name}
                      </Text>
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          setSelectedBusinessDocs((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        style={{ marginLeft: 8 }}
                      >
                        <Ionicons name="close-circle" size={18} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  ))}
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      fontSize: 11,
                      color: colors.success,
                      textAlign: 'center',
                      marginTop: 4,
                    }}
                  >
                    {t('onboarding_tap_to_change_docs')}
                  </Text>
                </View>
              ) : (
                <Text style={styles.uploadSubtitle}>{t('onboarding_upload_doc_subtitle')}</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
        {targetRole === 'worker' && (
          <View>
            <View style={{ marginBottom: 20 }}>
              <Text style={styles.sectionHeader}>{t('onboarding_custom_skill_header')}</Text>
              <View style={styles.customInputRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    placeholder={t('onboarding_custom_skill_placeholder')}
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
                  <Text style={styles.addButtonText}>{t('onboarding_add_skill_btn')}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.skillsContainer}>
              {[...skills, ...customSkillsList]
                .sort((a, b) => {
                  const aSelected = selectedSkills.includes(a.id);
                  const bSelected = selectedSkills.includes(b.id);
                  if (aSelected && !bSelected) return -1;
                  if (!aSelected && bSelected) return 1;
                  return 0;
                })
                .map((skill) => {
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

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label={t('onboarding_complete_setup_btn')}
          onPress={handleComplete}
          loading={isOnboardingRole}
        />
        {targetRole === 'employer' && (
          <Button
            label={t('onboarding_skip_for_now_btn')}
            variant="ghost"
            onPress={handleBackPress}
            disabled={isOnboardingRole}
            style={{ marginTop: 4 }}
          />
        )}
      </View>

      {(isOnboardingRole || isSkipping || isCancelling) && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            {isCancelling
              ? t('onboarding_completing_loading')
              : isSkipping
                ? t('onboarding_completing_loading')
                : targetRole === 'employer'
                  ? selectedBusinessDocs.length > 0
                    ? t('onboarding_uploading_docs_loading')
                    : t('onboarding_completing_loading')
                  : t('onboarding_saving_skills_loading')}
          </Text>
        </View>
      )}
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
    fontFamily: fonts.display,
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
  uploadAreaSelected: {
    backgroundColor: '#F0FDF4',
    borderColor: colors.success,
    borderStyle: 'solid',
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
  cameraIconBoxSelected: {
    backgroundColor: colors.success,
  },
  uploadTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  uploadTitleSelected: {
    color: colors.success,
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
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    gap: 8,
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
    ...StyleSheet.absoluteFill,
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
