import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useConfirmHire } from '../../hooks/useJobApplications';
import { useAlert } from '../../contexts/AlertContext';

type ConfirmHireScreenRouteProp = RouteProp<EmployerStackParamList, 'ConfirmHire'>;
type ConfirmHireScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ConfirmHire'
>;

const ConfirmHireScreen: React.FC = () => {
  const route = useRoute<ConfirmHireScreenRouteProp>();
  const navigation = useNavigation<ConfirmHireScreenNavigationProp>();
  const { applicantId, applicantName, jobTitle } = route.params;

  const [price, setPrice] = useState<string>('');
  const confirmHireMutation = useConfirmHire();
  const { showAlert } = useAlert();

  const handleConfirm = () => {
    confirmHireMutation.mutate(
      { id: applicantId, price: parseFloat(price) },
      {
        onSuccess: () => {
          showAlert(
            'Hire Confirmed!',
            `${applicantName} has been hired for ${jobTitle}. You can now view their contact details.`,
            [{ text: 'OK', onPress: () => navigation.popToTop() }],
          );
        },
        onError: (err: any) => {
          showAlert('Error', err.message || 'Could not confirm hire.');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Confirm hire</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 4-Stage Tracker */}
          <View style={styles.stages}>
            <View style={styles.stage}>
              <View style={[styles.stageCircle, styles.stageDone]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
              <Text style={styles.stageLabel}>Applied</Text>
            </View>
            <View style={[styles.stageDivider, styles.stageDone]} />
            <View style={styles.stage}>
              <View style={[styles.stageCircle, styles.stageDone]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
              <Text style={styles.stageLabel}>Shortlisted</Text>
            </View>
            <View style={styles.stageDivider} />
            <View style={styles.stageActive}>
              <View style={[styles.stageCircle, styles.stageCircleActive]}>
                <Text style={styles.stageCircleTextActive}>3</Text>
              </View>
              <Text style={styles.stageLabel}>Confirm</Text>
            </View>
            <View style={styles.stageDivider} />
            <View style={styles.stage}>
              <View style={styles.stageCircle}>
                <Text style={styles.stageCircleText}>4</Text>
              </View>
              <Text style={styles.stageLabel}>Hired</Text>
            </View>
          </View>

          {/* Applicant Summary */}
          <View style={styles.applicantCard}>
            <View style={styles.avatarSmall}>
              <Text style={styles.avatarSmallText}>{applicantName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.nameRow}>
                <Text style={styles.applicantName}>{applicantName}</Text>
                <View style={styles.verifiedBadgeSmall}>
                  <Ionicons name="checkmark-circle" size={12} color="white" />
                </View>
              </View>
              <Text style={styles.applicantStats}>San Rafael • 4.8 • 12 hires</Text>
            </View>
          </View>

          {/* Price Input */}
          <View style={styles.priceCard}>
            <Text style={styles.priceEyebrow}>Final agreed price</Text>
            <View style={styles.priceInputRow}>
              <Text style={styles.currencySymbol}>₱</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="numeric"
                  placeholder="0"
                  value={price}
                  onChangeText={setPrice}
                  placeholderTextColor={colors.inkFaint}
                />
              </View>
            </View>
            <Text style={styles.priceHelper}>
              Total amount for the job. For 3 days at ₱600/day, enter ₱1,800.
            </Text>
          </View>

          {/* What Happens Next */}
          <View style={styles.nextSection}>
            <Text style={styles.nextEyebrow}>What happens next</Text>
            <View style={styles.nextList}>
              <View style={styles.nextItem}>
                <View style={styles.nextNumBadge}>
                  <Text style={styles.nextNum}>1</Text>
                </View>
                <Text style={styles.nextText}>
                  <Text style={styles.nextTextBold}>The slot locks.</Text> No other applicant can be
                  confirmed.
                </Text>
              </View>
              <View style={styles.nextItem}>
                <View style={styles.nextNumBadge}>
                  <Text style={styles.nextNum}>2</Text>
                </View>
                <Text style={styles.nextText}>
                  <Text style={styles.nextTextBold}>
                    {applicantName.split(' ')[0]} has 24 hours to respond.
                  </Text>{' '}
                  They will get an SMS reminder.
                </Text>
              </View>
              <View style={styles.nextItem}>
                <View style={styles.nextNumBadge}>
                  <Text style={styles.nextNum}>3</Text>
                </View>
                <Text style={styles.nextText}>
                  <Text style={styles.nextTextBold}>If they accept,</Text> a digital receipt is
                  generated.
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={`Confirm at ₱${price || '0'}`}
            variant="primary"
            size="lg"
            fullWidth
            icon={<Ionicons name="lock-closed" size={18} color="white" />}
            onPress={handleConfirm}
            disabled={!price}
            loading={confirmHireMutation.isPending}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
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
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  stage: {
    alignItems: 'center',
    opacity: 0.5,
  },
  stageActive: {
    alignItems: 'center',
    opacity: 1,
  },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageCircleActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  stageDone: {
    borderColor: colors.mintDeep,
    backgroundColor: colors.mintDeep,
    borderWidth: 0,
  },
  stageCircleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkMuted,
  },
  stageCircleTextActive: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: 'white',
  },
  stageLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.ink,
  },
  stageDivider: {
    height: 2,
    flex: 1,
    backgroundColor: colors.inkFaint,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  applicantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 14,
    gap: 12,
    ...shadows.sm,
    marginBottom: 16,
  },
  avatarSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.primaryDark,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  applicantName: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  verifiedBadgeSmall: {
    backgroundColor: colors.mintDeep,
    borderRadius: 8,
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applicantStats: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  priceCard: {
    backgroundColor: colors.butter,
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
  },
  priceEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
    marginBottom: 8,
  },
  priceInputRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 10,
  },
  currencySymbol: {
    fontFamily: fonts.bodyBold,
    fontSize: 32,
    color: colors.ink,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  priceInput: {
    fontFamily: fonts.bodyBold,
    fontSize: 36,
    color: colors.ink,
    padding: 0,
    margin: 0,
  },
  priceHelper: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  nextSection: {
    marginTop: 8,
  },
  nextEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  nextList: {
    gap: 12,
  },
  nextItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  nextNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextNum: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
  },
  nextText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 20,
  },
  nextTextBold: {
    fontFamily: fonts.bodyBold,
  },
  footer: {
    padding: 20,
    paddingBottom: 24,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
});

export default ConfirmHireScreen;
