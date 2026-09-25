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
import { useConversations } from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';

type ConfirmHireScreenRouteProp = RouteProp<EmployerStackParamList, 'ConfirmHire'>;
type ConfirmHireScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ConfirmHire'
>;

const ConfirmHireScreen: React.FC = () => {
  const route = useRoute<ConfirmHireScreenRouteProp>();
  const navigation = useNavigation<ConfirmHireScreenNavigationProp>();
  const {
    applicantId,
    applicantName,
    jobTitle,
    barangay,
    municipality,
    reputationScore,
    conversationId,
  } = route.params;

  const { data: conversations } = useConversations('employer');
  const matchedConv = conversations?.find((c) => c.application_id === applicantId);
  const activeConversationId = conversationId || matchedConv?.id || 0;

  const { data: messagesData } = useMessages(activeConversationId);
  const messages = messagesData?.messages || [];

  const hasRealMessageFromEmployer = messages.some(
    (m) =>
      m.sender_id !== null &&
      m.message_type !== 'action_card' &&
      m.message_type !== 'system' &&
      ((m.message_type === 'text' && Boolean(m.body?.trim())) || m.message_type === 'image'),
  );

  const [price, setPrice] = useState<string>('');
  const confirmHireMutation = useConfirmHire();
  const { showAlert } = useAlert();

  const handleConfirm = () => {
    const numPrice = parseFloat(price);
    if (confirmHireMutation.isPending || isNaN(numPrice) || numPrice <= 0) return;

    if (!hasRealMessageFromEmployer) {
      showAlert(
        'Chat Required',
        'Please message the worker in chat to discuss and agree on terms before confirming the hire.',
        [
          {
            text: 'Go to Chat',
            onPress: () => {
              if (activeConversationId) {
                navigation.navigate('Chat' as any, {
                  conversationId: activeConversationId,
                  jobTitle,
                  otherUserName: applicantName,
                });
              } else {
                navigation.goBack();
              }
            },
          },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    confirmHireMutation.mutate(
      { id: applicantId, price: numPrice },
      {
        onSuccess: (data: any) => {
          const convId = data?.conversation_id || conversationId;
          showAlert(
            'Offer Sent!',
            `Your hire offer of ₱${numPrice.toLocaleString()} has been sent to ${applicantName}. Once they accept, the job will officially begin.`,
            [
              {
                text: 'Go to Chat',
                onPress: () => {
                  if (convId) {
                    navigation.navigate('Chat' as any, {
                      conversationId: convId,
                      jobTitle,
                      otherUserName: applicantName,
                    });
                  } else {
                    navigation.goBack();
                  }
                },
              },
            ],
          );
        },
        onError: (err: any) => {
          showAlert('Error', err.message || 'Could not confirm hire.');
        },
      },
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Send hire offer</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* 5-Stage Tracker */}
          <View style={styles.stages}>
            <View style={styles.stageActive}>
              <View style={[styles.stageCircle, styles.stageDone]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
              <Text style={styles.stageLabel}>Applied</Text>
            </View>
            <View style={[styles.stageDivider, styles.stageDoneDivider]} />
            <View style={styles.stageActive}>
              <View style={[styles.stageCircle, styles.stageDone]}>
                <Ionicons name="checkmark" size={14} color="white" />
              </View>
              <Text style={styles.stageLabel}>Shortlist</Text>
            </View>
            <View style={[styles.stageDivider, styles.stageDoneDivider]} />
            <View style={styles.stageActive}>
              <View style={[styles.stageCircle, styles.stageCircleActive]}>
                <Text style={styles.stageCircleTextActive}>3</Text>
              </View>
              <Text style={styles.stageLabel}>Offer</Text>
            </View>
            <View style={styles.stageDivider} />
            <View style={styles.stage}>
              <View style={styles.stageCircle}>
                <Text style={styles.stageCircleText}>4</Text>
              </View>
              <Text style={styles.stageLabel}>Hired</Text>
            </View>
            <View style={styles.stageDivider} />
            <View style={styles.stage}>
              <View style={styles.stageCircle}>
                <Text style={styles.stageCircleText}>5</Text>
              </View>
              <Text style={styles.stageLabel}>Done</Text>
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
              <Text style={styles.applicantStats}>
                {[barangay, municipality].filter(Boolean).join(', ') || 'Local Worker'}
                {reputationScore != null ? ` • ${Number(reputationScore).toFixed(1)} ★` : ''}
              </Text>
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
          {!hasRealMessageFromEmployer ? (
            <View style={{ gap: 8 }}>
              <Button
                label="Chat with Worker First"
                variant="primary"
                size="lg"
                fullWidth
                onPress={() => {
                  if (activeConversationId) {
                    navigation.navigate('Chat' as any, {
                      conversationId: activeConversationId,
                      jobTitle,
                      otherUserName: applicantName,
                    });
                  } else {
                    navigation.goBack();
                  }
                }}
              />
              <Text
                style={{
                  fontFamily: fonts.body,
                  fontSize: 12,
                  color: colors.inkSoft,
                  textAlign: 'center',
                }}
              >
                You must discuss details in chat with {applicantName} before sending an offer.
              </Text>
            </View>
          ) : (
            <Button
              label={`Send Offer at ₱${price || '0'}`}
              variant="primary"
              size="lg"
              fullWidth
              onPress={handleConfirm}
              disabled={!price}
              loading={confirmHireMutation.isPending}
            />
          )}
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
  stageDoneDivider: {
    backgroundColor: colors.mintDeep,
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
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    padding: 22,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  priceEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
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
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
});

export default ConfirmHireScreen;
