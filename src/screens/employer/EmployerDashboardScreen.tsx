import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { useAuth } from '../../hooks/useAuth';
import Button from '../../components/common/Button';

// Dummy active jobs
const ACTIVE_JOBS = [
  {
    id: 1,
    title: 'Carpenter wanted',
    location: 'Bulan',
    applicants: 5,
    icon: 'hammer',
    color: colors.peach,
    iconColor: colors.primaryDark,
    isNew: true,
  },
  {
    id: 2,
    title: 'House painter',
    location: 'Bulan',
    applicants: 2,
    icon: 'brush',
    color: colors.mint,
    iconColor: colors.mintDeep,
    isNew: false,
  },
  {
    id: 3,
    title: 'Fence repair',
    location: 'San Vicente',
    applicants: 1,
    icon: 'construct',
    color: colors.butter,
    iconColor: colors.ink,
    isNew: false,
  },
];

export const EmployerDashboardScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const { user } = useAuth();

  const getInitial = (name?: string) => (name ? name.charAt(0).toUpperCase() : 'E');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.appBar}>
        <View style={styles.appBarLeft}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitial(user?.name || 'Employer')}</Text>
          </View>
          <View>
            <Text style={styles.greetingSmall}>Hi,</Text>
            <Text style={styles.greetingName}>
              {user?.name ? user.name.split(' ')[0] : 'Employer'}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.peach }]}>
            <Text style={[styles.statNum, { color: colors.primaryDark }]}>3</Text>
            <Text style={[styles.statLabel, { color: colors.primaryDark }]}>Active jobs</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statNum, { color: colors.mintDeep }]}>12</Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Total hires</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.butter }]}>
            <Text style={[styles.statNum, { color: colors.ink }]}>₱14k</Text>
            <Text style={[styles.statLabel, { color: colors.inkSoft }]}>Total paid</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.sky }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[styles.statNum, { color: colors.skyDeep }]}>4.9</Text>
              <Ionicons
                name="star"
                size={14}
                color={colors.skyDeep}
                style={{ marginLeft: 2, marginBottom: 4 }}
              />
            </View>
            <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Reputation</Text>
          </View>
        </View>

        <Button
          label="Post a new job"
          size="lg"
          fullWidth
          icon="add"
          onPress={() => navigation.navigate('PostJob')}
          style={{ marginTop: 24 }}
        />

        <Text style={styles.sectionHeader}>Active jobs</Text>

        <View style={styles.listContainer}>
          {ACTIVE_JOBS.map((job) => (
            <TouchableOpacity
              key={job.id}
              style={styles.jobCard}
              onPress={() => navigation.navigate('JobDetails', { id: job.id })}
              activeOpacity={0.7}
            >
              <View style={[styles.jobIconBox, { backgroundColor: job.color }]}>
                <Ionicons name={job.icon as any} size={20} color={job.iconColor} />
              </View>
              <View style={styles.jobDetails}>
                <Text style={styles.jobTitle}>{job.title}</Text>
                <Text style={styles.jobSubtitle}>
                  {job.location} · <Text style={styles.jobApplicantsNum}>{job.applicants}</Text>{' '}
                  applicant{job.applicants > 1 ? 's' : ''}
                </Text>
              </View>
              {job.isNew ? (
                <View style={styles.newBadge}>
                  <Ionicons
                    name="ellipse"
                    size={6}
                    color={colors.primary}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={styles.newBadgeText}>New</Text>
                </View>
              ) : (
                <Ionicons name="chevron-forward" size={18} color={colors.inkLight} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
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
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.skyDeep,
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
    paddingTop: 8,
    paddingBottom: 40,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statNum: {
    fontFamily: fonts.numericBold,
    fontSize: 26,
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
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
  listContainer: {
    gap: 10,
  },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 12,
    paddingRight: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 12,
  },
  jobIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobDetails: {
    flex: 1,
  },
  jobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 2,
  },
  jobSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  jobApplicantsNum: {
    fontFamily: fonts.numericBold,
  },
  newBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  newBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});

export default EmployerDashboardScreen;
