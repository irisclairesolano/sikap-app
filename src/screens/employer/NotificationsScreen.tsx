import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../../hooks/useNotifications';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'Notifications'
>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { data, isLoading, refetch, isFetching } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  if (isLoading) {
    return (
      <SafeAreaView
        style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}
        edges={['top', 'left', 'right']}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const notifications = data?.notifications.data || [];
  const hasUnread = notifications.some((n) => n.read_at === null);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;

  const todayNotifs = notifications.filter((n) => new Date(n.created_at).getTime() >= todayStart);
  const yesterdayNotifs = notifications.filter((n) => {
    const t = new Date(n.created_at).getTime();
    return t >= yesterdayStart && t < todayStart;
  });
  const olderNotifs = notifications.filter(
    (n) => new Date(n.created_at).getTime() < yesterdayStart,
  );

  const renderNotificationItem = (notif: (typeof notifications)[0]) => {
    const isUnread = notif.read_at === null;
    const title = notif.data?.title || notif.type.replace('Notification', '');
    const message = notif.data?.message || 'You have a new notification.';

    return (
      <TouchableOpacity
        key={notif.id}
        style={[styles.notificationCard, isUnread ? styles.unreadCard : styles.readCard]}
        activeOpacity={0.7}
        onPress={() => {
          if (isUnread) {
            markAsReadMutation.mutate(notif.id);
          }

          let parsedData = notif.data;
          if (typeof parsedData === 'string') {
            try {
              parsedData = JSON.parse(parsedData);
            } catch (_) {}
          }

          const appId =
            parsedData?.application_id ||
            parsedData?.applicationId ||
            parsedData?.id ||
            notif.data?.application_id ||
            notif.data?.applicationId;
          const jobId =
            parsedData?.job_id || parsedData?.jobId || notif.data?.job_id || notif.data?.jobId;

          const notifType = parsedData?.type || notif.data?.type;
          if (notifType === 'review_received') {
            (navigation as any).navigate('Profile');
            return;
          }
          if (notifType === 'rate_worker_reminder' && jobId) {
            (navigation as any).navigate('RateWorkerList', {
              jobId: Number(jobId),
              jobTitle: parsedData?.job_title || 'Job',
            });
            return;
          }

          if (appId) {
            (navigation as any).navigate('ApplicantDetail', {
              applicantId: Number(appId),
              jobTitle: parsedData?.job_title || parsedData?.jobTitle || '',
              applicantName: parsedData?.worker_name || parsedData?.applicantName || '',
              status: 'pending',
            });
          } else if (jobId) {
            (navigation as any).navigate('JobStatusManagement', { id: Number(jobId) });
          }
        }}
      >
        <View
          style={[styles.iconBubble, isUnread ? styles.unreadIconBubble : styles.readIconBubble]}
        >
          <Ionicons name="notifications" size={18} color={isUnread ? colors.primary : '#475569'} />
        </View>
        <View style={styles.notificationContent}>
          <Text
            style={[
              styles.notificationTitle,
              isUnread ? { color: colors.ink } : styles.readTextTitle,
            ]}
          >
            {title}
          </Text>
          <Text
            style={[
              styles.notificationBody,
              isUnread ? { color: colors.ink } : styles.readTextBody,
            ]}
          >
            {message}
          </Text>
          <Text
            style={[
              styles.notificationTime,
              isUnread ? { color: colors.inkSoft } : styles.readTextTime,
            ]}
          >
            {new Date(notif.created_at).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            •{' '}
            {new Date(notif.created_at).toLocaleTimeString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Notifications</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isFetching && !isLoading}
            onRefresh={refetch}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
        {/* Today Section with Mark all as read at the same level */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>Today</Text>
          {hasUnread && (
            <TouchableOpacity
              style={styles.markAllInlineBtn}
              onPress={() => {
                if (hasUnread && !markAllAsReadMutation.isPending) {
                  markAllAsReadMutation.mutate();
                }
              }}
              disabled={markAllAsReadMutation.isPending}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="checkmark-done-outline" size={14} color={colors.primary} />
              <Text style={styles.markAllText}>
                {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {todayNotifs.length > 0 ? (
          <View style={styles.notificationList}>{todayNotifs.map(renderNotificationItem)}</View>
        ) : (
          <Text style={styles.emptySectionText}>No notifications today.</Text>
        )}

        {/* Yesterday Section */}
        {yesterdayNotifs.length > 0 && (
          <>
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <Text style={[styles.eyebrow, { color: colors.inkSoft }]}>Yesterday</Text>
            </View>
            <View style={styles.notificationList}>
              {yesterdayNotifs.map(renderNotificationItem)}
            </View>
          </>
        )}

        {/* Older Section */}
        {olderNotifs.length > 0 && (
          <>
            <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
              <Text style={[styles.eyebrow, { color: colors.inkSoft }]}>Older</Text>
            </View>
            <View style={styles.notificationList}>{olderNotifs.map(renderNotificationItem)}</View>
          </>
        )}

        {notifications.length === 0 && (
          <Text style={styles.emptyGlobalText}>No notifications yet.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
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
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 8,
  },
  markAllInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  markAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notificationList: { marginTop: 6, gap: 10 },
  notificationCard: {
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  unreadCard: {
    backgroundColor: colors.paperBright,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.8)',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    ...shadows.sm,
  },
  readCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderLeftWidth: 4,
    borderLeftColor: '#CBD5E1',
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  unreadIconBubble: {
    backgroundColor: colors.peach,
  },
  readIconBubble: {
    backgroundColor: '#F1F5F9',
  },
  notificationContent: { flex: 1 },
  notificationTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  readTextTitle: { color: '#334155' },
  notificationBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginTop: 4,
  },
  readTextBody: { color: '#475569' },
  notificationTime: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 8,
  },
  readTextTime: { color: '#64748B' },
  emptySectionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    fontStyle: 'italic',
    marginTop: 4,
    marginBottom: 8,
  },
  emptyGlobalText: {
    fontFamily: fonts.body,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default NotificationsScreen;
