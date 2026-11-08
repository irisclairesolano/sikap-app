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
import { useLanguage } from '../../contexts/LanguageContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity } from 'react-native';

type SendRequestScreenRouteProp = RouteProp<EmployerStackParamList, 'SendRequest'>;
type SendRequestScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'SendRequest'
>;

const SendRequestScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const route = useRoute<SendRequestScreenRouteProp>();
  const navigation = useNavigation<SendRequestScreenNavigationProp>();
  const { id, applicantName, jobTitle } = route.params;

  const jobRequestMutation = useJobRequest();
  const { showAlert } = useAlert();

  const handleSendRequest = () => {
    jobRequestMutation.mutate(id, {
      onSuccess: () => {
        showAlert(
          t('hiring_shortlist_action'),
          t('hiring_shortlist_success_msg', { applicantName }),
          [{ text: 'OK', onPress: () => navigation.goBack() }],
        );
      },
      onError: (err: any) => {
        const rawMsg = err?.message || '';
        const userFriendlyMsg =
          !rawMsg ||
          rawMsg.includes('http://') ||
          rawMsg.includes('https://') ||
          rawMsg.includes('NotFoundHttpException')
            ? 'Unable to shortlist applicant. Please try again.'
            : rawMsg;
        showAlert('Error', userFriendlyMsg);
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('hiring_shortlist_action')}</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>
          {t('hiring_shortlist_prompt', {
            applicantName: applicantName || 'the applicant',
            jobTitle: jobTitle || 'this job',
          })}
        </Text>
        <Text style={styles.info}>{t('hiring_shortlist_info')}</Text>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label={t('hiring_shortlist_action')}
          onPress={handleSendRequest}
          loading={jobRequestMutation.isPending}
          variant="primary"
          size="lg"
          fullWidth
        />
        <Button
          label={t('cancel') || 'Cancel'}
          variant="outline"
          size="base"
          fullWidth
          onPress={() => navigation.goBack()}
          disabled={jobRequestMutation.isPending}
        />
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
    marginBottom: 16,
    lineHeight: 24,
  },
  bold: { fontFamily: fonts.bodyBold, color: colors.primary },
  info: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 20,
    lineHeight: 20,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    gap: 8,
  },
});

export default SendRequestScreen;
