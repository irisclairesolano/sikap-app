import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Modal, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Wordmark } from '../../components/common/Wordmark';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from '../../utils/storage';
import { notifyAuthChanged } from '../../store/authEvents';
import GoogleAuthButton from '../../components/common/GoogleAuthButton';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';
import { authApi } from '../../api/auth';
import { useAuth } from '../../hooks/useAuth';
import { sanitizeErrorMessage } from '../../utils/errorSanitizer';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const queryClient = useQueryClient();
  const { setAuthSession } = useAuth();

  const { promptAsync, response: googleResponse } = useGoogleAuth();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [banner, setBanner] = useState('');

  // Role Selection Modal for new Google users
  const [roleModalVisible, setRoleModalVisible] = useState(false);
  const [pendingGoogleData, setPendingGoogleData] = useState<{
    googleUser: any;
    idToken?: string;
    accessToken?: string;
  } | null>(null);

  React.useEffect(() => {
    // Proactively clear any stale user profile cache when landing on welcome
    SecureStore.deleteItemAsync('user_profile').catch(() => {});
  }, []);

  React.useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { id_token, access_token } = (googleResponse.params as any) || {};
      const authCode = (googleResponse as any).authentication;
      const idTokenToUse = id_token || authCode?.idToken;
      const accessTokenToUse = access_token || authCode?.accessToken;

      if (!idTokenToUse && !accessTokenToUse) {
        setIsGoogleLoading(false);
        setBanner('Failed to receive Google authentication credentials.');
        return;
      }

      setIsGoogleLoading(true);
      setBanner('');

      authApi
        .googleAuth({
          id_token: idTokenToUse,
          access_token: accessTokenToUse,
        })
        .then(async (res) => {
          setIsGoogleLoading(false);
          if (res.status === 'authenticated' && res.token && res.user) {
            // Existing user -> log in immediately
            await setAuthSession(res.token, res.user);
            const status = res.user.registration_status;
            if (status === 'pending_id_upload') {
              navigation.navigate('IDUpload', { userId: res.user.id, role: res.user.role });
            } else if (status === 'pending_review' || status === 'rejected') {
              navigation.navigate('PendingVerify');
            }
          } else if (res.status === 'needs_registration_details') {
            // New user -> prompt for role selection
            setPendingGoogleData({
              googleUser: res.google_user,
              idToken: idTokenToUse,
              accessToken: accessTokenToUse,
            });
            setRoleModalVisible(true);
          }
        })
        .catch((err: any) => {
          setIsGoogleLoading(false);
          setBanner(sanitizeErrorMessage(err?.message || 'Google authentication failed.'));
        });
    } else if (googleResponse?.type === 'error' || googleResponse?.type === 'dismiss') {
      setIsGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleAuth = async () => {
    try {
      setBanner('');
      setIsGoogleLoading(true);
      const res = await promptAsync();
      if (res?.type !== 'success') {
        setIsGoogleLoading(false);
      }
    } catch (err: any) {
      setIsGoogleLoading(false);
      setBanner(sanitizeErrorMessage(err?.message || 'Could not initiate Google sign in.'));
    }
  };

  const handleSelectRoleForGoogle = (selectedRole: 'worker' | 'employer') => {
    setRoleModalVisible(false);
    if (!pendingGoogleData) return;

    navigation.navigate('RegisterStep2', {
      role: selectedRole,
      name: pendingGoogleData.googleUser?.name || '',
      email: pendingGoogleData.googleUser?.email || '',
      phone: '',
      id_token: pendingGoogleData.idToken,
      access_token: pendingGoogleData.accessToken,
      avatar_url: pendingGoogleData.googleUser?.avatar_url || undefined,
      is_google: true,
    });
  };

  const navigateToRegister = (role: 'worker' | 'employer') => {
    navigation.navigate('Register', { role });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Wordmark size={28} />
          </View>

          <View style={styles.heroCardWrapper}>
            <View style={styles.ambientGlowPeach} />
            <View style={styles.ambientGlowSky} />
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>BUILT FOR INFORMAL WORK</Text>
              <Text style={styles.title}>
                Find Work.{'\n'}
                Build Your{'\n'}
                <Text style={styles.titleItalic}>Kabuhayan.</Text>
              </Text>
              <Text style={styles.lede}>
                Trusted local employers. Privacy every step. Free for workers, always.
              </Text>
            </View>
          </View>

          <View style={styles.valueProps}>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>Free</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="shield-checkmark" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>Private</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="location" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>Sorsogon-wide</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          {banner ? (
            <View style={styles.bannerError}>
              <Text style={styles.bannerTextError}>{banner}</Text>
            </View>
          ) : null}

          <Button
            label="I'm a Worker"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('worker')}
          />
          <View style={{ height: 10 }} />
          <Button
            label="I'm an Employer"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('employer')}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or continue with</Text>
            <View style={styles.dividerLine} />
          </View>

          <GoogleAuthButton
            onPress={handleGoogleAuth}
            loading={isGoogleLoading}
            title="Continue with Google"
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Log in
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Role Selection Modal for Google Sign Up */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Ionicons name="person-circle" size={44} color={colors.primary} />
              <Text style={styles.modalTitle}>Join SIKAP with Google</Text>
              <Text style={styles.modalSubtitle}>Choose how you will be using your account:</Text>
            </View>

            <TouchableOpacity
              style={styles.roleChoiceCard}
              activeOpacity={0.8}
              onPress={() => handleSelectRoleForGoogle('worker')}
            >
              <View style={styles.roleChoiceIcon}>
                <Ionicons name="hammer" size={24} color={colors.primary} />
              </View>
              <View style={styles.roleChoiceText}>
                <Text style={styles.roleChoiceTitle}>I am a Worker</Text>
                <Text style={styles.roleChoiceDesc}>
                  Naghahanap ng trabaho o mag-alok ng serbisyo
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.roleChoiceCard, { marginTop: 10 }]}
              activeOpacity={0.8}
              onPress={() => handleSelectRoleForGoogle('employer')}
            >
              <View style={styles.roleChoiceIcon}>
                <Ionicons name="briefcase" size={24} color={colors.primarySoft} />
              </View>
              <View style={styles.roleChoiceText}>
                <Text style={styles.roleChoiceTitle}>I am an Employer</Text>
                <Text style={styles.roleChoiceDesc}>Naghahanap ng maaasahang manggagawa</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topSection: {
    flexShrink: 0,
  },
  header: {
    alignItems: 'flex-start',
  },
  heroCardWrapper: {
    position: 'relative',
    marginTop: 20,
  },
  ambientGlowPeach: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 197, 208, 0.20)',
  },
  ambientGlowSky: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(176, 226, 255, 0.20)',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.ink,
    letterSpacing: -1.2,
    lineHeight: 36,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  lede: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 12,
  },
  valueProps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  valueText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  footer: {
    marginTop: 20,
    paddingTop: 4,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E2E8F0',
  },
  dividerText: {
    paddingHorizontal: 10,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  loginText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
  },
  loginLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primary,
  },
  bannerError: {
    backgroundColor: colors.status.rejected.bg,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  bannerTextError: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 19,
    color: colors.ink,
    marginTop: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    textAlign: 'center',
    marginTop: 4,
  },
  roleChoiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    gap: 12,
  },
  roleChoiceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  roleChoiceText: {
    flex: 1,
  },
  roleChoiceTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  roleChoiceDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
  },
  modalCancelBtn: {
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 8,
  },
  modalCancelText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.inkMuted,
  },
});

export default WelcomeScreen;
