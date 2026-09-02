import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useSubmitReview } from '../../hooks/useReviews';
import { useAlert } from '../../contexts/AlertContext';

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

export const RateWorkerScreen: React.FC = () => {
  const navigation = useNavigation<RateWorkerScreenNavigationProp>();
  const route = useRoute<RateWorkerScreenRouteProp>();
  const { id, workerName, jobTitle } = route.params; // this is the applicationId

  const [quality, setQuality] = useState(0);
  const [punctuality, setPunctuality] = useState(0);
  const [communication, setCommunication] = useState(0);
  const [behavior, setBehavior] = useState(0);
  const [note, setNote] = useState('');

  const { mutate: submitReview, isPending } = useSubmitReview();
  const { showAlert } = useAlert();

  const isFormValid = quality > 0 && punctuality > 0 && communication > 0 && behavior > 0;

  const handleSubmit = () => {
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
        onSuccess: () => {
          showAlert('Success', 'Your review has been submitted.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          showAlert('Error', err.message || 'Failed to submit review.');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Rate the worker</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
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
          <RatingCategory title="Quality of work" rating={quality} onRate={setQuality} />
          <RatingCategory title="Punctuality" rating={punctuality} onRate={setPunctuality} />
          <RatingCategory title="Communication" rating={communication} onRate={setCommunication} />
          <RatingCategory title="Behavior" rating={behavior} onRate={setBehavior} />
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
              placeholder="Excellent work. Will hire again."
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
