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
import { Image } from 'expo-image';
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

  // Collect all action cards in conversation
  const actionCards = messages.filter(
    (m) => m.message_type === 'action_card' && m.card_type != null,
  );

  // Keep track of cycle index for jumping
  const [jumpIndex, setJumpIndex] = useState(0);
  const isInitialMountRef = useRef(true);

  // Latest unresolved or latest action card for header display
  const activeActionCard =
    [...actionCards]
      .reverse()
      .find(
        (m) => !m.card_resolved && !!m.card_type && relevantCardTypes.includes(m.card_type as any),
      ) || actionCards[actionCards.length - 1];

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
      case 'mark_complete':
        return {
          icon: 'checkmark-circle-outline' as const,
          label: 'Mark Job Complete',
          color: colors.success,
          bg: '#DCFCE7',
        };
      case 'flag_offline':
        return {
          icon: 'flag-outline' as const,
          label: 'Flag as Done',
          color: colors.warning,
          bg: '#FEF3C7',
        };
      case 'unlock_request':
        return {
          icon: 'lock-open-outline' as const,
          label: status === 'open' ? 'Chat Reopened' : 'Chat Reopen Request',
          color: colors.primary,
          bg: colors.peach,
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
          label: 'Action Card',
          color: colors.primary,
          bg: colors.primaryTint,
        };
    }
  };

  const currentCard = actionCards[jumpIndex % Math.max(1, actionCards.length)] || activeActionCard;
  const pinnedDetails = getPinnedCardDetails(currentCard);
  const currentCardNumber = actionCards.length > 0 ? (jumpIndex % actionCards.length) + 1 : 0;

  const handleJumpToCard = () => {
    if (actionCards.length === 0) return;
    const targetCard = actionCards[jumpIndex % actionCards.length];
    const nextIndex = (jumpIndex + 1) % actionCards.length;
    setJumpIndex(nextIndex);

    const cardIndex = messages.findIndex((m) => m.id === targetCard.id);
    if (cardIndex >= 0) {
      try {
        flatListRef.current?.scrollToIndex({
          index: cardIndex,
          animated: true,
          viewPosition: 0.25,
        });
      } catch {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, cardIndex * 120),
          animated: true,
        });
      }
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
          <View style={styles.headerAvatar}>
            {conversation?.other_user?.avatar_url ? (
              <Image
                source={{ uri: conversation.other_user.avatar_url }}
                cachePolicy="memory-disk"
                priority="high"
                transition={150}
                style={styles.headerAvatarImage}
              />
            ) : (
              <View style={styles.headerAvatarFallback}>
                <Text style={styles.headerAvatarText}>
                  {(otherUserName || conversation?.other_user?.name || '?').charAt(0)}
                </Text>
              </View>
            )}
          </View>
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

        {/* Minimalist Pinned Action Banner with Single Jump Button */}
        {pinnedDetails && actionCards.length > 0 && (
          <View style={styles.pinnedWrapper}>
            <TouchableOpacity
              style={[styles.pinnedBar, { borderLeftColor: pinnedDetails.color }]}
              activeOpacity={0.8}
              onPress={handleJumpToCard}
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
                  <Text style={styles.pinnedEyebrow}>
                    ACTION CARDS ({currentCardNumber}/{actionCards.length})
                  </Text>
                </View>
                <Text style={styles.pinnedTitle} numberOfLines={1}>
                  {pinnedDetails.label}
                </Text>
              </View>
              <View style={styles.pinnedButtonsRow}>
                <TouchableOpacity
                  style={styles.jumpBtn}
                  onPress={handleJumpToCard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpBtnText}>
                    Jump ({currentCardNumber}/{actionCards.length})
                  </Text>
                  <Ionicons name="swap-vertical" size={13} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
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
          initialNumToRender={50}
          maxToRenderPerBatch={30}
          windowSize={21}
          removeClippedSubviews={false}
          onEndReached={() => {
            if (hasNextPage) fetchNextPage();
          }}
          ListHeaderComponent={
            isFetchingNextPage ? (
              <ActivityIndicator size="small" color={colors.primary} style={{ margin: 10 }} />
            ) : null
          }
          onScrollToIndexFailed={(info) => {
            flatListRef.current?.scrollToOffset({
              offset: Math.max(0, info.averageItemLength * info.index),
              animated: false,
            });
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index: info.index,
                animated: true,
                viewPosition: 0.25,
              });
            }, 100);
          }}
          onContentSizeChange={() => {
            if (isInitialMountRef.current) {
              flatListRef.current?.scrollToEnd({ animated: false });
              isInitialMountRef.current = false;
            }
          }}
          onLayout={() => {
            if (isInitialMountRef.current) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          renderItem={({ item }) => {
            if (item.message_type === 'action_card') {
              return (
                <ActionCard
                  message={item}
                  currentUserId={user?.id || 0}
                  currentUserRole={user?.role as 'worker' | 'employer'}
                  conversationId={conversationId}
                  conversationStatus={status}
                  applicationStatus={conversation?.application_status}
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
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 4,
  },
  headerAvatar: {
    marginRight: 10,
  },
  headerAvatarImage: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  headerAvatarFallback: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.peach,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  headerAvatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.primaryDark,
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.70)',
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pinnedBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderLeftWidth: 3.5,
  },
  pinnedBarAlert: {
    backgroundColor: '#F0FDF4',
    borderBottomWidth: 1,
    borderBottomColor: '#BBF7D0',
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
    gap: 4,
    backgroundColor: colors.peach,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(200, 90, 50, 0.15)',
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(226, 232, 240, 0.70)',
  },
  iconBtn: { padding: 8 },
  input: {
    flex: 1,
    backgroundColor: 'rgba(248, 250, 252, 0.85)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
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
