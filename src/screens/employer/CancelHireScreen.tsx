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
import { useLanguage } from '../../contexts/LanguageContext';

import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import { safeGoBack } from '../../utils/navigation';

type CancelHireScreenRouteProp = RouteProp<EmployerStackParamList, 'CancelHire'>;
type CancelHireScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'CancelHire'
>;

const CancelHireScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const route = useRoute<CancelHireScreenRouteProp>();
  const navigation = useNavigation<CancelHireScreenNavigationProp>();
  const { id, applicantName, jobTitle, jobId } = route.params;

  const cancelHireMutation = useCancelHire();
  const { showAlert } = useAlert();

  const handleGoBack = React.useCallback(() => {
    if (jobId) {
      safeGoBack(navigation, 'JobStatusManagement', { id: jobId });
    } else {
      safeGoBack(navigation, 'MyJobsList');
    }
  }, [navigation, jobId]);

  React.useEffect(() => {
    const onBackPress = () => {
      handleGoBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [handleGoBack]);

  const handleCancelHire = () => {
    cancelHireMutation.mutate(id, {
      onSuccess: () => {
        showAlert(
          t('alert_cancel_hire_title'),
          t('alert_cancel_hire_success_msg').replace('{name}', applicantName || ''),
          [{ text: 'OK', onPress: handleGoBack }],
        );
      },
      onError: (err: any) => {
        showAlert(t('error_title'), err.message || t('alert_cancel_hire_err_msg'));
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleGoBack}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>{t('hiring_cancel_hire_title')}</Text>
        </View>
        <View style={styles.iconBtn} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.prompt}>
          {t('confirm_cancel_hire_prompt')} <Text style={styles.bold}>{applicantName}</Text> (
          {jobTitle})?
        </Text>
        <View style={styles.warningBox}>
          <Text style={styles.warningText}>{t('hiring_cancel_hire_warning')}</Text>
        </View>
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <Button
          label={t('hiring_cancel_hire_confirm_btn')}
          onPress={handleCancelHire}
          loading={cancelHireMutation.isPending}
          variant="danger"
          size="lg"
          fullWidth
        />
        <Button
          label={t('hiring_cancel_hire_back_btn')}
          variant="outline"
          size="base"
          fullWidth
          onPress={() => navigation.goBack()}
          disabled={cancelHireMutation.isPending}
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
    marginBottom: 24,
    lineHeight: 24,
  },
  bold: { fontFamily: fonts.bodyBold, color: colors.primary },
  warningBox: {
    backgroundColor: colors.status.pending.bg,
    borderColor: colors.warning,
    borderWidth: 1,
    padding: 16,
    borderRadius: 12,
    marginBottom: 18,
  },
  warningText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.status.pending.text,
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

export default CancelHireScreen;
