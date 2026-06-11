import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useAuth } from '../../hooks/useAuth';

export const HomeEmptyScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const { user } = useAuth();

  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : 'M';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitial(user?.name || 'Worker')}</Text>
            </View>
            <View>
              <Text style={styles.greetingSmall}>Hi,</Text>
              <Text style={styles.greetingName}>{user?.name ? user.name.split(' ')[0] : 'Worker'}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Progress Card */}
        <View style={styles.progressCard}>
          <Text style={styles.welcomeText}>WELCOME TO SIKAP</Text>
          <Text style={styles.progressHeadline}>
            Your profile is{'\n'}<Text style={styles.progressAccent}>20% complete.</Text>
          </Text>
          <View style={styles.progressBarBg}>
            <View style={styles.progressBarFill} />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Finish setting up</Text>

        <View style={styles.tasksContainer}>
          
          {/* Account Verified */}
          <View style={styles.taskCard}>
            <View style={[styles.taskIconBox, { backgroundColor: colors.mint }]}>
              <Ionicons name="checkmark" size={16} color={colors.mintDeep} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Account verified</Text>
              <Text style={styles.taskSubtitle}>Just now</Text>
            </View>
          </View>

          {/* Add Skills (Active) */}
          <TouchableOpacity 
            style={[styles.taskCard, styles.activeTaskCard]}
            onPress={() => navigation.navigate('AddSkills')}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconBox, { backgroundColor: colors.peach }]}>
              <Ionicons name="construct" size={16} color={colors.primary} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Add your skills</Text>
              <Text style={styles.taskSubtitle}>Tell employers what you do</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.primary} />
          </TouchableOpacity>

          {/* Add Work History */}
          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => navigation.navigate('AddWorkHistory')}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconBox, { backgroundColor: colors.paperCream }]}>
              <Ionicons name="briefcase-outline" size={16} color={colors.inkMuted} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Add work history</Text>
              <Text style={styles.taskSubtitle}>Optional but recommended</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
          </TouchableOpacity>

          {/* Add Character References */}
          <TouchableOpacity 
            style={styles.taskCard}
            onPress={() => navigation.navigate('AddCharacterReferences')}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconBox, { backgroundColor: colors.paperCream }]}>
              <Ionicons name="people-outline" size={16} color={colors.inkMuted} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Add character references</Text>
              <Text style={styles.taskSubtitle}>Up to 3 people who can vouch</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
          </TouchableOpacity>

        </View>

        {/* Temporary jump to JobFeed */}
        <TouchableOpacity 
          style={{ marginTop: 24, alignSelf: 'center' }}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={{ fontFamily: fonts.bodyBold, color: colors.primary }}>Skip to Jobs</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  appBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  greetingSmall: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  greetingName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  progressCard: {
    backgroundColor: colors.primary, // gradient placeholder
    borderRadius: 20,
    padding: 24,
    marginTop: 8,
  },
  welcomeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.5,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 8,
  },
  progressHeadline: {
    fontFamily: fonts.display,
    fontSize: 26,
    lineHeight: 30,
    color: colors.white,
    letterSpacing: -0.5,
  },
  progressAccent: {
    fontFamily: fonts.displayItalic,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 3,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBarFill: {
    width: '20%',
    height: '100%',
    backgroundColor: colors.white,
    borderRadius: 3,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  tasksContainer: {
    gap: 10,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  activeTaskCard: {
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  taskIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  taskTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  taskSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
});

export default HomeEmptyScreen;
