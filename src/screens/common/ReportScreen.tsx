import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAlert } from '../../contexts/AlertContext';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useSubmitReport } from '../../hooks/useReports';

// We define a generic param list for the common screen
type ReportScreenParamList = {
  Report: { id: number; type?: 'user' | 'job' };
};

type ReportScreenRouteProp = RouteProp<ReportScreenParamList, 'Report'>;
type ReportScreenNavigationProp = NativeStackNavigationProp<any, 'Report'>;

const REASONS = ['Inappropriate Behavior', 'Scam or Fraud', 'Harassment', 'Spam', 'Other'];

export const ReportScreen: React.FC = () => {
  const navigation = useNavigation<ReportScreenNavigationProp>();
  const route = useRoute<ReportScreenRouteProp>();
  const { id, type = 'user' } = route.params || { id: 0, type: 'user' };

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const { showAlert } = useAlert();

  const { mutate: submitReport, isPending } = useSubmitReport();

  const isFormValid = selectedReason !== null && description.trim().length > 0;

  const handleSubmit = () => {
    if (!selectedReason) return;

    submitReport(
      {
        reported_user_id: type === 'user' ? id : undefined,
        job_post_id: type === 'job' ? id : undefined,
        reason: selectedReason,
        description,
      },
      {
        onSuccess: () => {
          showAlert(
            'Report Submitted',
            'Thank you for keeping our community safe. We will review your report shortly.',
            [{ text: 'OK', onPress: () => navigation.goBack() }],
          );
        },
        onError: (err: any) => {
          showAlert('Error', err.response?.data?.message || 'Failed to submit report.');
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
          <Text style={styles.headerPillText}>Submit a Report</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>What's the issue?</Text>
        <Text style={styles.subtitle}>
          Your report is anonymous. We review all reports to keep the community safe.
        </Text>

        <View style={styles.reasonsContainer}>
          {REASONS.map((reason) => (
            <TouchableOpacity
              key={reason}
              style={[styles.reasonChip, selectedReason === reason && styles.reasonChipActive]}
              onPress={() => setSelectedReason(reason)}
            >
              <Text
                style={[styles.reasonText, selectedReason === reason && styles.reasonTextActive]}
              >
                {reason}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.descriptionField}>
          <Text style={styles.label}>Please provide more details</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Describe what happened..."
              placeholderTextColor={colors.inkLight}
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        <View style={styles.submitContainer}>
          <Button
            title="Submit report"
            variant="danger"
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
  title: { fontFamily: fonts.display, fontSize: 24, color: colors.ink, marginBottom: 8 },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 24,
    lineHeight: 20,
  },
  reasonsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  reasonChip: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  reasonChipActive: { backgroundColor: colors.error, borderColor: colors.error },
  reasonText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft },
  reasonTextActive: { color: colors.white },
  descriptionField: { marginTop: 8 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  inputContainer: {
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    padding: 14,
    minHeight: 120,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  textInput: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  submitContainer: { marginTop: 32 },
  submitBtn: { paddingVertical: 14 },
});

export default ReportScreen;
