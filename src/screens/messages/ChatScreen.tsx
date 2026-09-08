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

  useEffect(() => {
    markRead.mutate();
  }, []);

  const handleSendText = () => {
    if (!inputText.trim() || sendMessage.isPending) return;
    sendMessage.mutate(inputText.trim(), {
      onSuccess: () => {
        setInputText('');
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

  const messages = data?.messages || [];

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
            <Text style={styles.headerName}>{otherUserName || conversation?.other_user?.name}</Text>
            <Text style={styles.headerJob}>{jobTitle || conversation?.job_title}</Text>
          </View>
          {isLocked && (
            <Ionicons
              name="lock-closed"
              size={20}
              color={colors.inkMuted}
              style={styles.lockIcon}
            />
          )}
        </View>

        {/* Lock Banner */}
        {(isLocked || isUnlockRequested) && (
          <View style={styles.lockBanner}>
            <Text style={styles.lockBannerText}>This conversation is archived.</Text>
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

        {/* Input Bar */}
        {status === 'open' && (
          <SafeAreaView edges={['bottom']} style={styles.inputContainer}>
            <TouchableOpacity onPress={handlePickImage} style={styles.iconBtn}>
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
            <TouchableOpacity
              onPress={handleSendText}
              style={styles.iconBtn}
              disabled={!inputText.trim() || sendMessage.isPending}
            >
              <Ionicons
                name="send"
                size={24}
                color={
                  inputText.trim() && !sendMessage.isPending ? colors.primary : colors.inkLight
                }
              />
            </TouchableOpacity>
          </SafeAreaView>
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
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  backBtn: { marginRight: 16 },
  headerTitleContainer: { flex: 1 },
  headerName: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink },
  headerJob: { fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted, marginTop: 2 },
  lockIcon: { marginLeft: 8 },
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
});

export default ChatScreen;
