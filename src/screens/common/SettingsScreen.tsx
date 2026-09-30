import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from '../../utils/storage';
import { useQueryClient } from '@tanstack/react-query';
import { notifyAuthChanged } from '../../store/authEvents';
import { useAuth } from '../../hooks/useAuth';
import { authApi } from '../../api/auth';

const DELETE_REASONS = [
  'Found work / hired someone elsewhere',
  'Not using the app anymore',
  'Privacy or security concerns',
  'Technical difficulties or app bugs',
  'Other reason',
];

const SettingRow = ({
  icon,
  title,
  subtitle,
  type = 'nav',
  value,
  onToggle,
  onPress,
  isDestructive = false,
}: any) => (
  <TouchableOpacity
    style={styles.settingRow}
    onPress={type === 'nav' ? onPress : undefined}
    disabled={type !== 'nav'}
  >
    <View style={styles.settingRowLeft}>
      <Ionicons name={icon} size={22} color={isDestructive ? colors.error : colors.ink} />
      <View>
        <Text style={[styles.settingRowTitle, isDestructive && { color: colors.error }]}>
          {title}
        </Text>
        {subtitle && (
          <Text
            style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkMuted, marginTop: 2 }}
          >
            {subtitle}
          </Text>
        )}
      </View>
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

export const SettingsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [locationEnabled, setLocationEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>(DELETE_REASONS[0]);
  const [customReasonDetails, setCustomReasonDetails] = useState('');
  const [deleteWarning, setDeleteWarning] = useState<string | null>(null);

  const { user, userRole, switchRole } = useAuth();

  const handleLogout = () => {
    showAlert('Log Out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await SecureStore.deleteItemAsync('auth_token');
          await SecureStore.deleteItemAsync('user_profile');
          queryClient.clear();
          notifyAuthChanged();
        },
      },
    ]);
  };

  const executeAccountDeletion = async () => {
    try {
      setIsDeleting(true);
      const fullReason =
        selectedReason === 'Other reason' && customReasonDetails.trim()
          ? `Other: ${customReasonDetails.trim()}`
          : customReasonDetails.trim()
            ? `${selectedReason} - ${customReasonDetails.trim()}`
            : selectedReason;

      await authApi.deleteAccount(fullReason);
      setShowDeleteModal(false);
      await SecureStore.deleteItemAsync('auth_token');
      await SecureStore.deleteItemAsync('user_profile');
      queryClient.clear();
      notifyAuthChanged();
    } catch (err: any) {
      setIsDeleting(false);
      showAlert(
        'Deletion Failed',
        err?.message || 'Could not delete your account. Please try again later.',
      );
    }
  };

  const handleDeleteAccount = async () => {
    try {
      const status = await authApi.getDeleteAccountStatus();
      if (!status.can_delete) {
        // Tier 1: Blocked
        showAlert(
          'Cannot Delete Account',
          status.reason ||
            'You have active jobs or pending applications in progress. Please conclude or cancel them before deleting your account.',
        );
        return;
      }

      setDeleteWarning(status.has_warning ? status.warning : null);
      setSelectedReason(DELETE_REASONS[0]);
      setCustomReasonDetails('');
      setShowDeleteModal(true);
    } catch (err: any) {
      showAlert(
        'Error',
        err?.message || 'Unable to check account status. Please check your connection.',
      );
    }
  };

  const handleSwitchRole = () => {
    const isTargetWorker = userRole === 'employer';
    const title = isTargetWorker ? 'Switch to Worker Mode' : 'Switch to Employer Mode';
    const message = isTargetWorker
      ? 'You are about to log in as a Worker. This mode lets you browse local job postings, apply for jobs, and manage bookmarked jobs.\n\nIf your worker profile is missing skills data, you will be guided through a quick setup first.'
      : 'You are about to log in as an Employer. This mode lets you post job listings, review applicants, and hire workers.';

    showAlert(title, message, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Continue',
        onPress: async () => {
          try {
            const response = await switchRole();
            if (response?.user) {
              await SecureStore.setItemAsync('user_profile', JSON.stringify(response.user));
            }
            if (response?.needs_onboarding) {
              navigation.navigate('RoleOnboarding', { targetRole: response.new_role });
            } else {
              notifyAuthChanged();
            }
          } catch (e) {
            showAlert('Error', 'Failed to switch roles.');
          }
        },
      },
    ]);
  };

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
            <SettingRow
              icon="person-outline"
              title="Edit Profile"
              onPress={() => navigation.navigate('EditProfile')}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="mail-outline"
              title="Email Address"
              subtitle={user?.email || 'N/A'}
              type="text"
            />
            <View style={styles.divider} />
            <SettingRow
              icon="swap-horizontal-outline"
              title={userRole === 'worker' ? 'Log in as Employer' : 'Log in as Worker'}
              onPress={handleSwitchRole}
            />
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
            <SettingRow icon="log-out-outline" title="Log Out" onPress={handleLogout} />
            <View style={styles.divider} />
            <SettingRow
              icon="trash-outline"
              title="Delete Account"
              isDestructive={true}
              onPress={handleDeleteAccount}
            />
          </View>
        </View>

        <Text style={styles.versionText}>SIKAP v1.0.0</Text>
      </ScrollView>

      {/* Delete Account Reason Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => !isDeleting && setShowDeleteModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <View style={styles.modalIconBg}>
                <Ionicons name="trash-outline" size={24} color={colors.error} />
              </View>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={styles.modalTitle}>Delete Account</Text>
                <Text style={styles.modalSubtitle}>Please tell us why you are leaving</Text>
              </View>
            </View>

            {deleteWarning && (
              <View style={styles.warningBox}>
                <Ionicons
                  name="warning-outline"
                  size={18}
                  color="#B45309"
                  style={{ marginTop: 2 }}
                />
                <Text style={styles.warningBoxText}>{deleteWarning}</Text>
              </View>
            )}

            <ScrollView style={{ maxHeight: 220, marginVertical: 12 }}>
              <Text style={styles.inputLabel}>Select a reason:</Text>
              {DELETE_REASONS.map((reason) => {
                const isSelected = selectedReason === reason;
                return (
                  <TouchableOpacity
                    key={reason}
                    style={[styles.reasonOption, isSelected && styles.reasonOptionSelected]}
                    onPress={() => setSelectedReason(reason)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={isSelected ? colors.error : colors.inkLight}
                    />
                    <Text
                      style={[
                        styles.reasonOptionText,
                        isSelected && { fontFamily: fonts.bodyBold, color: colors.ink },
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            <View style={{ marginBottom: 16 }}>
              <Text style={styles.inputLabel}>Additional feedback (optional):</Text>
              <TextInput
                style={styles.customReasonInput}
                placeholder="Help us improve SIKAP..."
                placeholderTextColor={colors.inkLight}
                value={customReasonDetails}
                onChangeText={setCustomReasonDetails}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowDeleteModal(false)}
                disabled={isDeleting}
              >
                <Text style={styles.cancelBtnText}>Keep Account</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.deleteConfirmBtn, isDeleting && { opacity: 0.7 }]}
                onPress={executeAccountDeletion}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.deleteConfirmBtnText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  scrollContent: { padding: 20, paddingBottom: 40 },
  section: { marginBottom: 24 },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    overflow: 'hidden',
    ...shadows.sm,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: colors.paperBright,
  },
  settingRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingRowTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  divider: { height: 1, backgroundColor: colors.inkFaint, marginLeft: 50 },
  versionText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkLight,
    textAlign: 'center',
    marginTop: 10,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    ...shadows.color,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 8,
  },
  warningBoxText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#92400E',
    lineHeight: 16,
  },
  inputLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.paper,
    marginBottom: 6,
    gap: 10,
  },
  reasonOptionSelected: {
    borderColor: colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.05)',
  },
  reasonOptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    flex: 1,
  },
  customReasonInput: {
    backgroundColor: colors.paper,
    borderColor: colors.inkFaint,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    minHeight: 64,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
  },
  deleteConfirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteConfirmBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#fff',
  },
});

export default SettingsScreen;
