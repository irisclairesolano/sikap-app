import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import Button from '../../components/common/Button';

const SUGGESTED_SKILLS = [
  'Electrical', 'Welding', 'Tile setting', 'Cooking', 'Childcare', 
  'Laundry', 'Gardening', 'Driving', 'Cleaning', 'Carpentry', 'Masonry', 'Painting', 'Plumbing'
];

export const AddSkillsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const getSkillIcon = (skill: string) => {
    switch(skill) {
      case 'Carpentry': return 'hammer';
      case 'Masonry': return 'construct';
      case 'Painting': return 'brush';
      case 'Plumbing': return 'water';
      default: return 'checkmark-circle-outline';
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

        <Text style={styles.sectionHeaderPrimary}>Selected · {selectedSkills.length}</Text>
        <View style={styles.chipContainer}>
          {selectedSkills.map(skill => (
            <TouchableOpacity 
              key={skill} 
              style={[styles.chip, styles.chipSelected]}
              onPress={() => toggleSkill(skill)}
            >
              <Ionicons name={getSkillIcon(skill) as any} size={14} color={colors.primaryDark} style={{ marginRight: 4 }} />
              <Text style={styles.chipTextSelected}>{skill}</Text>
              <Ionicons name="close" size={14} color={colors.primaryDark} style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
          {selectedSkills.length === 0 && (
            <Text style={styles.emptyText}>No skills selected yet.</Text>
          )}
        </View>

        <Text style={styles.sectionHeader}>Suggested</Text>
        <View style={styles.chipContainer}>
          {SUGGESTED_SKILLS.filter(s => !selectedSkills.includes(s)).map(skill => (
            <TouchableOpacity 
              key={skill} 
              style={styles.chip}
              onPress={() => toggleSkill(skill)}
            >
              <Text style={styles.chipText}>+ {skill}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <Button 
          label="Save skills" 
          size="lg"
          fullWidth 
          onPress={() => navigation.goBack()}
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
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.8,
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
    borderWidth: 1,
    borderColor: 'transparent',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  chipSelected: {
    backgroundColor: colors.peach,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  chipTextSelected: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primaryDark,
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
});

export default AddSkillsScreen;
