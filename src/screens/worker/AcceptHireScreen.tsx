import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, BackHandler } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { colors, fonts } from '../../theme';
import Button from '../../components/common/Button';
import { useAcceptOffer, useRejectOffer } from '../../hooks/useApply';
import { useAlert } from '../../contexts/AlertContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { triggerHaptic } from '../../utils/haptics';
import { safeGoBack } from '../../utils/navigation';

import { useMyApplications } from '../../hooks/useMyApplications';

type AcceptHireScreenRouteProp = RouteProp<WorkerStackParamList, 'AcceptHire'>;
type AcceptHireScreenNavigationProp = NativeStackNavigationProp<WorkerStackParamList, 'AcceptHire'>;

const AcceptHireScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const route = useRoute<AcceptHireScreenRouteProp>();
  const navigation = useNavigation<AcceptHireScreenNavigationProp>();
  const { id, employerName, jobTitle, offeredPrice, conversationId } = route.params;

  const acceptOfferMutation = useAcceptOffer();
  const rejectOfferMutation = useRejectOffer();
  const { data: myAppsData } = useMyApplications('Active');
  const { showAlert } = useAlert();

  const handleAccept = () => {
    acceptOfferMutation.mutate(id, {
      onSuccess: () => {
        triggerHaptic('success');
        const activeCount = myAppsData?.pages?.[0]?.data?.length || 0;
        const isFirstHire = activeCount === 0;

        navigation.replace('Success', {
          variant: isFirstHire ? 'milestone' : 'confirm',
          title: isFirstHire ? "You're hired for your first job!" : "You're hired!",
          message: isFirstHire
            ? `Congratulations! You accepted your first job offer on SIKAP for ${jobTitle}. Coordinate details in chat.`
            : `Congrats! ${jobTitle} is yours. Coordinate the schedule and location with ${employerName}.`,
          detail: [
            { label: 'Job', value: jobTitle },
            { label: 'Employer', value: employerName },
            ...(offeredPrice ? [{ label: 'Agreed Price', value: `₱${offeredPrice}` }] : []),
          ],
          primaryAction: {
            label: 'Open chat',
            navigateTo: conversationId
              ? {
                  name: 'Chat',
                  params: {
                    conversationId,
                    jobTitle,
                    otherUserName: employerName,
                  },
                }
              : { name: 'ConversationsList' },
          },
          secondaryAction: {
            label: 'See job details',
            navigateTo: {
              name: 'ApplicationDetail',
              params: { applicationId: id, jobTitle, employerName },
            },
          },
        });
      },
      onError: (err: any) => {
        showAlert('Error', err.message || 'Failed to accept offer.');
      },
    });
  };

  const handleGoBack = React.useCallback(() => {
    safeGoBack(navigation, 'Mine', { screen: 'Applications' });
  }, [navigation]);

  React.useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleGoBack]);

  const handleReject = () => {
    rejectOfferMutation.mutate(id, {
      onSuccess: () => {
        triggerHaptic('medium');
        showAlert(
          t('alert_decline_offer_title') || 'Offer Declined',
          `You have declined the offer for ${jobTitle}.`,
          [{ text: 'OK', onPress: handleGoBack }],
        );
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
        <TouchableOpacity style={styles.iconBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('job_offer_received') || 'Job Offer'}</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>
          <Text style={styles.bold}>{employerName}</Text> — {t('employer_sent_offer_notice')}
        </Text>

        {offeredPrice && (
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>
              {t('hiring_final_agreed_price_eyebrow') || 'Agreed Price'}
            </Text>
            <Text style={styles.priceValue}>₱{offeredPrice}</Text>
            <Text style={styles.priceSubLabel}>{t('offer_total_amount_sublabel')}</Text>
          </View>
        )}

        <Text style={styles.infoText}>{t('hiring_stage4_guidance')}</Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View style={styles.footerRow}>
          <Button
            label={t('hiring_decline_offer_btn')}
            variant="outline"
            size="base"
            style={{ flex: 1 }}
            onPress={handleReject}
            loading={rejectOfferMutation.isPending}
            disabled={isPending}
          />
          <Button
            label={t('hiring_accept_offer_btn')}
            onPress={handleAccept}
            loading={acceptOfferMutation.isPending}
            disabled={isPending}
            variant="primary"
            size="base"
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.paper,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 18,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  headerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
    letterSpacing: 0.3,
  },
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
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  priceLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  priceValue: { fontFamily: fonts.display, fontSize: 30, color: '#0F172A' },
  priceSubLabel: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 4,
  },
  infoText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 20,
    lineHeight: 20,
  },
  actionBtn: { marginBottom: 8 },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
});

export default AcceptHireScreen;
