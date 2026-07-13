import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { colors, fonts, shadows } from '../../theme';
import { Button } from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { notifyAuthChanged } from '../../store/authEvents';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { Skill } from '../../types';

export const RoleOnboardingScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { targetRole } = route.params;
  const { onboardRole, isOnboardingRole, user } = useAuth();
  const { showAlert } = useAlert();

  const [selectedBusinessDocs, setSelectedBusinessDocs] = useState<any[]>([]);
  const [selectedSkills, setSelectedSkills] = useState<number[]>([]);
  const MAX_SIZE_MB = 5;

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
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Almost There</Text>
        </View>
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
        )}

        {targetRole === 'worker' && (
          <View style={styles.skillsContainer}>
            {skills.map((skill) => {
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
        )}

      </ScrollView>

      <View style={styles.footer}>
        <Button
          label="Complete Setup"
          onPress={handleComplete}
          isLoading={isOnboardingRole}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
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
    backgroundColor: colors.mint,
    borderColor: colors.mint,
  },
  skillText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.ink,
  },
  skillTextSelected: {
    color: colors.paperBright,
    fontFamily: fonts.bodyBold,
  },
  footer: {
    padding: 24,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
});

export default RoleOnboardingScreen;
