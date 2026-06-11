import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';

type NotificationsScreenNavigationProp = NativeStackNavigationProp<EmployerStackParamList, 'Notifications'>;

export const NotificationsScreen: React.FC = () => {
  const navigation = useNavigation<NotificationsScreenNavigationProp>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Notifications</Text>
        </View>
        <TouchableOpacity style={styles.markAllBtn}>
          <Text style={styles.markAllText}>Mark all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Today Section */}
        <Text style={[styles.eyebrow, { color: colors.primary }]}>Today</Text>

        <View style={styles.notificationList}>
          {/* Unread: New applicant */}
          <View style={[styles.notificationCard, styles.unreadPrimary]}>
            <View style={[styles.iconBubble, { backgroundColor: colors.peach }]}>
              <Ionicons name="person-add" size={18} color={colors.primary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>New applicant</Text>
              <Text style={styles.notificationBody}>
                Maria Santos applied for "Carpenter wanted".
              </Text>
              <Text style={styles.notificationTime}>2 hours ago</Text>
            </View>
          </View>

          {/* Unread: Offer accepted */}
          <View style={[styles.notificationCard, styles.unreadMint]}>
            <View style={[styles.iconBubble, { backgroundColor: colors.mint }]}>
              <Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Offer accepted</Text>
              <Text style={styles.notificationBody}>
                Jose Bernardo accepted your job offer for "House painter".
              </Text>
              <Text style={styles.notificationTime}>5 hours ago</Text>
            </View>
          </View>
        </View>

        {/* Earlier Section */}
        <Text style={[styles.eyebrow, { marginTop: 24 }]}>Earlier</Text>

        <View style={styles.notificationList}>
          {/* Read: 5-star review */}
          <View style={styles.notificationCard}>
            <View style={[styles.iconBubble, { backgroundColor: colors.butter }]}>
              <Ionicons name="star" size={18} color={colors.primary} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>You received a 5-star review</Text>
              <Text style={styles.notificationBody}>
                "Clear instructions, paid on time. Excellent employer."
              </Text>
              <Text style={styles.notificationTime}>2 days ago</Text>
            </View>
          </View>

          {/* Read: Account verified */}
          <View style={styles.notificationCard}>
            <View style={[styles.iconBubble, { backgroundColor: colors.mint }]}>
              <Ionicons name="shield-checkmark" size={18} color={colors.mintDeep} />
            </View>
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>Account verified</Text>
              <Text style={styles.notificationBody}>
                Your ID was approved. Welcome to SIKAP!
              </Text>
              <Text style={styles.notificationTime}>1 week ago</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: { backgroundColor: colors.paperBright, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, ...shadows.sm },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  markAllBtn: { padding: 8 },
  markAllText: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.primary },
  scrollContent: { padding: 20, paddingBottom: 40 },
  eyebrow: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1 },
  notificationList: { marginTop: 12, gap: 10 },
  notificationCard: { 
    backgroundColor: colors.paperBright, 
    borderRadius: 12, 
    padding: 14, 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    gap: 12, 
    ...shadows.sm 
  },
  unreadPrimary: { borderLeftWidth: 3, borderLeftColor: colors.primary },
  unreadMint: { borderLeftWidth: 3, borderLeftColor: colors.mintDeep },
  iconBubble: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  notificationContent: { flex: 1 },
  notificationTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  notificationBody: { fontFamily: fonts.body, fontSize: 13, color: colors.ink, lineHeight: 18, marginTop: 4 },
  notificationTime: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkSoft, marginTop: 8 },
});

export default NotificationsScreen;
