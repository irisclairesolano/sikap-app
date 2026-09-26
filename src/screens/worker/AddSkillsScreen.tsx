import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { skillsApi, Skill } from '../../api/skills';
import { profileApi } from '../../api/profile';
import { useAuthCheck } from '../../hooks/useAuthCheck';

export const AddSkillsScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const { user } = useAuthCheck();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const [selectedSkills, setSelectedSkills] = useState<Skill[]>([]);
  const [customSkills, setCustomSkills] = useState<string[]>([]);
  const [customSkill, setCustomSkill] = useState('');
  const [customSkillError, setCustomSkillError] = useState('');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (user?.worker_profile?.skills) {
      setSelectedSkills(user.worker_profile.skills);
    }
    if (
      (user?.worker_profile as any)?.custom_skills &&
      Array.isArray((user?.worker_profile as any).custom_skills)
    ) {
      setCustomSkills((user?.worker_profile as any).custom_skills);
    }
  }, [user]);

  const { data: skills = [] } = useQuery({
    queryKey: ['skills'],
    queryFn: skillsApi.getSkills,
    staleTime: 24 * 60 * 60 * 1000, // 24 hours (rarely changes)
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      profileApi.addSkills(
        selectedSkills.map((s) => s.id),
        customSkills,
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      navigation.goBack();
    },
    onError: (err: any) => {
      console.error('Failed to save skills', err);
      setSaveError(err.message || 'Failed to save skills');
    },
  });

  const handleAddCustomSkill = () => {
    const trimmed = customSkill.trim();
    if (!trimmed) return;

    // Check if matches suggested catalog
    const existingCatalog = skills.find((s) => s.name.toLowerCase() === trimmed.toLowerCase());
    if (existingCatalog) {
      if (!selectedSkills.find((s) => s.id === existingCatalog.id)) {
        setSelectedSkills([...selectedSkills, existingCatalog]);
        setCustomSkill('');
        setCustomSkillError('');
        setSaveError('');
      } else {
        setCustomSkillError('This skill is already in your selected list.');
      }
      return;
    }

    // Check if already in custom skills
    if (customSkills.some((cs) => cs.toLowerCase() === trimmed.toLowerCase())) {
      setCustomSkillError('This custom skill is already in your list.');
      return;
    }

    // Add to private custom skills list
    setCustomSkills([...customSkills, trimmed]);
    setCustomSkill('');
    setCustomSkillError('');
    setSaveError('');
  };

  const handleRemoveCustomSkill = (nameToRemove: string) => {
    setCustomSkills(customSkills.filter((s) => s !== nameToRemove));
  };

  const toggleSkill = (skill: Skill) => {
    setSaveError('');
    if (selectedSkills.find((s) => s.id === skill.id)) {
      setSelectedSkills(selectedSkills.filter((s) => s.id !== skill.id));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const getSkillIcon = (skillName: string) => {
    switch (skillName) {
      case 'Carpentry':
        return 'hammer';
      case 'Masonry':
        return 'construct';
      case 'Painting':
        return 'brush';
      case 'Plumbing':
        return 'water';
      default:
        return 'checkmark-circle-outline';
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.appBarBadge}>
          <Text style={styles.appBarBadgeText}>Your skills</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>
          Tell employers what{'\n'}you <Text style={styles.titleAccent}>do best.</Text>
        </Text>
        <Text style={styles.subtitle}>Choose all that apply.</Text>

        <Text style={styles.sectionHeader}>Custom Skill</Text>
        <View style={styles.customInputRow}>
          <View style={{ flex: 1 }}>
            <Input
              placeholder="Type custom skill e.g., Wood Carver"
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

        <Text style={styles.sectionHeaderPrimary}>
          Selected · {selectedSkills.length + customSkills.length}
        </Text>
        <View style={styles.chipContainer}>
          {selectedSkills.map((skill) => (
            <TouchableOpacity
              key={skill.id}
              style={[styles.chip, styles.chipSelected]}
              onPress={() => toggleSkill(skill)}
            >
              <Ionicons
                name={getSkillIcon(skill.name) as any}
                size={14}
                color={colors.primaryDark}
                style={{ marginRight: 4 }}
              />
              <Text style={styles.chipTextSelected}>{skill.name}</Text>
              <Ionicons
                name="close"
                size={14}
                color={colors.primaryDark}
                style={{ marginLeft: 4 }}
              />
            </TouchableOpacity>
          ))}
          {customSkills.map((cSkill, idx) => (
            <TouchableOpacity
              key={`custom-${idx}-${cSkill}`}
              style={[
                styles.chip,
                styles.chipSelected,
                { borderColor: colors.primary, backgroundColor: colors.paperBright },
              ]}
              onPress={() => handleRemoveCustomSkill(cSkill)}
            >
              <Ionicons
                name="sparkles-outline"
                size={13}
                color={colors.primary}
                style={{ marginRight: 4 }}
              />
              <Text style={[styles.chipTextSelected, { color: colors.primaryDark }]}>{cSkill}</Text>
              <View
                style={{
                  backgroundColor: colors.primaryTint,
                  paddingHorizontal: 5,
                  paddingVertical: 1,
                  borderRadius: 6,
                  marginHorizontal: 4,
                }}
              >
                <Text style={{ fontSize: 9, fontFamily: fonts.bodyBold, color: colors.primary }}>
                  Custom
                </Text>
              </View>
              <Ionicons name="close" size={14} color={colors.primaryDark} />
            </TouchableOpacity>
          ))}
          {selectedSkills.length === 0 && customSkills.length === 0 && (
            <Text style={styles.emptyText}>No skills selected yet.</Text>
          )}
        </View>

        <Text style={styles.sectionHeader}>Suggested</Text>
        <View style={styles.chipContainer}>
          {skills
            .filter((s) => !selectedSkills.find((selected) => selected.id === s.id))
            .map((skill) => (
              <TouchableOpacity
                key={skill.id}
                style={styles.chip}
                onPress={() => toggleSkill(skill)}
              >
                <Text style={styles.chipText}>+ {skill.name}</Text>
              </TouchableOpacity>
            ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        {saveError ? (
          <Text
            style={{
              color: colors.error,
              fontFamily: fonts.body,
              fontSize: 13,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            {saveError}
          </Text>
        ) : null}
        <Button
          label={saveMutation.isPending ? 'Saving...' : 'Next'}
          size="lg"
          fullWidth
          loading={saveMutation.isPending}
          onPress={() => {
            if (selectedSkills.length === 0 && customSkills.length === 0) {
              setSaveError('Please select or add at least one skill to continue.');
              return;
            }
            saveMutation.mutate();
          }}
        />
      </View>
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
  sectionHeaderPrimary: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
  },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 32,
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 100,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: colors.inkFaint,
    borderWidth: 1,
    borderColor: colors.inkMuted,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextSelected: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  emptyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: colors.paper,
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
});

export default AddSkillsScreen;
