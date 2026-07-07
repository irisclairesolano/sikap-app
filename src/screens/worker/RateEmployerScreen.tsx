import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useSubmitReview } from '../../hooks/useReviews';
import { useAlert } from '../../contexts/AlertContext';

type RateEmployerScreenRouteProp = RouteProp<WorkerStackParamList, 'RateEmployer'>;
type RateEmployerScreenNavigationProp = NativeStackNavigationProp<
  WorkerStackParamList,
  'RateEmployer'
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
          <TouchableOpacity key={star} onPress={() => onRate(star)}>
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

export const RateEmployerScreen: React.FC = () => {
  const navigation = useNavigation<RateEmployerScreenNavigationProp>();
  const route = useRoute<RateEmployerScreenRouteProp>();
  const { id, employerName, jobTitle } = route.params;

  const [safety, setSafety] = useState(0);
  const [clarity, setClarity] = useState(0);
  const [fairness, setFairness] = useState(0);
  const [respect, setRespect] = useState(0);
  const [reliability, setReliability] = useState(0);
  const [note, setNote] = useState('');

  const { mutate: submitReview, isPending } = useSubmitReview();
  const { showAlert } = useAlert();

  // We map to cat1 - cat4. Since there are 5 states here and backend only supports 4 categories,
  // wait, the backend `SubmitReviewPayload` takes cat1, cat2, cat3, cat4.
  // The UI has: Clarity, Fairness, Respectfulness, Reliability.
  // So we don't need 'safety'. We will use clarity, fairness, respect, reliability.
  const isFormValid = clarity > 0 && fairness > 0 && respect > 0 && reliability > 0;

  const handleSubmit = () => {
    submitReview(
      {
        applicationId: id,
        payload: {
          cat1: clarity,
          cat2: fairness,
          cat3: respect,
          cat4: reliability,
          comment: note,
        },
      },
      {
        onSuccess: () => {
          showAlert('Success', 'Your review has been submitted.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          showAlert('Error', err.response?.data?.message || 'Failed to submit review.');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Rate employer</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Employer Info */}
        <View style={styles.employerInfoCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{employerName.charAt(0)}</Text>
          </View>
          <View style={styles.employerDetails}>
            <Text style={styles.employerName}>{employerName}</Text>
            <Text style={styles.jobMeta}>{jobTitle}</Text>
          </View>
        </View>

        {/* Rating Categories */}
        <View style={styles.categoriesContainer}>
          <RatingCategory title="Clarity of job description" rating={clarity} onRate={setClarity} />
          <RatingCategory title="Fairness of pay" rating={fairness} onRate={setFairness} />
          <RatingCategory title="Respectfulness" rating={respect} onRate={setRespect} />
          <RatingCategory title="Reliability" rating={reliability} onRate={setReliability} />
        </View>

        {/* Note Field */}
        <View style={styles.noteField}>
          <Text style={styles.noteLabel}>
            A note <Text style={styles.noteOptional}>(optional)</Text>
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
              placeholder="Clear instructions, paid on time."
              placeholderTextColor={colors.inkLight}
              multiline
              value={note}
              onChangeText={setNote}
            />
          </View>
        </View>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Button
            title="Submit rating"
            onPress={handleSubmit}
            disabled={!isFormValid || isPending}
            loading={isPending}
            style={styles.submitBtn}
          />
        </View>
      </ScrollView>
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
  employerInfoCard: {
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
  employerDetails: { flex: 1 },
  employerName: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
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
  submitContainer: { marginTop: 24 },
  submitBtn: { paddingVertical: 14 },
});

export default RateEmployerScreen;
