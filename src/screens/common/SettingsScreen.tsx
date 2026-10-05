import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from '../../utils/storage';
import { sanitizeErrorMessage } from '../../utils/errorSanitizer';

// ─── Static content modal ────────────────────────────────────────────────────

type ContentSection = { heading?: string; body: string };

const ContentModal = ({
  visible,
  onClose,
  icon,
  iconColor,
  iconBg,
  title,
  sections,
}: {
  visible: boolean;
  onClose: () => void;
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  sections: ContentSection[];
}) => (
  <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={cStyles.overlay}>
      <View style={cStyles.sheet}>
        {/* Drag handle */}
        <View style={cStyles.handle} />

        {/* Header */}
        <View style={cStyles.sheetHeader}>
          <View style={[cStyles.iconCircle, { backgroundColor: iconBg }]}>
            <Ionicons name={icon as any} size={22} color={iconColor} />
          </View>
          <Text style={cStyles.sheetTitle}>{title}</Text>
          <TouchableOpacity onPress={onClose} style={cStyles.closeBtn} activeOpacity={0.7}>
            <Ionicons name="close" size={22} color={colors.inkSoft} />
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={cStyles.body}>
          {sections.map((s, i) => (
            <View key={i} style={{ marginBottom: 18 }}>
              {s.heading ? <Text style={cStyles.heading}>{s.heading}</Text> : null}
              <Text style={cStyles.bodyText}>{s.body}</Text>
            </View>
          ))}
        </ScrollView>

        <TouchableOpacity style={cStyles.closeFullBtn} onPress={onClose} activeOpacity={0.8}>
          <Text style={cStyles.closeFullBtnText}>Close</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

const cStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.paperBright,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 32,
    paddingHorizontal: 20,
    maxHeight: '88%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    flex: 1,
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { paddingBottom: 8 },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 6,
  },
  bodyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
  },
  closeFullBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  closeFullBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: '#fff',
    letterSpacing: 0.3,
  },
});

// ─── Content data ─────────────────────────────────────────────────────────────

const HELP_SECTIONS: ContentSection[] = [
  {
    heading: '👋 Welcome to SIKAP Help Center',
    body: 'SIKAP connects local workers with employers across the Province of Sorsogon. This guide covers the most common questions about using the app.',
  },
  {
    heading: 'Getting Started',
    body: 'After signing up, complete your profile by adding your skills, work history, and character references. A complete profile increases your chances of getting hired.\n\nEmployers can post job listings and review applicants directly from the app.',
  },
  {
    heading: 'Applying for Jobs',
    body: 'Browse available job listings in the Find tab. Tap any listing to view details and tap "Apply" to submit a cover note. You can track your applications in the Mine tab.',
  },
  {
    heading: 'Hiring Process',
    body: 'The SIKAP hiring process has five stages:\n\n1. Application Submitted — You applied for the job post.\n2. Shortlisted — The employer reviewed your application and opened in-app chat for negotiation.\n3. Offer Sent — The employer confirms final compensation and sends the formal hiring offer.\n4. Hired — You accept the offer and the job officially begins.\n5. Completed — Work is finished, receipt is generated, and ratings and reviews are exchanged.',
  },
  {
    heading: 'Messaging',
    body: 'Once shortlisted, you can message the employer through the Messages tab. Conversations are only available between matched applicants and employers for privacy.',
  },
  {
    heading: 'Ratings & Reviews',
    body: 'After a job is completed, both workers and employers may leave ratings and reviews. These affect your reputation score visible on your profile.',
  },
  {
    heading: 'ID Verification',
    body: 'For security, workers must submit a valid government-issued ID (front and back) and a selfie. Employers may upload business documents available to them. Verification is reviewed by our admin team within 1–3 business days.',
  },
  {
    heading: 'Account Issues',
    body: "If you're having trouble logging in, try resetting your password via the login screen. If your account is suspended or flagged, you may submit an in-app support ticket.",
  },
  {
    heading: 'Reporting & Safety',
    body: 'You can report suspicious users, job posts, or behavior using the Report button available on profiles and listings. Our team reviews every report.',
  },
  {
    heading: 'Contact Support',
    body: 'For additional help, you can submit an in-app support ticket anytime under Settings > Support Tickets. Our admin team will review and respond directly inside the app.',
  },
];

const TERMS_SECTIONS: ContentSection[] = [
  {
    heading: 'Terms of Service',
    body: 'Last updated: October 5, 2026\n\nBy using SIKAP, you agree to be bound by these Terms of Service. Please read them carefully.',
  },
  {
    heading: '1. Acceptance of Terms',
    body: 'By accessing or using the SIKAP platform, you confirm that you are at least 18 years old and agree to comply with these Terms. If you do not agree, do not use this application.',
  },
  {
    heading: '2. Description of Service',
    body: 'SIKAP is a platform that connects local workers and employers in the Province of Sorsogon. We facilitate job discovery, applications, and communications between users.',
  },
  {
    heading: '3. User Accounts',
    body: 'You are responsible for maintaining the confidentiality of your account credentials. You agree to provide accurate, truthful information during registration and to keep your profile updated.\n\nSIKAP reserves the right to suspend or terminate accounts that violate these Terms.',
  },
  {
    heading: '4. User Conduct',
    body: 'You agree not to:\n• Post false or misleading job listings or profiles\n• Harass, threaten, or discriminate against other users\n• Use the platform for illegal activities\n• Circumvent security or authentication measures\n• Upload harmful or offensive content\n\nViolations may result in immediate account suspension.',
  },
  {
    heading: '5. Job Listings and Applications',
    body: 'Employers are responsible for the accuracy of their job listings. Workers are responsible for the accuracy of their applications. SIKAP does not guarantee employment outcomes and is not a party to any employment agreement between users.',
  },
  {
    heading: '6. ID Verification',
    body: 'Users may be required to submit identity documents for verification purposes. Submitted documents are reviewed by SIKAP administrators solely for identity verification and are handled in accordance with our Privacy Policy.',
  },
  {
    heading: '7. Payments and Compensation',
    body: 'SIKAP does not process payments between workers and employers. All financial agreements are made directly between users. SIKAP bears no responsibility for payment disputes.',
  },
  {
    heading: '8. Content Ownership',
    body: 'You retain ownership of content you post on SIKAP. By posting, you grant SIKAP a non-exclusive, royalty-free license to display and distribute that content within the platform.',
  },
  {
    heading: '9. Limitation of Liability',
    body: 'SIKAP is provided "as is." We are not liable for any indirect, incidental, or consequential damages arising from your use of the platform, including disputes between users.',
  },
  {
    heading: '10. Changes to Terms',
    body: 'We may update these Terms from time to time. Continued use of SIKAP after changes constitutes your acceptance of the updated Terms. We will notify users of significant changes through the app.',
  },
  {
    heading: '11. Governing Law',
    body: 'These Terms are governed by the laws of the Republic of the Philippines. Any disputes shall be subject to the jurisdiction of the appropriate courts in Sorsogon.',
  },
  {
    heading: '12. Contact',
    body: 'For questions about these Terms, please submit an in-app support ticket through the SIKAP application.',
  },
];

const PRIVACY_SECTIONS: ContentSection[] = [
  {
    heading: 'Privacy Policy',
    body: 'Last updated: October 1, 2026\n\nSIKAP is committed to protecting your personal information. This Privacy Policy explains how we collect, use, and protect your data.',
  },
  {
    heading: '1. Information We Collect',
    body: 'We collect:\n• Account information: name, email, phone number, date of birth, barangay, municipality\n• Profile data: skills, work history, character references, bio, profile photo\n• Identity documents: government-issued ID (front and back) and selfie for verification\n• Device information: push notification tokens\n• Usage data: screens visited, actions taken within the app',
  },
  {
    heading: '2. How We Use Your Information',
    body: 'We use your information to:\n• Create and manage your account\n• Verify your identity and prevent fraud\n• Enable communication between workers and employers\n• Send notifications about job updates and applications\n• Improve the SIKAP platform\n• Respond to support requests',
  },
  {
    heading: '3. Information Sharing',
    body: 'We share your information only:\n• With employers or workers as necessary for job applications (e.g., your name, skills, and photo)\n• With administrators for identity verification\n• When required by Philippine law or legal process\n\nWe do not sell your personal information to third parties.',
  },
  {
    heading: '4. Identity Documents',
    body: 'Government-issued IDs and selfies submitted for verification are stored securely and accessed only by SIKAP administrators for identity verification purposes. These documents are not shared with employers or other users.',
  },
  {
    heading: '5. Data Retention',
    body: 'We retain your personal information for as long as your account is active. Upon account deletion, your data is removed from our active systems within 30 days, except where retention is required by law.',
  },
  {
    heading: '6. Data Security',
    body: 'We implement industry-standard security measures to protect your information, including encrypted storage and secure HTTPS communication. However, no system is completely secure, and we cannot guarantee absolute security.',
  },
  {
    heading: '7. Your Rights',
    body: 'Under the Philippine Data Privacy Act of 2012 (Republic Act No. 10173), you have the right to:\n• Access your personal data\n• Correct inaccurate data\n• Request deletion of your data\n• Withdraw consent at any time\n\nTo exercise these rights, submit an in-app request through the Help & Support section in the SIKAP app.',
  },
  {
    heading: "8. Children's Privacy",
    body: 'SIKAP is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has registered, please contact us immediately.',
  },
  {
    heading: '9. Changes to This Policy',
    body: 'We may update this Privacy Policy from time to time. We will notify users of significant changes via the app. Continued use of SIKAP after changes constitutes acceptance of the updated policy.',
  },
  {
    heading: '10. Contact Us',
    body: 'For privacy concerns or data requests, contact us through our official in-app support channels.',
  },
];

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
  const [showHelp, setShowHelp] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

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
          status.reason
            ? sanitizeErrorMessage(status.reason)
            : 'You have active jobs or pending applications in progress. Please conclude or cancel them before deleting your account.',
        );
        return;
      }

      setDeleteWarning(
        status.has_warning && status.warning ? sanitizeErrorMessage(status.warning) : null,
      );
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
            await switchRole();
          } catch (e: any) {
            showAlert('Error', e?.message || 'Failed to switch roles.');
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
            <SettingRow
              icon="help-circle-outline"
              title="Help Center"
              onPress={() => setShowHelp(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="chatbubbles-outline"
              title="Support Tickets"
              onPress={() => navigation.navigate('SupportTickets' as never)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="document-text-outline"
              title="Terms of Service"
              onPress={() => setShowTerms(true)}
            />
            <View style={styles.divider} />
            <SettingRow
              icon="lock-closed-outline"
              title="Privacy Policy"
              onPress={() => setShowPrivacy(true)}
            />
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

      {/* Help Center Modal */}
      <ContentModal
        visible={showHelp}
        onClose={() => setShowHelp(false)}
        icon="help-circle-outline"
        iconColor={colors.primary}
        iconBg={colors.peach}
        title="Help Center"
        sections={HELP_SECTIONS}
      />

      {/* Terms of Service Modal */}
      <ContentModal
        visible={showTerms}
        onClose={() => setShowTerms(false)}
        icon="document-text-outline"
        iconColor="#6366F1"
        iconBg="#EEF2FF"
        title="Terms of Service"
        sections={TERMS_SECTIONS}
      />

      {/* Privacy Policy Modal */}
      <ContentModal
        visible={showPrivacy}
        onClose={() => setShowPrivacy(false)}
        icon="lock-closed-outline"
        iconColor={colors.mintDeep}
        iconBg={colors.mint}
        title="Privacy Policy"
        sections={PRIVACY_SECTIONS}
      />

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
