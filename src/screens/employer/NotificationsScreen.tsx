import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '../../hooks/useNotifications';
import { ActivityIndicator } from 'react-native';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'Notifications'
>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();
  const { data, isLoading } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const notifications = data?.notifications.data || [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Notifications</Text>
        </View>
        <TouchableOpacity
          style={styles.markAllBtn}
          onPress={() => markAllAsReadMutation.mutate()}
          disabled={markAllAsReadMutation.isPending}
        >
          <Text style={styles.markAllText}>
            {markAllAsReadMutation.isPending ? 'Marking...' : 'Mark all as read'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Today Section */}
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Today</Text>

        <View style={styles.notificationList}>
          {notifications.length === 0 ? (
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.inkSoft,
                textAlign: 'center',
                marginTop: 20,
              }}
            >
              No notifications yet.
            </Text>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.read_at === null;
              const title = notif.data?.title || notif.type.replace('Notification', '');
              const message = notif.data?.message || 'You have a new notification.';

              return (
                <TouchableOpacity
                  key={notif.id}
                  style={[styles.notificationCard, isUnread && styles.unreadPrimary]}
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

                    const appId = parsedData?.application_id || parsedData?.applicationId;
                    const jobId = parsedData?.job_id || parsedData?.jobId;

                    if (appId) {
                      navigation.navigate('ApplicantDetail' as any, { applicationId: appId });
                    } else if (jobId) {
                      navigation.navigate('JobStatusManagement' as any, { id: jobId });
                    }
                  }}
                >
                  <View
                    style={[
                      styles.iconBubble,
                      { backgroundColor: isUnread ? colors.peach : colors.butter },
                    ]}
                  >
                    <Ionicons name="notifications" size={18} color={colors.primary} />
                  </View>
                  <View style={styles.notificationContent}>
                    <Text style={styles.notificationTitle}>{title}</Text>
                    <Text style={styles.notificationBody}>{message}</Text>
                    <Text style={styles.notificationTime}>
                      {new Date(notif.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
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
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  markAllBtn: { padding: 8 },
  markAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  notificationList: { marginTop: 12, gap: 10 },
  notificationCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
    ...shadows.sm,
  },
  unreadPrimary: { borderLeftColor: colors.primary },
  unreadMint: { borderLeftColor: colors.mintDeep },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notificationContent: { flex: 1 },
  notificationTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  notificationBody: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
    marginTop: 4,
  },
  notificationTime: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkSoft,
    marginTop: 8,
  },
});

export default NotificationsScreen;
