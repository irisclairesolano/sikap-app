import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { useQueryClient } from '@tanstack/react-query';
import { useMessages, useSendMessage, useSendImage, useMarkRead } from '../../hooks/useMessages';
import {
  useConversations,
  useConversation,
  useUnlockConversation,
  useRequestUnlock,
} from '../../hooks/useConversations';
import { useBlockUser, useUnblockUser } from '../../hooks/useBlockedUsers';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import MessageBubble from '../../components/chat/MessageBubble';
import ActionCard from '../../components/chat/ActionCard';
import QuickReplyChips from '../../components/chat/QuickReplyChips';
import { TypingIndicator } from '../../components/chat/TypingIndicator';
import { useRealtimeChat } from '../../services/realtime';
import { messagesApi } from '../../api/messages';
import { triggerHaptic } from '../../utils/haptics';
import { colors, fonts } from '../../theme';

const EMPLOYER_OUTREACH_CARD_TYPES = [
  'job_request',
  'confirm_hire',
  'accept_or_reject',
  'worker_contact_reveal',
  'employer_contact_reveal',
  'mark_complete',
  'flag_offline',
];

export function deduplicateActionCardMessages(
  messagesList: any[],
  currentUserRole?: 'worker' | 'employer',
  applicationStatus?: string,
): any[] {
  if (!messagesList || messagesList.length === 0) return [];

  // 1. Deduplicate by message ID first
  const seenIds = new Set<number>();
  const uniqueById: any[] = [];
  for (const m of messagesList) {
    if (m && m.id != null && !seenIds.has(m.id)) {
      seenIds.add(m.id);
      uniqueById.push(m);
    }
  }

  // 2. Identify the action group for each action card
  const getActionGroup = (m: any): string | null => {
    if (m.message_type !== 'action_card' || !m.card_type) return null;

    switch (m.card_type) {
      case 'job_request':
      case 'confirm_hire':
        return 'job_proposal';
      case 'accept_or_reject':
        return 'accept_or_reject';
      case 'cancel_hire':
        return 'cancel_hire';
      case 'worker_contact_reveal':
        return 'worker_contact_reveal';
      case 'employer_contact_reveal':
        return 'employer_contact_reveal';
      case 'unlock_request':
        return 'unlock_request';
      case 'mark_complete':
      case 'flag_offline':
        // If the job is completed, there must be ONLY ONE completion action card in the whole chat
        if (applicationStatus === 'completed') {
          return 'job_completion';
        }
        return m.card_type;
      default:
        return m.card_type;
    }
  };

  // Find the ID of the latest card for each action group
  const latestActionCardIdByGroup = new Map<string, number>();
  for (let i = uniqueById.length - 1; i >= 0; i--) {
    const m = uniqueById[i];
    const group = getActionGroup(m);
    if (group && !latestActionCardIdByGroup.has(group)) {
      latestActionCardIdByGroup.set(group, m.id);
    }
  }

  // Check if worker has flagged the job as completed offline
  const isWorkerFlagged = uniqueById.some(
    (m) => m.card_type === 'flag_offline' && Boolean(m.card_data?.is_flagged),
  );

  // Filter messages: keep non-action_cards and only the latest card per action
  return uniqueById.filter((m) => {
    const group = getActionGroup(m);
    if (!group) return true;

    // If worker was the first to flag as complete, employer should not see "Mark Job as Complete"
    if (m.card_type === 'mark_complete' && isWorkerFlagged && applicationStatus !== 'completed') {
      return false;
    }

    // If cancel_hire is present but job is already accepted or completed, omit it
    if (
      m.card_type === 'cancel_hire' &&
      ['accepted', 'completed'].includes(applicationStatus || '')
    ) {
      return false;
    }

    return latestActionCardIdByGroup.get(group) === m.id;
  });
}

type ChatScreenParams = {
  conversationId: number;
  jobTitle?: string;
  otherUserName?: string;
  myRole?: 'worker' | 'employer';
};

const ChatScreen: React.FC = () => {
  const { showAlert } = useAlert();
  const route = useRoute();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const {
    conversationId,
    jobTitle,
    otherUserName,
    myRole: paramMyRole,
  } = route.params as ChatScreenParams;

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, refetch } =
    useMessages(conversationId);
  const sendMessage = useSendMessage(conversationId);
  const sendImage = useSendImage(conversationId);
  const markRead = useMarkRead(conversationId);

  const { data: directConv } = useConversation(conversationId);
  const { data: convData } = useConversations();
  const unlockConversation = useUnlockConversation();
  const requestUnlock = useRequestUnlock();

  const { user } = useAuth();

  const [inputText, setInputText] = useState('');
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showQuickReplies, setShowQuickReplies] = useState(true);
  const [showScrollBottomFab, setShowScrollBottomFab] = useState(false);
  const [newMessagesBelow, setNewMessagesBelow] = useState(0);
  const flatListRef = useRef<FlatList>(null);
  const isInitialMountRef = useRef(true);
  const prevMessagesLengthRef = useRef(0);
  const lastMessageIdRef = useRef<number | null>(null);
  const isNearBottomRef = useRef(true);

  const [typingUser, setTypingUser] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingPingRef = useRef<number>(0);

  const handlePartnerTyping = useCallback((name: string) => {
    setTypingUser(name);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTypingUser(null);
    }, 3500);
  }, []);

  useRealtimeChat({
    conversationId,
    currentUserId: user?.id,
    onTyping: handlePartnerTyping,
  });

  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  const conversation = directConv || convData?.find((c) => c.id === conversationId);
  const status = conversation?.status || 'open';
  const isLocked = status === 'locked';
  const isUnlockRequested = status === 'unlock_requested';
  const isSlotLocked =
    Boolean((conversation as any)?.is_slot_locked) ||
    (conversation as any)?.slots_full === true ||
    conversation?.application_status === 'slots_filled' ||
    (isLocked && status === 'locked' && (conversation as any)?.lock_reason === 'slots_full');

  // Role resolution: In this specific conversation, determine whether the user is the employer or worker
  const conversationUserRole: 'worker' | 'employer' =
    paramMyRole ||
    conversation?.my_role ||
    (conversation?.employer_id && user?.id
      ? conversation.employer_id === user.id
        ? 'employer'
        : 'worker'
      : (user?.role as 'worker' | 'employer') || 'worker');

  const otherUserId =
    conversation?.other_user?.id ??
    (conversationUserRole === 'employer' ? conversation?.worker_id : conversation?.employer_id) ??
    0;

  const isOtherUserDeleted =
    Boolean(conversation?.other_user?.is_deleted) ||
    conversation?.other_user?.name === 'Deleted Account';

  const isBlockedByMe = !!conversation?.is_blocked_by_me;
  const isBlockedByOther = !!conversation?.is_blocked_by_other;
  const isBlocked = isBlockedByMe || isBlockedByOther;

  const [inputError, setInputError] = useState<string | null>(null);

  const handleOpenUserProfile = () => {
    if (isOtherUserDeleted) return;
    if (conversationUserRole === 'employer') {
      const appId = conversation?.application_id;
      if (appId) {
        (navigation as any).navigate('ApplicantDetail', {
          applicantId: appId,
          applicantName: otherUserName || conversation?.other_user?.name,
          jobTitle: jobTitle || conversation?.job_title,
        });
      }
    } else {
      const empId = conversation?.employer_id ?? conversation?.other_user?.id;
      if (empId) {
        (navigation as any).navigate('EmployerPublicProfile', {
          employerId: empId,
          employerName: otherUserName || conversation?.other_user?.name,
          avatarUrl: conversation?.other_user?.avatar_url,
          jobTitle: jobTitle || conversation?.job_title,
        });
      }
    }
  };

  const rawMessages = data?.messages || [];
  const messages = useMemo(
    () =>
      deduplicateActionCardMessages(
        rawMessages,
        conversationUserRole,
        conversation?.application_status,
      ),
    [rawMessages, conversationUserRole, conversation?.application_status],
  );
  const messageCount = messages.length;

  const isWorkerReplyAllowed =
    conversationUserRole !== 'worker' ||
    messages.some(
      (m) =>
        m.sender_id === (conversation?.employer_id ?? conversation?.other_user?.id) ||
        EMPLOYER_OUTREACH_CARD_TYPES.includes(m.card_type || ''),
    );

  const handleBlockUser = () => {
    setShowOptionsMenu(false);
    if (!otherUserId) return;
    const targetName = otherUserName || conversation?.other_user?.name || 'this user';
    showAlert(
      'Block User',
      `Are you sure you want to block ${targetName}? They will no longer be able to message you, send job offers, or view your listings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: () => {
            blockUserMutation.mutate(otherUserId, {
              onSuccess: () => {
                showAlert('User Blocked', `${targetName} has been blocked.`);
                refetch();
              },
              onError: (err: any) => {
                showAlert('Block Failed', err.message || 'Could not block this user.');
              },
            });
          },
        },
      ],
    );
  };

  const handleUnblockUser = () => {
    setShowOptionsMenu(false);
    if (!otherUserId) return;
    const targetName = otherUserName || conversation?.other_user?.name || 'this user';
    showAlert('Unblock User', `Are you sure you want to unblock ${targetName}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Unblock',
        onPress: () => {
          unblockUserMutation.mutate(otherUserId, {
            onSuccess: () => {
              showAlert('User Unblocked', `${targetName} has been unblocked.`);
              refetch();
            },
            onError: (err: any) => {
              showAlert('Unblock Failed', err.message || 'Could not unblock this user.');
            },
          });
        },
      },
    ]);
  };

  const handleReportUser = () => {
    setShowOptionsMenu(false);
    if (!otherUserId) return;
    (navigation as any).navigate('Report', {
      id: Number(otherUserId),
      type: 'user',
      reportable_type: 'user',
      reportable_id: Number(otherUserId),
    });
  };

  useEffect(() => {
    if (messageCount > 0) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  useEffect(() => {
    if (messages.length === 0) return;

    const latestMessage = messages[messages.length - 1];

    if (prevMessagesLengthRef.current > 0 && messages.length > prevMessagesLengthRef.current) {
      // Check if new incoming message from the other participant
      const isIncoming =
        latestMessage &&
        latestMessage.sender_id != null &&
        latestMessage.sender_id !== user?.id &&
        latestMessage.id !== lastMessageIdRef.current;

      if (isIncoming) {
        triggerHaptic('medium');
      }

      // Automatically scroll to bottom on new message if already near bottom
      if (isNearBottomRef.current || !isIncoming) {
        requestAnimationFrame(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        });
      } else {
        // User has scrolled up: increment unread messages below badge and show FAB
        const countDiff = messages.length - prevMessagesLengthRef.current;
        if (countDiff > 0) {
          setNewMessagesBelow((prev) => prev + countDiff);
          setShowScrollBottomFab(true);
        }
      }
    } else if (isInitialMountRef.current && messages.length > 0) {
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      });
    }

    prevMessagesLengthRef.current = messages.length;
    lastMessageIdRef.current = latestMessage?.id ?? null;
  }, [messages, user?.id]);

  const handleSendText = () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;
    isNearBottomRef.current = true;
    triggerHaptic('light');
    setInputError(null);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    sendMessage.mutate(textToSend, {
      onError: (err: any) => {
        setInputText(textToSend);
        if (
          err.status === 422 ||
          (err.message && /prohibited|inappropriate|profanity|flagged/i.test(err.message))
        ) {
          setInputError(err.message || 'Message contains prohibited language.');
        } else {
          showAlert('Failed to Send', err.message || 'Could not send message. Please try again.');
        }
      },
      onSuccess: () => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      },
    });
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      let finalUri = result.assets[0].uri;
      try {
        const manipulated = await ImageManipulator.manipulateAsync(
          finalUri,
          [{ resize: { width: 1200 } }],
          { compress: 0.75, format: ImageManipulator.SaveFormat.JPEG },
        );
        finalUri = manipulated.uri;
      } catch (err) {
        console.log('Chat image compression error, using original', err);
      }

      isNearBottomRef.current = true;
      sendImage.mutate(finalUri, {
        onError: (err: any) => {
          showAlert(
            'Failed to Send Image',
            err.message || 'Could not send image. Please try again.',
          );
        },
        onSuccess: () => {
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        },
      });
    }
  };

  // Check if an action card is currently actionable for the current user based on hiring pipeline rules
  const isCardActionable = (m: (typeof messages)[0]): boolean => {
    if (m.message_type !== 'action_card' || !m.card_type || m.card_resolved) return false;

    const appStatus = conversation?.application_status;
    const convStatus = status; // 'open' | 'locked' | 'unlock_requested'
    const role = conversationUserRole;

    switch (m.card_type) {
      case 'unlock_request':
        return (
          role === 'employer' &&
          convStatus === 'unlock_requested' &&
          !m.card_resolved &&
          !m.card_data?.declined
        );

      case 'job_request':
      case 'confirm_hire':
        // Only employer can confirm price, and only if application has not advanced past pending
        return (
          role === 'employer' &&
          !['employer_confirmed', 'accepted', 'completed', 'cancelled', 'rejected'].includes(
            appStatus || '',
          )
        );

      case 'accept_or_reject':
        // Only worker can accept/reject, and only while offer is pending worker response
        return (
          role === 'worker' &&
          !['accepted', 'completed', 'rejected', 'cancelled'].includes(appStatus || '')
        );

      case 'cancel_hire':
        // Only employer can cancel hire before worker accepts
        return role === 'employer' && appStatus === 'employer_confirmed';

      case 'mark_complete': {
        // Only employer can mark job complete while job is in progress and not locked
        const hasFlaggedCard = messages.some(
          (other) =>
            other.card_type === 'flag_offline' &&
            Boolean(other.card_data?.is_flagged) &&
            !other.card_resolved,
        );
        return (
          role === 'employer' &&
          appStatus === 'accepted' &&
          convStatus !== 'locked' &&
          !hasFlaggedCard
        );
      }

      case 'flag_offline':
        // Worker can flag as complete if not flagged yet; Employer can confirm if flagged
        if (appStatus !== 'accepted') return false;
        if (role === 'worker') {
          return !m.card_data?.is_flagged;
        }
        if (role === 'employer') {
          return Boolean(m.card_data?.is_flagged);
        }
        return false;

      default:
        return false;
    }
  };

  // Action cards that STILL require an action from the current user
  const actionableCards = messages.filter(isCardActionable);

  // Keep track of cycle index for jumping
  const [jumpIndex, setJumpIndex] = useState(0);

  const getPinnedCardDetails = (card: (typeof messages)[0]) => {
    if (!card || !card.card_type) return null;
    switch (card.card_type) {
      case 'job_request':
      case 'confirm_hire':
        return {
          icon: 'briefcase-outline' as const,
          label: 'Job Request · Set Final Price',
          color: colors.primary,
          bg: colors.peach,
        };
      case 'accept_or_reject':
        return {
          icon: 'document-text-outline' as const,
          label: `Respond to Offer (₱${String(card.card_data?.price ?? '')})`,
          color: colors.success,
          bg: '#DCFCE7',
        };
      case 'cancel_hire':
        return {
          icon: 'close-circle-outline' as const,
          label: 'Cancel Hire Offer',
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
          label: card.card_data?.is_flagged
            ? conversationUserRole === 'employer'
              ? `Work flagged as done by ${card.card_data?.worker_name || otherUserName || 'Worker'}. Confirm`
              : 'Waiting for Employer Confirmation'
            : 'Flag Job as Done',
          color: colors.warning,
          bg: '#FEF3C7',
        };
      case 'unlock_request':
        return {
          icon: 'lock-open-outline' as const,
          label: 'Review Reopen Request',
          color: colors.primary,
          bg: colors.peach,
        };
      default:
        return {
          icon: 'flash-outline' as const,
          label: 'Action Required',
          color: colors.primary,
          bg: colors.primaryTint,
        };
    }
  };

  const currentCard =
    actionableCards.length > 0 ? actionableCards[jumpIndex % actionableCards.length] : null;
  const pinnedDetails = currentCard ? getPinnedCardDetails(currentCard) : null;
  const currentCardNumber =
    actionableCards.length > 0 ? (jumpIndex % actionableCards.length) + 1 : 0;

  const handleActionComplete = () => {
    isNearBottomRef.current = true;
    refetch();
    queryClient.invalidateQueries({ queryKey: ['employer-stats'] });
    queryClient.invalidateQueries({ queryKey: ['profile'] });
    queryClient.invalidateQueries({ queryKey: ['conversation', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['conversations'] });
    queryClient.invalidateQueries({ queryKey: ['messages', conversationId] });
    queryClient.invalidateQueries({ queryKey: ['jobApplications'] });
    queryClient.invalidateQueries({ queryKey: ['application'] });
    queryClient.invalidateQueries({ queryKey: ['myJobs'] });
    queryClient.invalidateQueries({ queryKey: ['notifications'] });
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 200);
  };

  const handleScrollToBottom = () => {
    flatListRef.current?.scrollToEnd({ animated: true });
    setShowScrollBottomFab(false);
    setNewMessagesBelow(0);
    isNearBottomRef.current = true;
  };

  const handleJumpToCard = () => {
    if (actionableCards.length === 0) return;
    const targetCard = actionableCards[jumpIndex % actionableCards.length];
    const nextIndex = (jumpIndex + 1) % actionableCards.length;
    setJumpIndex(nextIndex);

    const cardIndex = messages.findIndex((m) => m.id === targetCard.id);
    if (cardIndex >= 0) {
      try {
        flatListRef.current?.scrollToIndex({
          index: cardIndex,
          animated: true,
          viewPosition: 0.85,
        });
      } catch {
        flatListRef.current?.scrollToOffset({
          offset: Math.max(0, cardIndex * 140),
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
          <TouchableOpacity
            style={styles.headerProfileBtn}
            activeOpacity={isOtherUserDeleted ? 1 : 0.7}
            onPress={handleOpenUserProfile}
          >
            <View style={styles.headerAvatar}>
              {isOtherUserDeleted ? (
                <View
                  style={[
                    styles.headerAvatarFallback,
                    { backgroundColor: '#F1F5F9', borderColor: colors.inkFaint },
                  ]}
                >
                  <Ionicons name="person-outline" size={18} color={colors.inkMuted} />
                </View>
              ) : conversation?.other_user?.avatar_url ? (
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
                {isOtherUserDeleted
                  ? 'Deleted Account'
                  : otherUserName || conversation?.other_user?.name}
              </Text>
              <Text style={styles.headerJob} numberOfLines={1}>
                {jobTitle || conversation?.job_title}
              </Text>
            </View>
          </TouchableOpacity>
          {isOtherUserDeleted ? (
            <View style={styles.lockedPill}>
              <Ionicons name="person-remove-outline" size={12} color={colors.inkMuted} />
              <Text style={styles.lockedPillText}>Deleted</Text>
            </View>
          ) : isLocked ? (
            <View style={styles.lockedPill}>
              <Ionicons name="lock-closed" size={12} color={colors.inkMuted} />
              <Text style={styles.lockedPillText}>Locked</Text>
            </View>
          ) : (
            <View style={styles.activeDot} />
          )}
          <TouchableOpacity
            onPress={() => setShowOptionsMenu(true)}
            style={styles.headerMoreBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-vertical" size={20} color={colors.ink} />
          </TouchableOpacity>
        </View>

        {/* Options Modal */}
        <Modal
          visible={showOptionsMenu}
          transparent
          animationType="fade"
          onRequestClose={() => setShowOptionsMenu(false)}
        >
          <Pressable style={styles.modalBackdrop} onPress={() => setShowOptionsMenu(false)}>
            <View style={styles.optionsMenuContainer}>
              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  if (isBlockedByMe) {
                    handleUnblockUser();
                  } else {
                    handleBlockUser();
                  }
                }}
              >
                <Ionicons
                  name={isBlockedByMe ? 'shield-checkmark-outline' : 'ban-outline'}
                  size={20}
                  color={isBlockedByMe ? colors.primary : colors.error}
                />
                <Text
                  style={[
                    styles.optionsMenuText,
                    isBlockedByMe ? { color: colors.primary } : { color: colors.error },
                  ]}
                >
                  {isBlockedByMe ? 'Unblock User' : 'Block User'}
                </Text>
              </TouchableOpacity>

              <View style={styles.optionsMenuDivider} />

              <TouchableOpacity
                style={styles.optionsMenuItem}
                onPress={() => {
                  setShowOptionsMenu(false);
                  handleReportUser();
                }}
              >
                <Ionicons name="flag-outline" size={20} color={colors.ink} />
                <Text style={styles.optionsMenuText}>Report User</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Modal>

        {/* Minimalist Pinned Action Banner for Still Actionable Cards */}
        {pinnedDetails && actionableCards.length > 0 && (
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
                    ACTION REQUIRED ({currentCardNumber}/{actionableCards.length})
                  </Text>
                </View>
                <Text style={styles.pinnedTitle} numberOfLines={1}>
                  {pinnedDetails.label}
                </Text>
              </View>
              <View style={styles.pinnedChevronContainer}>
                <Ionicons name="chevron-forward" size={16} color={colors.inkMuted} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {/* Deleted Account Banner */}
        {isOtherUserDeleted && (
          <View style={styles.deletedBanner}>
            <Ionicons name="information-circle-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.deletedBannerText}>
              This person's account has been deleted. You can still view your message history.
            </Text>
          </View>
        )}

        {/* Lock Banner */}
        {!isOtherUserDeleted && (isLocked || isUnlockRequested) && (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerText}>
              {isUnlockRequested
                ? 'Reopen request pending employer approval.'
                : 'This chat was locked when the job concluded.'}
            </Text>
            {conversationUserRole === 'employer' ? (
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
          initialNumToRender={30}
          maxToRenderPerBatch={20}
          windowSize={11}
          removeClippedSubviews={Platform.OS === 'android'}
          onScroll={(event) => {
            const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
            const paddingToBottom = 160;
            const isNearBottom =
              layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom;
            isNearBottomRef.current = isNearBottom;
            if (isNearBottom) {
              setShowScrollBottomFab(false);
              setNewMessagesBelow(0);
            } else if (contentOffset.y > 120) {
              setShowScrollBottomFab(true);
            }
          }}
          scrollEventThrottle={32}
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
                viewPosition: 0.85,
              });
            }, 100);
          }}
          onContentSizeChange={() => {
            if (isInitialMountRef.current) {
              flatListRef.current?.scrollToEnd({ animated: false });
              isInitialMountRef.current = false;
            } else if (isNearBottomRef.current) {
              flatListRef.current?.scrollToEnd({ animated: true });
            }
          }}
          onLayout={() => {
            if (isInitialMountRef.current) {
              flatListRef.current?.scrollToEnd({ animated: false });
            }
          }}
          renderItem={({ item }) => {
            const employerId =
              conversation?.employer_id ??
              (conversationUserRole === 'employer' ? user?.id : conversation?.other_user?.id);

            const hasRealMessageFromEmployer = messages.some(
              (m) =>
                m.sender_id === employerId &&
                m.message_type !== 'action_card' &&
                m.message_type !== 'system' &&
                m.sender_id !== null,
            );

            if (item.message_type === 'action_card') {
              return (
                <ActionCard
                  message={item}
                  currentUserId={user?.id || 0}
                  currentUserRole={conversationUserRole}
                  conversationId={conversationId}
                  conversationStatus={status}
                  applicationStatus={conversation?.application_status}
                  otherUserName={conversation?.other_user?.name || ''}
                  jobTitle={jobTitle || conversation?.job_title || ''}
                  jobId={conversation?.job_id}
                  finalAgreedPrice={conversation?.final_agreed_price}
                  hasRealMessageFromEmployer={hasRealMessageFromEmployer}
                  isBlocked={isBlocked}
                  isSlotLocked={isSlotLocked}
                  onActionComplete={handleActionComplete}
                />
              );
            }
            return <MessageBubble message={item} isOwnMessage={item.sender_id === user?.id} />;
          }}
        />

        {/* Scroll to Bottom FAB with Unread Counter */}
        {showScrollBottomFab && (
          <View style={styles.fabWrapper} pointerEvents="box-none">
            <TouchableOpacity
              style={styles.scrollFab}
              activeOpacity={0.85}
              onPress={handleScrollToBottom}
            >
              <Ionicons name="chevron-down" size={20} color={colors.ink} />
              {newMessagesBelow > 0 && (
                <View style={styles.fabBadge}>
                  <Text style={styles.fabBadgeText}>
                    {newMessagesBelow > 99 ? '99+' : newMessagesBelow}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Blocked by me notice */}
        {isBlockedByMe && (
          <View style={styles.blockedBanner}>
            <View style={styles.blockedBannerLeft}>
              <Ionicons name="ban" size={16} color={colors.error} />
              <Text style={styles.blockedBannerText}>You have blocked this user.</Text>
            </View>
            <TouchableOpacity
              style={styles.unblockBannerBtn}
              onPress={handleUnblockUser}
              disabled={unblockUserMutation.isPending}
            >
              <Text style={styles.unblockBannerBtnText}>
                {unblockUserMutation.isPending ? 'Unblocking...' : 'Unblock'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Blocked by other notice */}
        {!isBlockedByMe && isBlockedByOther && (
          <View style={styles.blockedBanner}>
            <View style={styles.blockedBannerLeft}>
              <Ionicons name="information-circle-outline" size={16} color={colors.inkMuted} />
              <Text style={[styles.blockedBannerText, { color: colors.inkMuted }]}>
                You cannot message this user.
              </Text>
            </View>
          </View>
        )}

        {/* Slot locked notice */}
        {!isOtherUserDeleted && !isBlocked && isSlotLocked && (
          <View style={styles.firstMsgNotice}>
            <Ionicons name="lock-closed" size={14} color={colors.inkMuted} />
            <Text style={styles.firstMsgNoticeText}>
              Slots are full. No other negotiation can take place.
            </Text>
          </View>
        )}

        {/* First-message restriction notice for workers */}
        {status === 'open' &&
          !isBlocked &&
          !isSlotLocked &&
          conversationUserRole === 'worker' &&
          !isWorkerReplyAllowed && (
            <View style={styles.firstMsgNotice}>
              <Ionicons name="information-circle-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.firstMsgNoticeText}>
                The employer will send the first message or job offer to start the conversation.
              </Text>
            </View>
          )}

        {/* Input Bar or Disabled Account / Slot Locked Notice */}
        {isOtherUserDeleted ? (
          <View style={styles.deletedInputContainer}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.deletedInputText}>
              Messaging is disabled because this account no longer exists.
            </Text>
          </View>
        ) : isSlotLocked ? (
          <View style={styles.deletedInputContainer}>
            <Ionicons name="lock-closed-outline" size={16} color={colors.inkMuted} />
            <Text style={styles.deletedInputText}>
              Slots are full. Messaging is disabled for this position.
            </Text>
          </View>
        ) : isLocked || isUnlockRequested ? (
          <View style={styles.lockedBottomContainer}>
            <View style={styles.lockedBottomContent}>
              <Ionicons
                name={isUnlockRequested ? 'time-outline' : 'lock-closed-outline'}
                size={18}
                color={isUnlockRequested ? colors.warning : colors.inkMuted}
              />
              <Text style={styles.lockedBottomText}>
                {isUnlockRequested
                  ? conversationUserRole === 'employer'
                    ? 'Worker requested to reopen this chat.'
                    : 'Reopen request pending employer approval.'
                  : 'This chat is closed.'}
              </Text>
            </View>
            {conversationUserRole === 'employer' ? (
              <TouchableOpacity
                style={styles.lockedBottomBtn}
                onPress={() =>
                  unlockConversation.mutate(conversationId, {
                    onSuccess: () => {
                      refetch();
                      handleActionComplete();
                    },
                  })
                }
                disabled={unlockConversation.isPending}
                activeOpacity={0.8}
              >
                {unlockConversation.isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.lockedBottomBtnText}>Unlock Chat</Text>
                )}
              </TouchableOpacity>
            ) : isLocked ? (
              <TouchableOpacity
                style={styles.lockedBottomBtn}
                onPress={() =>
                  requestUnlock.mutate(conversationId, {
                    onSuccess: () => {
                      refetch();
                      handleActionComplete();
                    },
                  })
                }
                disabled={requestUnlock.isPending}
                activeOpacity={0.8}
              >
                {requestUnlock.isPending ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.lockedBottomBtnText}>Request to Reopen</Text>
                )}
              </TouchableOpacity>
            ) : null}
          </View>
        ) : (
          status === 'open' &&
          !isBlocked && (
            <>
              {showQuickReplies && (
                <QuickReplyChips
                  userRole={conversationUserRole}
                  onSelectChip={(text) => {
                    setInputText(text);
                    if (inputError) setInputError(null);
                  }}
                  disabled={!isWorkerReplyAllowed}
                  onDismiss={() => setShowQuickReplies(false)}
                />
              )}
              <TypingIndicator visible={Boolean(typingUser)} userName={typingUser || undefined} />
              <View style={styles.inputContainer}>
                <TouchableOpacity
                  onPress={handlePickImage}
                  style={styles.iconBtn}
                  activeOpacity={0.6}
                  disabled={!isWorkerReplyAllowed}
                >
                  <Ionicons name="image-outline" size={24} color={colors.inkMuted} />
                </TouchableOpacity>
                {!showQuickReplies && isWorkerReplyAllowed && (
                  <TouchableOpacity
                    onPress={() => {
                      triggerHaptic('light');
                      setShowQuickReplies(true);
                    }}
                    style={styles.iconBtn}
                    activeOpacity={0.6}
                    accessibilityLabel="Show quick replies"
                  >
                    <Ionicons name="flash-outline" size={20} color={colors.primary} />
                  </TouchableOpacity>
                )}
                <TextInput
                  style={styles.input}
                  placeholder={
                    !isWorkerReplyAllowed
                      ? 'Waiting for employer to start conversation...'
                      : 'Type a message...'
                  }
                  placeholderTextColor={colors.inkLight}
                  value={inputText}
                  onChangeText={(text) => {
                    setInputText(text);
                    if (inputError) setInputError(null);
                    const now = Date.now();
                    if (text.trim().length > 0 && now - lastTypingPingRef.current > 2500) {
                      lastTypingPingRef.current = now;
                      messagesApi.sendTyping(conversationId).catch(() => {});
                    }
                  }}
                  multiline
                  maxLength={1000}
                  editable={isWorkerReplyAllowed}
                />
                {inputText.length > 800 && (
                  <Text
                    style={[styles.charCounter, inputText.length > 950 && { color: colors.error }]}
                  >
                    {inputText.length}/1000
                  </Text>
                )}
                <TouchableOpacity
                  onPress={handleSendText}
                  style={styles.iconBtn}
                  activeOpacity={0.6}
                  disabled={!inputText.trim() || !isWorkerReplyAllowed}
                >
                  <Ionicons
                    name="send"
                    size={24}
                    color={inputText.trim() ? colors.primary : colors.inkLight}
                  />
                </TouchableOpacity>
              </View>
              {inputError ? (
                <View style={styles.inlineErrorBox}>
                  <Ionicons name="alert-circle" size={15} color={colors.error} />
                  <Text style={styles.inlineErrorText}>{inputError}</Text>
                </View>
              ) : null}
            </>
          )
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
  pinnedChevronContainer: {
    paddingLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabWrapper: {
    position: 'absolute',
    right: 16,
    bottom: 82,
    zIndex: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollFab: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.9)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 4,
  },
  fabBadge: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: colors.primary,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  fabBadgeText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
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
  headerMoreBtn: {
    padding: 6,
    marginLeft: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingRight: 16,
  },
  optionsMenuContainer: {
    backgroundColor: colors.white,
    borderRadius: 14,
    minWidth: 180,
    paddingVertical: 6,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  optionsMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  optionsMenuText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
  },
  optionsMenuDivider: {
    height: 1,
    backgroundColor: 'rgba(226, 232, 240, 0.70)',
    marginVertical: 2,
  },
  blockedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FEF2F2',
    borderTopWidth: 1,
    borderTopColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  blockedBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  blockedBannerText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.error,
  },
  unblockBannerBtn: {
    backgroundColor: colors.error,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unblockBannerBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.white,
  },
  headerProfileBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  inlineErrorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FEE2E2',
    borderTopWidth: 1,
    borderTopColor: '#FCA5A5',
  },
  inlineErrorText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.error,
    flex: 1,
  },
  deletedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  deletedBannerText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    lineHeight: 18,
  },
  deletedInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  deletedInputText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
  },
  lockedBottomContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    gap: 12,
  },
  lockedBottomContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  lockedBottomText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    flex: 1,
  },
  lockedBottomBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockedBottomBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
});

export default ChatScreen;
