import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { useCancelHire } from '../../hooks/useJobApplications';
import { useAlert } from '../../contexts/AlertContext';

type CancelHireScreenRouteProp = RouteProp<EmployerStackParamList, 'CancelHire'>;
type CancelHireScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'CancelHire'
>;

const CancelHireScreen: React.FC = () => {
  const route = useRoute<CancelHireScreenRouteProp>();
  const navigation = useNavigation<CancelHireScreenNavigationProp>();
  const { id, applicantName, jobTitle } = route.params;

  const cancelHireMutation = useCancelHire();
  const { showAlert } = useAlert();

  const handleCancelHire = () => {
    cancelHireMutation.mutate(id, {
      onSuccess: () => {
        showAlert(
          'Hire Cancelled',
          `You have successfully cancelled the hire for ${applicantName}.`,
          [{ text: 'OK', onPress: () => navigation.popToTop() }],
        );
      },
      onError: (err: any) => {
        showAlert('Error', err.message || 'Failed to cancel hire.');
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Cancel Hire</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.prompt}>
          Are you sure you want to cancel the hire process for{' '}
          <Text style={styles.bold}>{applicantName}</Text> regarding the{' '}
          <Text style={styles.bold}>{jobTitle}</Text> position?
        </Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            Warning: This action cannot be undone. The applicant will be notified that the hire has
            been cancelled, and this application will be rejected.
          </Text>
        </View>

        <Button
          label="Yes, Cancel Hire"
          onPress={handleCancelHire}
          loading={cancelHireMutation.isPending}
          variant="primary"
          style={styles.actionBtn}
        />
        <Button
          label="Go Back"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={cancelHireMutation.isPending}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: { padding: 20, borderBottomWidth: 1, borderBottomColor: colors.inkFaint },
  headerTitle: { fontFamily: fonts.display, fontSize: 20, color: colors.ink },
  content: { padding: 20 },
  prompt: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: colors.ink,
    marginBottom: 24,
    lineHeight: 24,
  },
  bold: { fontFamily: fonts.bodyBold, color: colors.primary },
  warningBox: {
    backgroundColor: colors.status.pending.bg,
    borderColor: colors.warning,
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    marginBottom: 18,
  },
  warningText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.status.pending.text,
    lineHeight: 20,
  },
  actionBtn: { marginBottom: 8 },
});

export default CancelHireScreen;
