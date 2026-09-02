import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { useAcceptOffer, useRejectOffer } from '../../hooks/useApply';
import { useAlert } from '../../contexts/AlertContext';

type AcceptHireScreenRouteProp = RouteProp<WorkerStackParamList, 'AcceptHire'>;
type AcceptHireScreenNavigationProp = NativeStackNavigationProp<WorkerStackParamList, 'AcceptHire'>;

const AcceptHireScreen: React.FC = () => {
  const route = useRoute<AcceptHireScreenRouteProp>();
  const navigation = useNavigation<AcceptHireScreenNavigationProp>();
  const { id, employerName, jobTitle, offeredPrice } = route.params;

  const acceptOfferMutation = useAcceptOffer();
  const rejectOfferMutation = useRejectOffer();
  const { showAlert } = useAlert();

  const handleAccept = () => {
    acceptOfferMutation.mutate(id, {
      onSuccess: () => {
        showAlert(
          'Offer Accepted!',
          `You have accepted the offer for ${jobTitle}. You can now view ${employerName}'s contact details.`,
          [{ text: 'OK', onPress: () => navigation.popToTop() }],
        );
      },
      onError: (err: any) => {
        showAlert('Error', err.message || 'Failed to accept offer.');
      },
    });
  };

  const handleReject = () => {
    rejectOfferMutation.mutate(id, {
      onSuccess: () => {
        showAlert('Offer Declined', `You have declined the offer for ${jobTitle}.`, [
          { text: 'OK', onPress: () => navigation.popToTop() },
        ]);
      },
      onError: (err: any) => {
        showAlert('Error', err.message || 'Failed to decline offer.');
      },
    });
  };

  const isPending = acceptOfferMutation.isPending || rejectOfferMutation.isPending;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Review Offer</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.prompt}>
          <Text style={styles.bold}>{employerName}</Text> has confirmed you for the{' '}
          <Text style={styles.bold}>{jobTitle}</Text> position.
        </Text>

        {offeredPrice && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Agreed Price</Text>
            <Text style={styles.priceValue}>₱{offeredPrice}</Text>
          </View>
        )}

        <Text style={styles.infoText}>
          By accepting this offer, your contact details will be shared with the employer, and you
          commit to completing the job.
        </Text>

        <Button
          label="Accept Offer"
          onPress={handleAccept}
          loading={acceptOfferMutation.isPending}
          disabled={isPending}
          variant="primary"
          style={styles.actionBtn}
        />
        <Button
          label="Decline Offer"
          variant="outline"
          onPress={handleReject}
          loading={rejectOfferMutation.isPending}
          disabled={isPending}
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
  priceBox: {
    backgroundColor: colors.butter,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  priceLabel: { fontFamily: fonts.body, fontSize: 14, color: colors.inkSoft, marginBottom: 4 },
  priceValue: { fontFamily: fonts.display, fontSize: 28, color: colors.primary },
  infoText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 20,
    lineHeight: 20,
  },
  actionBtn: { marginBottom: 8 },
});

export default AcceptHireScreen;
