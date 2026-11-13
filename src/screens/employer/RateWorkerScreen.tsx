import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useSubmitReview } from '../../hooks/useReviews';
import { useAlert } from '../../contexts/AlertContext';
import { useApplication } from '../../hooks/useJobApplications';
import { triggerHaptic } from '../../utils/haptics';
import { useLanguage } from '../../contexts/LanguageContext';
import { safeGoBack } from '../../utils/navigation';

type RateWorkerScreenRouteProp = RouteProp<EmployerStackParamList, 'RateWorker'>;
type RateWorkerScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'RateWorker'
>;

const RatingCategory = ({
  title,
  rating,
  onRate,
}: {
  title: string;
  rating: number;
  onRate: (val: number) => void;
}) => {
  return (
    <View style={styles.ratingCard}>
      <Text style={styles.ratingTitle}>{title}</Text>
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => {
              triggerHaptic('light');
              onRate(star);
            }}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={26}
              color={star <= rating ? colors.gold : colors.inkLight}
            />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

export const RateWorkerScreen: React.FC = () => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<RateWorkerScreenNavigationProp>();
  const route = useRoute<RateWorkerScreenRouteProp>();
  const { id, workerName, jobTitle } = route.params; // this is the applicationId

  const handleGoBack = useCallback(() => {
    safeGoBack(navigation, 'JobStatusManagement');
  }, [navigation]);

  useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleGoBack]);

  const { showAlert } = useAlert();
  const { data: appData } = useApplication(id);
  const application = ((appData as any)?.data ?? appData) as any;

  React.useEffect(() => {
    if (application?.has_reviewed) {
      showAlert(t('rate_already_reviewed_title'), t('rate_already_reviewed_worker_msg'), [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    }
  }, [application?.has_reviewed, navigation, showAlert, t]);

  const [quality, setQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [behavior, setBehavior] = useState(0);
  const [note, setNote] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { mutate: submitReview, isPending } = useSubmitReview();

  const isFormValid =
    quality > 0 && punctuality > 0 && communication > 0 && behavior > 0 && note.trim().length >= 5;

  const handleSubmit = () => {
    if (isPending || isSubmitted || !isFormValid) return;
    setIsSubmitted(true);
    submitReview(
      {
        applicationId: id,
        payload: {
          cat1: quality,
          cat2: punctuality,
          cat3: communication,
          cat4: behavior,
          comment: note,
        },
      },
      {
        onSuccess: (res: any) => {
          triggerHaptic('success');
          const hasWarnings = res?.content_warnings && res.content_warnings.length > 0;
          const msg = hasWarnings
            ? t('rate_worker_success_msg_warn')
            : t('rate_worker_success_msg');
          const avgRating = (quality + punctuality + communication + behavior) / 4;
          const passedJobId = (route.params as any)?.jobId;

          navigation.replace('Success', {
            variant: 'confirm',
            title: t('rate_review_sent_title'),
            message: msg,
            detail: [
              { label: t('rate_label_worker'), value: workerName },
              { label: t('rate_label_job'), value: jobTitle },
              { label: t('rate_label_your_rating'), value: `${avgRating.toFixed(1)} / 5` },
            ],
            primaryAction: passedJobId
              ? {
                  label: t('rate_btn_view_job_summary'),
                  navigateTo: {
                    name: 'JobStatusManagement',
                    params: { id: passedJobId },
                  },
                }
              : {
                  label: t('rate_btn_back_to_workers'),
                  goBack: true,
                },
            secondaryAction: {
              label: t('rate_btn_done'),
              goBack: true,
            },
          });
        },
        onError: (err: any) => {
          setIsSubmitted(false);
          showAlert(t('error_title'), err.message || t('rate_submit_error'));
        },
      },
    );
  };

  if (application?.has_reviewed) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={handleGoBack}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>{t('rate_worker_pill')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: Math.max(insets.bottom + 24, 40) },
          ]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          showsVerticalScrollIndicator={false}
        >
          {/* Worker Info */}
          <View style={styles.workerInfoCard}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(workerName || 'Worker').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.workerDetails}>
              <Text style={styles.workerName}>{workerName || 'Worker'}</Text>
              <Text style={styles.jobMeta}>{jobTitle || 'Job'}</Text>
            </View>
          </View>

          {/* Rating Categories */}
          <View style={styles.categoriesContainer}>
            <RatingCategory title={t('rate_quality')} rating={quality} onRate={setQuality} />
            <RatingCategory
              title={t('rate_punctuality')}
              rating={punctuality}
              onRate={setPunctuality}
            />
            <RatingCategory
              title={t('rate_communication')}
              rating={communication}
              onRate={setCommunication}
            />
            <RatingCategory title={t('rate_behavior')} rating={behavior} onRate={setBehavior} />
          </View>

          {/* Note Field */}
          <View style={styles.noteField}>
            <Text style={styles.noteLabel}>
              {t('rate_review_feedback')} <Text style={{ color: colors.error }}>*</Text>
            </Text>
            <View style={styles.inputContainer}>
              <Ionicons
                name="chatbubble-outline"
                size={20}
                color={colors.inkLight}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.textInput}
                placeholder={t('rate_review_placeholder')}
                placeholderTextColor={colors.inkLight}
                multiline
                scrollEnabled={true}
                value={note}
                onChangeText={setNote}
              />
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.submitContainer}>
            <Button
              title={t('rate_submit_btn')}
              onPress={handleSubmit}
              disabled={!isFormValid || isPending || isSubmitted}
              loading={isPending || isSubmitted}
              style={styles.submitBtn}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  keyboardAvoidingView: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  workerInfoCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...shadows.sm,
    marginBottom: 14,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.primaryDark },
  workerDetails: { flex: 1 },
  workerName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  jobMeta: { fontFamily: fonts.body, fontSize: 11, color: colors.inkSoft, marginTop: 2 },
  categoriesContainer: { gap: 10 },
  ratingCard: { backgroundColor: colors.paperBright, borderRadius: 12, padding: 14, ...shadows.sm },
  ratingTitle: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink, marginBottom: 8 },
  starsContainer: { flexDirection: 'row', justifyContent: 'space-between' },
  noteField: { marginTop: 14 },
  noteLabel: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink, marginBottom: 6 },
  noteOptional: { fontFamily: fonts.body, color: colors.inkLight },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    padding: 12,
    minHeight: 80,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  inputIcon: { marginTop: 2, marginRight: 8 },
  textInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  submitContainer: { marginTop: 16 },
  submitBtn: {},
});

export default RateWorkerScreen;
