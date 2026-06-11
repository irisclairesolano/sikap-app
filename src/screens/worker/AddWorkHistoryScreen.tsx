import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import CustomInput from '../../components/common/Input';
import Button from '../../components/common/Button';

export const AddWorkHistoryScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  
  const [jobTitle, setJobTitle] = useState('');
  const [employer, setEmployer] = useState('');
  const [duration, setDuration] = useState('');
  const [description, setDescription] = useState('');

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.appBarBadge}>
            <Text style={styles.appBarBadgeText}>Work experience</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>
            Add a <Text style={styles.titleAccent}>recent</Text>{'\n'}job.
          </Text>
          <Text style={styles.subtitle}>You can add more later.</Text>

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
            <CustomInput
              label="How long?"
              value={duration}
              onChangeText={setDuration}
              placeholder="E.g. 2 weeks · January 2026"
              icon="calendar-outline"
            />
            <CustomInput
              label="Description (optional)"
              value={description}
              onChangeText={setDescription}
              placeholder="What did you do?"
              multiline
              icon="document-text-outline"
            />
          </View>
        </ScrollView>

        <View style={styles.bottomBar}>
          <Button 
            label="Save work history" 
            size="lg"
            fullWidth 
            onPress={() => navigation.goBack()}
            disabled={!jobTitle || !employer || !duration}
          />
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
  formContainer: {
    marginTop: 32,
    gap: 16,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: colors.paper,
  },
});

export default AddWorkHistoryScreen;
