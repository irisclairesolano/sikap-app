import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useConversations } from '../../hooks/useConversations';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  navigation: any;
}

const formatTime = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
};

const ConversationsListScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, isError, refetch } = useConversations();
  const { user } = useAuth();
  const isWorker = user?.role === 'worker';

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Couldn't load conversations. Pull to refresh.</Text>
      </View>
    );
  }

  const conversations = data || [];

  if (conversations.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="chatbubbles-outline" size={64} color={colors.inkMuted} />
        <Text style={styles.emptyTitle}>No conversations yet</Text>
        <Text style={styles.emptySubtitle}>
          {isWorker
            ? 'Your chats will appear here once an employer sends you a job request.'
            : 'Send a job request to a worker to start messaging.'}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
        }
        renderItem={({ item }) => {
          const isLocked = item.status === 'locked' || item.status === 'unlock_requested';
          return (
            <TouchableOpacity
              style={styles.row}
              onPress={() =>
                navigation.navigate('Chat', {
                  conversationId: item.id,
                  jobTitle: item.job_title,
                  otherUserName: item.other_user?.name,
                })
              }
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.other_user?.name?.charAt(0) || '?'}</Text>
              </View>
              <View style={styles.middle}>
                <View style={styles.nameRow}>
                  <Text style={styles.name}>{item.other_user?.name || 'Unknown'}</Text>
                  {item.last_message_at && (
                    <Text style={styles.time}>{formatTime(item.last_message_at)}</Text>
                  )}
                </View>
                <View style={styles.jobBadge}>
                  <Text style={styles.jobBadgeText}>{item.job_title}</Text>
                </View>
                <View style={styles.previewRow}>
                  {isLocked && (
                    <Ionicons
                      name="lock-closed"
                      size={12}
                      color={colors.inkMuted}
                      style={{ marginRight: 4 }}
                    />
                  )}
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.last_message_preview || 'No messages yet'}
                  </Text>
                </View>
              </View>
              {item.unread_count > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadText}>{item.unread_count}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
    padding: 24,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 16,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  row: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
    backgroundColor: colors.white,
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },
  middle: {
    flex: 1,
    paddingHorizontal: 12,
  },
  nameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  jobBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryTint,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginTop: 4,
  },
  jobBadgeText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.primary,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  preview: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
  },
});

export default ConversationsListScreen;
