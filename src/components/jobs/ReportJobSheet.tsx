import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { BottomSheet } from '../common/BottomSheet';
import { useSubmitReport } from '../../hooks/useReports';
import { useAlert } from '../../contexts/AlertContext';

const REASONS = [
  { label: 'Fake / Scam Job', value: 'fake_account' },
  { label: 'Inappropriate Content', value: 'inappropriate_job' },
  { label: 'Harassment', value: 'harassment' },
  { label: 'Other', value: 'other' },
] as const;

type ReasonType = (typeof REASONS)[number]['value'];

interface ReportJobSheetProps {
  visible: boolean;
  onClose: () => void;
  jobId: number;
  jobTitle: string;
}

export const ReportJobSheet: React.FC<ReportJobSheetProps> = ({
  visible,
  onClose,
  jobId,
  jobTitle,
}) => {
  const [selectedReason, setSelectedReason] = useState<ReasonType | null>(null);
  const [description, setDescription] = useState('');
  const { mutate: submitReport, isPending } = useSubmitReport();
  const { showAlert } = useAlert();

  const handleSubmit = () => {
    if (!selectedReason) {
      showAlert('Select a Reason', 'Please select a reason for reporting this job post.');
      return;
    }
    submitReport(
      {
        reportable_type: 'job_post',
        reportable_id: jobId,
        type: selectedReason,
        description: description.trim() || selectedReason,
      },
      {
        onSuccess: () => {
          setSelectedReason(null);
          setDescription('');
          onClose();
          showAlert(
            'Report Submitted',
            'Thank you. Our moderation team will review this post shortly.',
          );
        },
        onError: () => {
          showAlert(
            'Submission Failed',
            'Failed to submit report. Please check your connection and try again.',
          );
        },
      },
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} snapHeight={440}>
      <View style={styles.header}>
        <Ionicons name="flag" size={20} color="#E85D75" />
        <Text style={styles.title}>Report Job Post</Text>
      </View>
      <Text style={styles.subtitle} numberOfLines={1}>
        {jobTitle}
      </Text>

      <View style={styles.reasons}>
        {REASONS.map((r) => (
          <TouchableOpacity
            key={r.value}
            style={[styles.reasonBtn, selectedReason === r.value && styles.reasonBtnActive]}
            onPress={() => setSelectedReason(r.value)}
            activeOpacity={0.7}
          >
            {selectedReason === r.value && (
              <Ionicons
                name="checkmark-circle"
                size={16}
                color="#E85D75"
                style={styles.checkIcon}
              />
            )}
            <Text
              style={[styles.reasonText, selectedReason === r.value && styles.reasonTextActive]}
            >
              {r.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.input}
        placeholder="Add details (optional)"
        placeholderTextColor="#B0A89C"
        value={description}
        onChangeText={setDescription}
        multiline
        maxLength={300}
        numberOfLines={3}
      />

      <TouchableOpacity
        style={[styles.submitBtn, (!selectedReason || isPending) && styles.submitBtnDisabled]}
        onPress={handleSubmit}
        disabled={!selectedReason || isPending}
        activeOpacity={0.8}
      >
        {isPending ? (
          <ActivityIndicator color="#FFF" size="small" />
        ) : (
          <Text style={styles.submitText}>Submit Report</Text>
        )}
      </TouchableOpacity>
    </BottomSheet>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#2C2117',
  },
  subtitle: {
    fontSize: 13,
    color: '#8C7B6A',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  reasons: {
    gap: 8,
    marginBottom: 14,
  },
  reasonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    backgroundColor: '#FAFAF8',
  },
  reasonBtnActive: {
    borderColor: '#E85D75',
    backgroundColor: '#FFF0F3',
  },
  checkIcon: {
    marginRight: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#5C5048',
    fontWeight: '500',
  },
  reasonTextActive: {
    color: '#E85D75',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E0D8',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#2C2117',
    backgroundColor: '#FAFAF8',
    textAlignVertical: 'top',
    minHeight: 72,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: '#E85D75',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    backgroundColor: '#E5E0D8',
  },
  submitText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
