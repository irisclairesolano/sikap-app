import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { useJob } from '../../hooks/useJob';
import { useApply, useWithdrawApplication } from '../../hooks/useApply';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ErrorBanner } from '../../components/common/ErrorBanner';
import CustomInput from '../../components/common/Input';
import Button from '../../components/common/Button';

type ApplyRouteProp = RouteProp<WorkerStackParamList, 'Apply'>;

const getCategoryStyles = (category: string) => {
  switch (category) {
    case 'Construction':
      return { icon: 'hammer', bg: colors.peach, color: colors.primary };
    case 'Domestic':
      return { icon: 'home', bg: colors.mint, color: colors.mintDeep };
    case 'Agriculture':
      return { icon: 'leaf', bg: colors.paperCream, color: colors.inkSoft };
    case 'Skilled Trade':
      return { icon: 'construct', bg: colors.sky, color: colors.skyDeep };
    default:
      return { icon: 'briefcase', bg: colors.paperCream, color: colors.inkSoft };
  }
};

export const ApplyScreen: React.FC = () => {
  const route = useRoute<ApplyRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const { id } = route.params;
  const insets = useSafeAreaInsets();

  const { data: job, isLoading: isJobLoading, isError: isJobError } = useJob(id);
  const { mutate: apply, isPending, isError, error, isSuccess, data } = useApply(id);
  const { mutate: withdraw, isPending: isWithdrawing } = useWithdrawApplication();

  const [coverNote, setCoverNote] = useState('');
  const maxLength = 1000;

  const handleSubmit = () => {
    apply({ cover_note: coverNote });
  };

  const handleBackToJobs = () => {
    navigation.navigate('Home');
  };

  const handleWithdraw = () => {
    if (data?.application_id) {
      withdraw(data.application_id, {
        onSuccess: () => {
          navigation.navigate('Home');
        },
      });
    }
  };

  if (isJobLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LoadingSpinner />
      </SafeAreaView>
    );
  }

  if (isJobError || !job) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>
        <ErrorBanner message="Failed to load job details." />
      </SafeAreaView>
    );
  }

  const catStyles = getCategoryStyles(job.categories?.[0] || 'Other');

  // INLINE SUCCESS STATE (Matches Screen 15 structure for Stage 1)
  if (isSuccess) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.appBar}>
          <TouchableOpacity onPress={handleBackToJobs} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.appBarTitleBadge}>
            <Text style={styles.appBarTitleBadgeText}>Application</Text>
          </View>
          <TouchableOpacity style={styles.iconButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color={colors.ink} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContentSuccess}
          showsVerticalScrollIndicator={false}
        >
          {/* Stepper */}
          <View style={styles.stepper}>
            <View style={[styles.step, styles.stepActive]}>
              <View style={[styles.stepCircle, styles.stepCircleActive]}>
                <Text style={styles.stepCircleTextActive}>1</Text>
              </View>
              <Text style={[styles.stepLabel, styles.stepLabelActive]}>Applied</Text>
            </View>
            <View style={styles.stepDivider} />
            <View style={styles.step}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>2</Text>
              </View>
              <Text style={styles.stepLabel}>Shortlisted</Text>
            </View>
            <View style={styles.stepDivider} />
            <View style={styles.step}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>3</Text>
              </View>
              <Text style={styles.stepLabel}>Offer</Text>
            </View>
            <View style={styles.stepDivider} />
            <View style={styles.step}>
              <View style={styles.stepCircle}>
                <Text style={styles.stepCircleText}>4</Text>
              </View>
              <Text style={styles.stepLabel}>Hired</Text>
            </View>
          </View>

          {/* Butter Success Card */}
          <View style={styles.successCard}>
            <View style={styles.successIconBox}>
              <Ionicons name="paper-plane" size={22} color={colors.primary} />
            </View>
            <Text style={styles.successHeadline}>
              Application{'\n'}
              <Text style={styles.successAccent}>sent.</Text>
            </Text>
            <Text style={styles.successSub}>
              {job.employer?.name || 'The employer'} is reviewing applicants now.
            </Text>
          </View>

          {/* Privacy Shield Active */}
          <View style={styles.shieldCard}>
            <View style={[styles.shieldHeader, { marginBottom: 0 }]}>
              <View style={styles.shieldIconBox}>
                <Ionicons name="shield-checkmark" size={16} color={colors.mintDeep} />
              </View>
              <View>
                <Text style={styles.shieldSubText}>Privacy Shield Active</Text>
                <Text style={styles.shieldTitleText}>Only public info is visible</Text>
              </View>
            </View>
          </View>

          <Button
            label={isWithdrawing ? 'Withdrawing...' : 'Withdraw application'}
            variant="ghost"
            onPress={handleWithdraw}
            loading={isWithdrawing}
            style={{ marginTop: 32 }}
          />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // APPLICATION FORM
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <Text style={styles.appBarTitle}>Apply</Text>
          <View style={{ width: 40 }} />
        </View>

        {isError && <ErrorBanner message={error?.message || 'Failed to submit application.'} />}

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Job Summary Card */}
          <View style={styles.summaryCard}>
            <View style={[styles.summaryIconBox, { backgroundColor: catStyles.bg }]}>
              <Ionicons name={catStyles.icon as any} size={20} color={catStyles.color} />
            </View>
            <View style={styles.summaryDetails}>
              <Text style={styles.summaryTitle} numberOfLines={1}>
                {job.title}
              </Text>
              <Text style={styles.summaryEmployer} numberOfLines={1}>
                {job.employer?.name}
              </Text>
            </View>
            <View style={styles.summaryWageBox}>
              <Text style={styles.summaryWage}>₱{job.compensation}</Text>
              <Text style={styles.summaryDuration}>
                per {job.duration_type === 'daily' ? 'day' : 'project'}
              </Text>
            </View>
          </View>

          {/* Form Section */}
          <View style={styles.section}>
            <CustomInput
              label="Add a short note (optional)"
              value={coverNote}
              onChangeText={setCoverNote}
              placeholder="E.g. I have 3 years of experience in this role..."
              multiline
              maxLength={maxLength}
            />
            <Text style={styles.counterText}>
              {coverNote.length}/{maxLength}
            </Text>
          </View>

          {/* Reassurance Card */}
          <View style={styles.reassuranceCard}>
            <Ionicons
              name="shield-checkmark"
              size={18}
              color={colors.mintDeep}
              style={styles.reassuranceIcon}
            />
            <Text style={styles.reassuranceText}>
              Your public profile is shared with the employer. Your phone number and character
              references stay private until they shortlist you.
            </Text>
          </View>
        </ScrollView>

        <View
          style={[styles.bottomBar, { paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24 }]}
        >
          <Button
            label="Send application"
            size="lg"
            onPress={handleSubmit}
            loading={isPending}
            fullWidth
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
  flex1: {
    flex: 1,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    padding: 8,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  appBarTitleBadge: {
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
  appBarTitleBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingHorizontal: 26,
    paddingBottom: 40,
    paddingTop: 8,
  },
  scrollContentSuccess: {
    paddingHorizontal: 18,
    paddingBottom: 40,
    paddingTop: 4,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: colors.paperBright,
    padding: 16,
    borderRadius: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    alignItems: 'center',
    marginBottom: 32,
  },
  summaryIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  summaryDetails: {
    flex: 1,
    marginRight: 12,
  },
  summaryTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  summaryEmployer: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  summaryWageBox: {
    alignItems: 'flex-end',
  },
  summaryWage: {
    fontFamily: fonts.numericBold,
    fontSize: 16,
    color: colors.ink,
  },
  summaryDuration: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 2,
  },
  section: {
    marginBottom: 24,
  },
  counterText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'right',
    marginTop: -4,
  },
  reassuranceCard: {
    flexDirection: 'row',
    backgroundColor: colors.mint,
    padding: 16,
    borderRadius: 14,
    alignItems: 'flex-start',
  },
  reassuranceIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  reassuranceText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 20,
    color: colors.mintDeep,
  },
  bottomBar: {
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 32,
    backgroundColor: colors.paperBright,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 8,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // SUCCESS STATE STYLES
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  step: {
    alignItems: 'center',
    width: 60,
  },
  stepActive: {
    opacity: 1,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.inkFaint,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepCircleActive: {
    backgroundColor: colors.ink,
  },
  stepCircleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  stepCircleTextActive: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.white,
  },
  stepLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkMuted,
  },
  stepLabelActive: {
    color: colors.ink,
  },
  stepDivider: {
    flex: 1,
    height: 2,
    backgroundColor: colors.inkFaint,
    marginHorizontal: -8,
    marginBottom: 16, // to align with circle center
  },
  successCard: {
    backgroundColor: colors.butter,
    borderRadius: 20,
    padding: 22,
    marginTop: 24,
  },
  successIconBox: {
    width: 44,
    height: 44,
    backgroundColor: colors.white,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  successHeadline: {
    fontFamily: fonts.display,
    fontSize: 28,
    lineHeight: 28,
    color: colors.ink,
    letterSpacing: -0.7,
    marginTop: 18,
    marginBottom: 10,
  },
  successAccent: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  successSub: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
  },
  shieldCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  shieldIconBox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.paperCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  shieldSubText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    marginBottom: 2,
  },
  shieldTitleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  shieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  shieldLabel: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
  },
  shieldStatusLocked: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  shieldStatusLockedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkSoft,
  },
  shieldStatusNever: {
    backgroundColor: colors.status.accepted.bg, // use themed success background tint
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 100,
  },
  shieldStatusNeverText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.mintDeep,
  },
});

export default ApplyScreen;
