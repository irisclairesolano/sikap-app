import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

import { useMessages, useSendMessage, useSendImage, useMarkRead } from '../../hooks/useMessages';
import {
  useConversations,
  useUnlockConversation,
  useRequestUnlock,
} from '../../hooks/useConversations';
import { useAuth } from '../../hooks/useAuth';
import MessageBubble from '../../components/chat/MessageBubble';
import ActionCard from '../../components/chat/ActionCard';
import { colors, fonts } from '../../theme';

type ChatScreenParams = {
  conversationId: number;
  jobTitle?: string;
  otherUserName?: string;
};

const ChatScreen: React.FC = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { conversationId, jobTitle, otherUserName } = route.params as ChatScreenParams;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const sendImage = useSendImage(conversationId);
  const markRead = useMarkRead(conversationId);

  const { data: convData } = useConversations();
  const unlockConversation = useUnlockConversation();
  const requestUnlock = useRequestUnlock();

  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef<FlatList>(null);

  const conversation = convData?.find((c) => c.id === conversationId);
  const status = conversation?.status || 'open';
  const isLocked = status === 'locked';
  const isUnlockRequested = status === 'unlock_requested';

  const messages = data?.messages || [];
  const messageCount = messages.length;

  useEffect(() => {
    if (messageCount > 0) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  const handleSendText = () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    sendMessage.mutate(textToSend, {
      onError: () => {
        setInputText(textToSend);
      },
      onSuccess: () => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      sendImage.mutate(result.assets[0].uri, {
        onSuccess: () => {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
      });
    }
  };

  // Cards that each role should see pinned
  const EMPLOYER_CARD_TYPES = ['confirm_hire', 'cancel_hire', 'mark_complete', 'unlock_request'];
  const WORKER_CARD_TYPES = [
    'accept_or_reject',
    'flag_offline',
    'unlock_request',
    'employer_contact_reveal',
  ];
  const relevantCardTypes = user?.role === 'employer' ? EMPLOYER_CARD_TYPES : WORKER_CARD_TYPES;

  // Find latest unresolved action card relevant to current user role
  const activeActionCard = [...messages]
    .reverse()
    .find(
      (m) =>
        m.message_type === 'action_card' &&
        !m.card_resolved &&
        m.card_type != null &&
        relevantCardTypes.includes(m.card_type),
    );

  const [isPinnedCardExpanded, setIsPinnedCardExpanded] = useState(false);

  const getPinnedCardDetails = (card: typeof activeActionCard) => {
    if (!card || !card.card_type) return null;
    switch (card.card_type) {
      case 'confirm_hire':
        return {
          icon: 'cash-outline' as const,
          label: user?.role === 'employer' ? 'Set Price & Confirm Hire' : 'Awaiting Employer Offer',
          color: colors.primary,
          bg: colors.peach,
        };
      case 'accept_or_reject':
        return {
          icon: 'document-text-outline' as const,
          label:
            user?.role === 'worker'
              ? `Offer Received (₱${String(card.card_data?.price ?? '')})`
              : 'Offer Sent to Worker',
          color: colors.success,
          bg: '#DCFCE7',
        };
      case 'cancel_hire':
        return {
          icon: 'close-circle-outline' as const,
          label: 'Hiring Cancellation',
          color: colors.error,
          bg: '#FEE2E2',
        };
      case 'employer_contact_reveal':
        return {
          icon: 'call-outline' as const,
          label: 'Employer Contact Info',
          color: colors.primary,
          bg: colors.sky,
        };
      case 'worker_contact_reveal':
        return {
          icon: 'call-outline' as const,
          label: 'Worker Contact Info',
          color: colors.primary,
          bg: colors.sky,
        };
      default:
        return {
          icon: 'flash-outline' as const,
          label: 'Pending Action',
          color: colors.primary,
          bg: colors.primaryTint,
        };
    }
  };

  const pinnedDetails = getPinnedCardDetails(activeActionCard);

  const handleJumpToCard = () => {
    if (!activeActionCard) return;
    const cardIndex = messages.findIndex((m) => m.id === activeActionCard.id);
    if (cardIndex >= 0) {
      flatListRef.current?.scrollToIndex({ index: cardIndex, animated: true, viewPosition: 0.5 });
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerName} numberOfLines={1}>
              {otherUserName || conversation?.other_user?.name}
            </Text>
            <Text style={styles.headerJob} numberOfLines={1}>
              {jobTitle || conversation?.job_title}
            </Text>
          </View>
          {isLocked ? (
            <View style={styles.lockedPill}>
              <Ionicons name="lock-closed" size={12} color={colors.inkMuted} />
              <Text style={styles.lockedPillText}>Locked</Text>
            </View>
          ) : (
            <View style={styles.activeDot} />
          )}
        </View>

        {/* Minimalist Pinned Action Card */}
        {pinnedDetails && activeActionCard && (
          <View style={styles.pinnedWrapper}>
            <TouchableOpacity
              style={[styles.pinnedBar, { borderLeftColor: pinnedDetails.color }]}
              activeOpacity={0.8}
              onPress={() => setIsPinnedCardExpanded((prev) => !prev)}
            >
              <View style={[styles.pinnedIconBadge, { backgroundColor: pinnedDetails.bg }]}>
                <Ionicons name={pinnedDetails.icon} size={15} color={pinnedDetails.color} />
              </View>
              <View style={styles.pinnedTextContainer}>
                <View style={styles.pinnedLabelRow}>
                  <Ionicons
                    name="pin"
                    size={11}
                    color={colors.primary}
                    style={{ marginRight: 3 }}
                  />
                  <Text style={styles.pinnedEyebrow}>PINNED ACTION</Text>
                </View>
                <Text style={styles.pinnedTitle} numberOfLines={1}>
                  {pinnedDetails.label}
                </Text>
              </View>
              <View style={styles.pinnedButtonsRow}>
                <TouchableOpacity
                  style={styles.jumpBtn}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleJumpToCard();
                  }}
                >
                  <Text style={styles.jumpBtnText}>Jump</Text>
                  <Ionicons name="arrow-down" size={12} color={colors.primary} />
                </TouchableOpacity>
                <Ionicons
                  name={isPinnedCardExpanded ? 'chevron-up' : 'chevron-down'}
                  size={16}
                  color={colors.inkMuted}
                />
              </View>
            </TouchableOpacity>

            {/* Expandable Inline Card Drawer */}
            {isPinnedCardExpanded && (
              <View style={styles.pinnedDrawer}>
                <ActionCard
                  message={activeActionCard}
                  currentUserId={user?.id || 0}
                  currentUserRole={user?.role as 'worker' | 'employer'}
                  conversationId={conversationId}
                  onActionComplete={() => {
                    refetch();
                    setIsPinnedCardExpanded(false);
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* Lock Banner */}
        {(isLocked || isUnlockRequested) && (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerText}>
              {isUnlockRequested
                ? 'Reopen request pending employer approval.'
                : 'This chat was locked when the job concluded.'}
            </Text>
            {user?.role === 'employer' ? (
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() =>
                  unlockConversation.mutate(conversationId, { onSuccess: () => refetch() })
                }
                disabled={unlockConversation.isPending}
              >
                <Text style={styles.bannerBtnText}>Unlock Chat</Text>
              </TouchableOpacity>
            ) : isLocked ? (
              <TouchableOpacity
                style={styles.bannerBtn}
                onPress={() => requestUnlock.mutate(conversationId, { onSuccess: () => refetch() })}
                disabled={requestUnlock.isPending}
              >
                <Text style={styles.bannerBtnText}>Request to Reopen</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.pendingText}>Request Pending…</Text>
            )}
          </View>
        )}

        {/* Message List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          inverted={false}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ margin: 10 }} />
            ) : null
          }
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            if (item.message_type === 'action_card') {
              return (
                <ActionCard
                  message={item}
                  currentUserId={user?.id || 0}
                  currentUserRole={user?.role as 'worker' | 'employer'}
                  conversationId={conversationId}
                  onActionComplete={refetch}
                />
              );
            }
            return <MessageBubble message={item} isOwnMessage={item.sender_id === user?.id} />;
          }}
        />

        {/* First-message restriction notice for workers */}
        {status === 'open' &&
          user?.role === 'worker' &&
          messages.filter(
            (m) =>
              m.message_type !== 'action_card' &&
              m.message_type !== 'system' &&
              m.sender_id !== null,
          ).length === 0 && (
            <View style={styles.firstMsgNotice}>
              <Ionicons name="information-circle-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.firstMsgNoticeText}>
                The employer will send the first message to start the conversation.
              </Text>
            </View>
          )}

        {/* Input Bar */}
        {status === 'open' && (
          <View style={styles.inputContainer}>
            <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn} activeOpacity={0.6}>
              <Ionicons name="image-outline" size={24} color={colors.inkMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={colors.inkLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={1000}
            />
            {inputText.length > 800 && (
              <Text style={[styles.charCounter, inputText.length > 950 && { color: colors.error }]}>
                {inputText.length}/1000
              </Text>
            )}
            <TouchableOpacity
              onPress={handleSendText}
              style={styles.iconBtn}
              activeOpacity={0.6}
              disabled={!inputText.trim()}
            >
              <Ionicons
                name="send"
                size={24}
                color={inputText.trim() ? colors.primary : colors.inkLight}
              />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.paper },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 2,
    elevation: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitleContainer: { flex: 1 },
  headerName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  headerJob: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 1 },
  lockedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paper,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  lockedPillText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.success,
  },
  pinnedWrapper: {
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    zIndex: 10,
  },
  pinnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    backgroundColor: colors.paperBright,
    borderLeftWidth: 3.5,
  },
  pinnedIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pinnedTextContainer: {
    flex: 1,
  },
  pinnedLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinnedEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 9,
    letterSpacing: 0.6,
    color: colors.primary,
    textTransform: 'uppercase',
  },
  pinnedTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.ink,
    marginTop: 1,
  },
  pinnedButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  jumpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  jumpBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primary,
  },
  pinnedDrawer: {
    padding: 12,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  lockBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF3C7',
    padding: 12,
  },
  lockBannerText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: '#D97706',
    flex: 1,
  },
  bannerBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  bannerBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  pendingText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#D97706',
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  iconBtn: { padding: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.paper,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  firstMsgNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.paper,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  firstMsgNoticeText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    flex: 1,
    lineHeight: 16,
  },
  charCounter: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    alignSelf: 'center',
    paddingHorizontal: 4,
  },
});

export default ChatScreen;
