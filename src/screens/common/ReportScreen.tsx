import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAlert } from '../../contexts/AlertContext';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useSubmitReport } from '../../hooks/useReports';

import { normalizeReportableType, ReportReasonType } from '../../api/reports';
import { triggerHaptic } from '../../utils/haptics';

// We define a generic param list for the common screen
type ReportScreenParamList = {
  Report: {
    id?: number;
    type?: string;
    reportable_id?: number;
    reportable_type?: string;
  };
};

type ReportScreenRouteProp = RouteProp<ReportScreenParamList, 'Report'>;
type ReportScreenNavigationProp = NativeStackNavigationProp<any, 'Report'>;

const REASONS = ['Inappropriate Behavior', 'Scam or Fraud', 'Harassment', 'Spam', 'Other'];

export const ReportScreen: React.FC = () => {
  const navigation = useNavigation<ReportScreenNavigationProp>();
  const route = useRoute<ReportScreenRouteProp>();
  const rawParams = (route.params || {}) as any;
  const id =
    Number(
      rawParams.reportable_id ??
        rawParams.id ??
        rawParams.userId ??
        rawParams.jobId ??
        rawParams.targetId ??
        rawParams.applicantId ??
        rawParams.applicationId,
    ) || 0;
  const type = normalizeReportableType(
    rawParams.reportable_type ?? rawParams.type ?? (rawParams.jobId ? 'job_post' : 'user'),
  );

  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const { showAlert } = useAlert();

  const { mutate: submitReport, isPending } = useSubmitReport();

  const isFormValid = selectedReason !== null && description.trim().length > 0;

  const handlePickScreenshots = async () => {
    const remainingSlots = 5 - screenshots.length;
    if (remainingSlots <= 0) {
      showAlert('Limit Reached', 'You can upload up to 5 screenshots per report.');
      return;
    }

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlert('Permission Required', 'Please grant photo library access to attach screenshots.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      selectionLimit: remainingSlots,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((asset) => asset.uri);
      setScreenshots((prev) => [...prev, ...newUris].slice(0, 5));
      triggerHaptic('light');
    }
  };

  const handleRemoveScreenshot = (indexToRemove: number) => {
    setScreenshots((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    triggerHaptic('light');
  };

  const handleSubmit = () => {
    if (!id || id <= 0) {
      showAlert('Missing Target', 'Unable to submit report without a valid target identifier.');
      return;
    }

    if (!selectedReason) {
      showAlert('Select a Reason', 'Please select a reason for reporting.');
      return;
    }

    // Map UI reason to backend enum
    let mappedType: ReportReasonType = 'other';
    if (selectedReason === 'Harassment') mappedType = 'harassment';
    if (selectedReason === 'Scam or Fraud' || selectedReason === 'Spam')
      mappedType = 'fake_account';
    if (selectedReason === 'Inappropriate Behavior') mappedType = 'inappropriate_job';

    submitReport(
      {
        reportable_type: type,
        reportable_id: id,
        type: mappedType,
        description: description.trim() || selectedReason,
        screenshots: screenshots.length > 0 ? screenshots : undefined,
      },
      {
        onSuccess: (res: any) => {
          triggerHaptic('medium');
          let alertTitle = 'Report Submitted';
          let alertMsg =
            'Thank you for keeping our community safe. We will review your report shortly.';

          if (res?.message === 'This is already resolved.') {
            alertTitle = 'Notice';
            alertMsg = 'This issue has already been reviewed or resolved by moderators.';
          } else if (res?.message === 'You have already reported this item.') {
            alertTitle = 'Report Received';
            alertMsg =
              'You have already submitted a report for this item. Our moderation team is actively reviewing it.';
          }

          showAlert(alertTitle, alertMsg, [{ text: 'OK', onPress: () => navigation.goBack() }]);
        },
        onError: (err: any) => {
          showAlert('Error', err.message || 'Failed to submit report.');
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
              testID={`reason-chip-${reason}`}
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
              testID="report-description-input"
              style={styles.textInput}
              placeholder="Describe what happened..."
              placeholderTextColor={colors.inkLight}
              multiline
              value={description}
              onChangeText={setDescription}
            />
          </View>
        </View>

        {/* Screenshot Attachment Section */}
        <View style={styles.screenshotsSection}>
          <View style={styles.screenshotsHeader}>
            <Text style={styles.label}>Attach Evidence ({screenshots.length}/5)</Text>
            <Text style={styles.screenshotsSublabel}>
              Screenshots help our team review and resolve faster
            </Text>
          </View>

          <View style={styles.screenshotsGrid}>
            {screenshots.map((uri, index) => (
              <View key={uri + index} style={styles.screenshotThumbContainer}>
                <Image source={{ uri }} style={styles.screenshotThumb} resizeMode="cover" />
                <TouchableOpacity
                  style={styles.removeScreenshotBtn}
                  onPress={() => handleRemoveScreenshot(index)}
                  activeOpacity={0.8}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="close" size={14} color={colors.white} />
                </TouchableOpacity>
              </View>
            ))}

            {screenshots.length < 5 && (
              <TouchableOpacity
                style={styles.addScreenshotBtn}
                onPress={handlePickScreenshots}
                activeOpacity={0.7}
              >
                <Ionicons name="camera-outline" size={24} color={colors.primary} />
                <Text style={styles.addScreenshotText}>Add Photo</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.submitContainer}>
          <Button
            testID="submit-report-btn"
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
  screenshotsSection: {
    marginTop: 20,
  },
  screenshotsHeader: {
    marginBottom: 10,
  },
  screenshotsSublabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  screenshotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  screenshotThumbContainer: {
    position: 'relative',
    width: 72,
    height: 72,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.inkFaint,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  screenshotThumb: {
    width: '100%',
    height: '100%',
  },
  removeScreenshotBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addScreenshotBtn: {
    width: 72,
    height: 72,
    borderRadius: 12,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.primary,
    backgroundColor: colors.paperBright,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addScreenshotText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.primary,
    marginTop: 2,
  },
  submitContainer: { marginTop: 32 },
  submitBtn: { paddingVertical: 14 },
});

export default ReportScreen;
