import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { useMarkJobComplete } from '../../hooks/useJobs';
import { useAlert } from '../../contexts/AlertContext';

type MarkCompleteScreenRouteProp = RouteProp<EmployerStackParamList, 'MarkComplete'>;
type MarkCompleteScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'MarkComplete'
>;

const MarkCompleteScreen: React.FC = () => {
  const route = useRoute<MarkCompleteScreenRouteProp>();
  const navigation = useNavigation<MarkCompleteScreenNavigationProp>();
  const { id, jobTitle } = route.params;

  const markCompleteMutation = useMarkJobComplete();
  const { showAlert } = useAlert();

  const handleMarkComplete = () => {
    markCompleteMutation.mutate(id, {
      onSuccess: () => {
        showAlert(
          'Job Completed!',
          `The job "${jobTitle}" has been successfully marked as completed. You can now leave a rating for the worker(s).`,
          [
            {
              text: 'OK',
              onPress: () => navigation.navigate('RateWorkerList', { jobId: id, jobTitle }),
            },
          ],
        );
      },
      onError: (err: any) => {
        showAlert('Error', err.message || 'Failed to mark job as complete.');
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Complete Job</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.prompt}>
          Are you ready to mark <Text style={styles.bold}>{jobTitle}</Text> as completed?
        </Text>
        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Marking this job as complete will finalize the contract for all hired workers. You will
            be prompted to leave a rating and review for the workers who completed the task.
          </Text>
        </View>

        <Button
          label="Mark as Completed"
          onPress={handleMarkComplete}
          loading={markCompleteMutation.isPending}
          variant="primary"
          style={styles.actionBtn}
        />
        <Button
          label="Not Yet"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={markCompleteMutation.isPending}
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
  infoBox: {
    backgroundColor: colors.status.accepted.bg,
    borderColor: colors.mint,
    borderWidth: 1,
    padding: 16,
    borderRadius: 8,
    marginBottom: 32,
  },
  infoText: { fontFamily: fonts.body, fontSize: 14, color: colors.mintDeep, lineHeight: 20 },
  actionBtn: { marginBottom: 12 },
});

export default MarkCompleteScreen;
