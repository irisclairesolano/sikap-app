import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery } from '@tanstack/react-query';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profile';

export const HomeEmptyScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const { user } = useAuth();
  const isFocused = useIsFocused();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
    enabled: isFocused,
  });

  const getInitial = (name?: string) => name ? name.charAt(0).toUpperCase() : 'M';

  // Calculate progress
  const hasSkills = (profile?.worker_profile?.skills?.length || 0) > 0;
  const hasHistory = (profile?.worker_profile?.experiences?.length || 0) > 0;
  const hasRefs = (profile?.worker_profile?.character_references?.length || 0) > 0;

  let progressCount = 1; // Account verified
  if (hasSkills) progressCount++;
  if (hasHistory) progressCount++;
  if (hasRefs) progressCount++;

  const progressPercent = Math.round((progressCount / 4) * 100);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.appBar}>
          <View style={styles.appBarLeft}>
            <View style={styles.avatar}>
              {user?.avatar_url ? (
                <Image 
                  source={{ uri: user.avatar_url.startsWith('http') ? user.avatar_url : `${process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar_url}` }} 
                  style={styles.avatarImage} 
                />
              ) : (
                <Text style={styles.avatarText}>{getInitial(user?.name || 'Worker')}</Text>
              )}
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
            Your profile is{'\n'}<Text style={styles.progressAccent}>{progressPercent}% complete.</Text>
          </Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
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

          {/* Add Skills */}
          <TouchableOpacity 
            style={[styles.taskCard, !hasSkills && styles.activeTaskCard]}
            onPress={() => navigation.navigate('AddSkills')}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconBox, { backgroundColor: hasSkills ? colors.mint : colors.peach }]}>
              <Ionicons name={hasSkills ? "checkmark" : "construct"} size={16} color={hasSkills ? colors.mintDeep : colors.primary} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Add your skills</Text>
              <Text style={styles.taskSubtitle}>{hasSkills ? 'Completed' : 'Tell employers what you do'}</Text>
            </View>
            <Ionicons name={hasSkills ? "pencil" : "chevron-forward"} size={18} color={hasSkills ? colors.inkLight : colors.primary} />
          </TouchableOpacity>

          {/* Add Work History */}
          <TouchableOpacity 
            style={[styles.taskCard, (!hasHistory && hasSkills) && styles.activeTaskCard]}
            onPress={() => navigation.navigate('AddWorkHistory')}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconBox, { backgroundColor: hasHistory ? colors.mint : colors.paperCream }]}>
              <Ionicons name={hasHistory ? "checkmark" : "briefcase-outline"} size={16} color={hasHistory ? colors.mintDeep : colors.inkMuted} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Add work history</Text>
              <Text style={styles.taskSubtitle}>{hasHistory ? 'Completed' : 'Optional but recommended'}</Text>
            </View>
            <Ionicons name={hasHistory ? "pencil" : "chevron-forward"} size={18} color={colors.inkLight} />
          </TouchableOpacity>

          {/* Add Character References */}
          <TouchableOpacity 
            style={[styles.taskCard, (!hasRefs && hasHistory) && styles.activeTaskCard]}
            onPress={() => navigation.navigate('AddCharacterReferences')}
            activeOpacity={0.7}
          >
            <View style={[styles.taskIconBox, { backgroundColor: hasRefs ? colors.mint : colors.paperCream }]}>
              <Ionicons name={hasRefs ? "checkmark" : "people-outline"} size={16} color={hasRefs ? colors.mintDeep : colors.inkMuted} />
            </View>
            <View style={styles.taskTextContainer}>
              <Text style={styles.taskTitle}>Add character references</Text>
              <Text style={styles.taskSubtitle}>{hasRefs ? 'Completed' : 'Up to 3 people who can vouch'}</Text>
            </View>
            <Ionicons name={hasRefs ? "pencil" : "chevron-forward"} size={18} color={colors.inkLight} />
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
    backgroundColor: colors.primaryDark, // gradient placeholder
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
