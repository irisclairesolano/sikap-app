import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useConversations } from '../../hooks/useConversations';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../hooks/useAuth';

interface Props {
  navigation: any;
}

const formatConversationTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays < 7) {
    return date.toLocaleDateString([], { weekday: 'short' });
  } else {
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }
};

const ConversationsListScreen: React.FC<Props> = ({ navigation }) => {
  const { data, isLoading, isError, refetch } = useConversations();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const isWorker = user?.role === 'worker';
  const canGoBack = navigation.canGoBack();

  const conversations = data || [];
  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (c.other_user?.name || '').toLowerCase();
    const job = (c.job_title || '').toLowerCase();
    return name.includes(q) || job.includes(q);
  });

  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.iconBtn}
        onPress={() => (canGoBack ? navigation.goBack() : null)}
        disabled={!canGoBack}
      >
        {canGoBack && <Ionicons name="arrow-back" size={24} color={colors.ink} />}
      </TouchableOpacity>
      <View style={styles.headerPill}>
        <Text style={styles.headerPillText}>Messages</Text>
      </View>
      <TouchableOpacity style={styles.iconBtn} onPress={() => refetch()}>
        <Ionicons name="reload-outline" size={20} color={colors.inkSoft} />
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {renderHeader()}
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Couldn't load conversations. Pull to refresh.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {renderHeader()}

      {conversations.length > 0 && (
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={17} color={colors.inkMuted} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by name or job..."
              placeholderTextColor={colors.inkLight}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={17} color={colors.inkMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {conversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="chatbubbles-outline" size={44} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySubtitle}>
            {isWorker
              ? 'Your chats will appear here once an employer sends you a job request.'
              : 'Send a job request to a worker from your applicants to start chatting.'}
          </Text>
          <TouchableOpacity
            style={styles.emptyActionButton}
            activeOpacity={0.8}
            onPress={() => {
              if (isWorker) {
                navigation.navigate('Find' as any);
              } else {
                navigation.navigate('MyJobs' as any);
              }
            }}
          >
            <Ionicons
              name={isWorker ? 'briefcase-outline' : 'people-outline'}
              size={18}
              color={colors.white}
              style={{ marginRight: 6 }}
            />
            <Text style={styles.emptyActionButtonText}>
              {isWorker ? 'Explore Jobs' : 'View My Jobs'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : filteredConversations.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={40} color={colors.inkLight} style={{ marginBottom: 12 }} />
          <Text style={styles.emptyTitle}>No results</Text>
          <Text style={styles.emptySubtitle}>No conversations matching "{searchQuery}"</Text>
        </View>
      ) : (
        <FlatList
          data={filteredConversations}
          keyExtractor={(item) => item.id.toString()}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isLocked = item.status === 'locked' || item.status === 'unlock_requested';
            return (
              <TouchableOpacity
                style={styles.row}
                activeOpacity={0.7}
                onPress={() =>
                  navigation.navigate('Chat', {
                    conversationId: item.id,
                    jobTitle: item.job_title,
                    otherUserName: item.other_user?.name,
                  })
                }
              >
                <View style={styles.avatar}>
                  {item.other_user?.avatar_url ? (
                    <Image
                      source={{ uri: item.other_user.avatar_url }}
                      style={styles.avatarImage}
                    />
                  ) : (
                    <Text style={styles.avatarText}>{item.other_user?.name?.charAt(0) || '?'}</Text>
                  )}
                </View>
                <View style={styles.middle}>
                  <View style={styles.nameRow}>
                    <Text style={styles.name} numberOfLines={1}>
                      {item.other_user?.name || 'Unknown'}
                    </Text>
                    {item.last_message_at && (
                      <Text style={styles.time}>
                        {formatConversationTime(item.last_message_at)}
                      </Text>
                    )}
                  </View>
                  <View style={styles.badgeRow}>
                    <View style={styles.jobBadge}>
                      <Text style={styles.jobBadgeText} numberOfLines={1}>
                        {item.job_title}
                      </Text>
                    </View>
                    {isLocked && (
                      <View style={styles.concludedBadge}>
                        <Ionicons
                          name="checkmark-circle-outline"
                          size={11}
                          color={colors.inkMuted}
                          style={{ marginRight: 2 }}
                        />
                        <Text style={styles.concludedBadgeText}>Concluded</Text>
                      </View>
                    )}
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
      )}
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
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
    padding: 20,
  },
  errorText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.paper,
    padding: 32,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    lineHeight: 20,
    color: colors.inkMuted,
    textAlign: 'center',
    maxWidth: 280,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 10,
  },
  row: {
    flexDirection: 'row',
    padding: 14,
    borderRadius: 16,
    backgroundColor: colors.white,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inkFaint,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryTint,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  avatarImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  avatarText: {
    color: colors.primary,
    fontFamily: fonts.bodyBold,
    fontSize: 17,
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
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 6,
    backgroundColor: colors.paper,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    paddingVertical: 0,
  },
  emptyActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    marginTop: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyActionButtonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.white,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  jobBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primaryTint,
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  jobBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.primary,
  },
  concludedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  concludedBadgeText: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
  },
  preview: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#DC2626',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
  },
});

export default ConversationsListScreen;
