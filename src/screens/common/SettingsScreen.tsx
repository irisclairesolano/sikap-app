import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from 'expo-secure-store';
import { useQueryClient } from '@tanstack/react-query';
import { notifyAuthChanged } from '../../store/authEvents';

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            await SecureStore.deleteItemAsync('auth_token');
            queryClient.clear();
            notifyAuthChanged();
          }
        }
      ]
    );
  };

  const SettingRow = ({ icon, title, type = 'nav', value, onToggle, onPress, isDestructive = false }: any) => (
    <TouchableOpacity 
      style={styles.settingRow} 
      onPress={type === 'nav' ? onPress : undefined}
      disabled={type !== 'nav'}
    >
      <View style={styles.settingRowLeft}>
        <Ionicons name={icon} size={22} color={isDestructive ? colors.error : colors.ink} />
        <Text style={[styles.settingRowTitle, isDestructive && { color: colors.error }]}>{title}</Text>
      </View>
      {type === 'nav' && <Ionicons name="chevron-forward" size={20} color={colors.inkLight} />}
      {type === 'toggle' && (
        <Switch
          trackColor={{ false: colors.inkFaint, true: colors.mint }}
          thumbColor={colors.paperBright}
          onValueChange={onToggle}
          value={value}
        />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Settings</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="person-outline" title="Edit Profile" onPress={() => navigation.navigate('EditProfile')} />
            <View style={styles.divider} />
            <SettingRow icon="shield-checkmark-outline" title="Verification Status" />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingRow 
              icon="notifications-outline" 
              title="Push Notifications" 
              type="toggle" 
              value={notificationsEnabled} 
              onToggle={setNotificationsEnabled} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="location-outline" 
              title="Location Services" 
              type="toggle" 
              value={locationEnabled} 
              onToggle={setLocationEnabled} 
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.sectionCard}>
            <SettingRow icon="help-circle-outline" title="Help Center" />
            <View style={styles.divider} />
            <SettingRow icon="document-text-outline" title="Terms of Service" />
            <View style={styles.divider} />
            <SettingRow icon="lock-closed-outline" title="Privacy Policy" />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionCard}>
            <SettingRow 
              icon="log-out-outline" 
              title="Log Out" 
              onPress={handleLogout} 
            />
            <View style={styles.divider} />
            <SettingRow 
              icon="trash-outline" 
              title="Delete Account" 
              isDestructive={true} 
            />
          </View>
        </View>
        
        <Text style={styles.versionText}>SIKAP v1.0.0</Text>

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
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.inkSoft, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8, marginLeft: 4 },
  sectionCard: { backgroundColor: colors.paperBright, borderRadius: 16, overflow: 'hidden', ...shadows.sm },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: colors.paperBright },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.inkFaint, marginLeft: 50 },
  versionText: { fontFamily: fonts.body, fontSize: 12, color: colors.inkLight, textAlign: 'center', marginTop: 10 }
});

export default SettingsScreen;
