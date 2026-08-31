import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { useJobRequest } from '../../hooks/useJobApplications';
import { useAlert } from '../../contexts/AlertContext';

type SendRequestScreenRouteProp = RouteProp<EmployerStackParamList, 'SendRequest'>;
type SendRequestScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'SendRequest'
>;

const SendRequestScreen: React.FC = () => {
  const route = useRoute<SendRequestScreenRouteProp>();
  const navigation = useNavigation<SendRequestScreenNavigationProp>();
  const { id, applicantName, jobTitle } = route.params;

  const jobRequestMutation = useJobRequest();
  const { showAlert } = useAlert();

  const handleSendRequest = () => {
    jobRequestMutation.mutate(id, {
      onSuccess: () => {
        showAlert(
          'Request Sent!',
          `You have sent a job request to ${applicantName}. Their references will now be visible to you.`,
          [{ text: 'OK', onPress: () => navigation.popToTop() }],
        );
      },
      onError: (err: any) => {
        const rawMsg = err?.message || '';
        const userFriendlyMsg =
          !rawMsg ||
          rawMsg.includes('http://') ||
          rawMsg.includes('https://') ||
          rawMsg.includes('NotFoundHttpException')
            ? 'Unable to send job request. Please try again.'
            : rawMsg;
        showAlert('Error', userFriendlyMsg);
      },
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Send Job Request</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.prompt}>
          Are you sure you want to send a job request to{' '}
          <Text style={styles.bold}>{applicantName}</Text> for the position of{' '}
          <Text style={styles.bold}>{jobTitle}</Text>?
        </Text>
        <Text style={styles.info}>
          Sending a request will move this application to the negotiation stage. The applicant's
          character references will be revealed so you can verify their background before confirming
          the hire.
        </Text>

        <Button
          label="Send Request"
          onPress={handleSendRequest}
          loading={jobRequestMutation.isPending}
          variant="primary"
          style={styles.actionBtn}
        />
        <Button
          label="Cancel"
          variant="outline"
          onPress={() => navigation.goBack()}
          disabled={jobRequestMutation.isPending}
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
    marginBottom: 16,
    lineHeight: 24,
  },
  bold: { fontFamily: fonts.bodyBold, color: colors.primary },
  info: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 32,
    lineHeight: 20,
  },
  actionBtn: { marginBottom: 12 },
});

export default SendRequestScreen;
