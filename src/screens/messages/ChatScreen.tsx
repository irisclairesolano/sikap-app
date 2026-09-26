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
  Modal,
  Pressable,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

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
  const flatListRef = useRef<FlatList>(null);

  const blockUserMutation = useBlockUser();
  const unblockUserMutation = useUnblockUser();

  const conversation = directConv || convData?.find((c) => c.id === conversationId);
  const status = conversation?.status || 'open';
  const isLocked = status === 'locked';
  const isUnlockRequested = status === 'unlock_requested';

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

  const isBlockedByMe = !!conversation?.is_blocked_by_me;
  const isBlockedByOther = !!conversation?.is_blocked_by_other;
  const isBlocked = isBlockedByMe || isBlockedByOther;

  const [inputError, setInputError] = useState<string | null>(null);

  const handleOpenUserProfile = () => {
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

  const messages = data?.messages || [];
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
      reportable_type: 'user',
      reportable_id: otherUserId,
    });
  };

  useEffect(() => {
    if (messageCount > 0) {
      markRead.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageCount]);

  const handleSendText = () => {
    const textToSend = inputText.trim();
    if (!textToSend) return;
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
        // Only employer can unlock, and only if conversation is not already open
        return role === 'employer' && convStatus !== 'open';

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

      case 'mark_complete':
        // Only employer can mark job complete while job is in progress and not locked
        return role === 'employer' && appStatus === 'accepted' && convStatus !== 'locked';

      case 'flag_offline':
        // Only worker can flag as complete while job is in progress
        return role === 'worker' && appStatus === 'accepted';

      default:
        return false;
    }
  };

  // Action cards that STILL require an action from the current user
  const actionableCards = messages.filter(isCardActionable);

  // Keep track of cycle index for jumping
  const [jumpIndex, setJumpIndex] = useState(0);
  const isInitialMountRef = useRef(true);

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
          label: 'Flag Job as Done',
          color: colors.warning,
          bg: '#FEF3C7',
        };
      case 'unlock_request':
        return {
          icon: 'lock-open-outline' as const,
          label: 'Approve Chat Reopen',
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
          <TouchableOpacity
            style={styles.headerProfileBtn}
            activeOpacity={0.7}
            onPress={handleOpenUserProfile}
          >
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
          </TouchableOpacity>
          {isLocked ? (
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
              <View style={styles.pinnedButtonsRow}>
                <TouchableOpacity
                  style={styles.jumpBtn}
                  onPress={handleJumpToCard}
                  activeOpacity={0.7}
                >
                  <Text style={styles.jumpBtnText}>
                    {actionableCards.length > 1
                      ? `Jump (${currentCardNumber}/${actionableCards.length})`
                      : 'Jump'}
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
                  hasRealMessageFromEmployer={hasRealMessageFromEmployer}
                  isBlocked={isBlocked}
                  onActionComplete={refetch}
                />
              );
            }
            return <MessageBubble message={item} isOwnMessage={item.sender_id === user?.id} />;
          }}
        />

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

        {/* First-message restriction notice for workers */}
        {status === 'open' &&
          !isBlocked &&
          conversationUserRole === 'worker' &&
          !isWorkerReplyAllowed && (
            <View style={styles.firstMsgNotice}>
              <Ionicons name="information-circle-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.firstMsgNoticeText}>
                The employer will send the first message or job offer to start the conversation.
              </Text>
            </View>
          )}

        {/* Input Bar */}
        {status === 'open' && !isBlocked && (
          <>
            <View style={styles.inputContainer}>
              <TouchableOpacity
                onPress={handlePickImage}
                style={styles.iconBtn}
                activeOpacity={0.6}
                disabled={!isWorkerReplyAllowed}
              >
                <Ionicons name="image-outline" size={24} color={colors.inkMuted} />
              </TouchableOpacity>
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
});

export default ChatScreen;
