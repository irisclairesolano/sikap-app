import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import React, { useState, useEffect } from 'react';
import { Platform, StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { ApiClientError } from '../../api/client';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { OtpInput } from 'react-native-otp-entry';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'OTPVerify'>;
type RouteProps = RouteProp<AuthStackParamList, 'OTPVerify'>;

const OTPVerifyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { userId, email, role } = route.params;
  const insets = useSafeAreaInsets();

  const [currentEmail, setCurrentEmail] = useState(email);
  const [isEditingEmail, setIsEditingEmail] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState(email);

  const [otp, setOtp] = useState('');
  const [banner, setBanner] = useState('');

  const [countdown, setCountdown] = useState(59);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const verifyMutation = useMutation({
    mutationFn: (code: string) => authApi.verifyOtp(userId, code, currentEmail),
    onSuccess: async (response) => {
      setBanner('');
      if (response?.user_id) {
        if ('token' in response && response.token) {
          await SecureStore.setItemAsync('auth_token', String(response.token));
        }
        navigation.replace('IDUpload' as any, { userId: response.user_id, role } as any);
        return;
      }
      setBanner('OTP verified. Please log in to continue.');
      navigation.replace('Login');
    },
    onError: (err: unknown) => {
      if (err instanceof ApiClientError) {
        if (err.status === 400)
          setBanner('Invalid verification code. Please check your email and try again.');
        else if (err.status === 404) setBanner('User not found. Please register again.');
        else if (err.status === 422) setBanner('Invalid OTP code. Please try again.');
        else if (err.status === 429)
          setBanner('Too many attempts. Please wait and try again later.');
        else setBanner(err.message || 'Verification failed. Please try again.');
      } else if (err instanceof Error) {
        setBanner(`Error: ${err.message}`);
      } else {
        setBanner('An unexpected error occurred. Please try again.');
      }
    },
  });

  const resendMutation = useMutation({
    mutationFn: () => authApi.resendOtp(userId, currentEmail),
    onSuccess: () => {
      setBanner('');
      setCountdown(59); // Reset countdown
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiClientError ? err.message : 'Could not resend code';
      setBanner(msg);
    },
  });

  const updateEmailMutation = useMutation({
    mutationFn: (newAddress: string) => authApi.updateEmail(currentEmail, newAddress),
    onSuccess: () => {
      setBanner('');
      setCurrentEmail(newEmailInput);
      setIsEditingEmail(false);
      setCountdown(59); // Start a new countdown assuming the backend resent the OTP
    },
    onError: (err: unknown) => {
      const msg = err instanceof ApiClientError ? err.message : 'Could not update email';
      setBanner(msg);
    },
  });

  const submit = () => {
    const trimmed = otp.trim();
    if (trimmed.length < 4) {
      setBanner('Enter the verification code sent to your email.');
      return;
    }
    setBanner('');
    verifyMutation.mutate(trimmed);
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>3 of 4</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAwareScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        extraScrollHeight={20}
      >
        <View style={styles.headerCentered}>
          <View style={styles.iconBox}>
            <Ionicons name="mail-open" size={28} color={colors.primary} />
          </View>

          <Text style={styles.title}>
            Check your{'\n'}
            <Text style={styles.titleItalic}>inbox.</Text>
          </Text>

          {isEditingEmail ? (
            <View style={{ width: '100%', alignItems: 'center' }}>
              <Text style={styles.subtitle}>Update your email address</Text>
              <View style={{ width: '100%', marginTop: 12 }}>
                <Input
                  value={newEmailInput}
                  onChangeText={setNewEmailInput}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  placeholder="Enter new email"
                />
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    gap: 16,
                    marginTop: 12,
                  }}
                >
                  <TouchableOpacity
                    onPress={() => {
                      setIsEditingEmail(false);
                      setNewEmailInput(currentEmail);
                    }}
                    style={{ paddingVertical: 4 }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bodySemiBold,
                        fontSize: 14,
                        color: colors.inkMuted,
                      }}
                    >
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => updateEmailMutation.mutate(newEmailInput)}
                    style={{
                      paddingVertical: 4,
                      paddingHorizontal: 16,
                      backgroundColor: colors.primary,
                      borderRadius: 20,
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.white }}>
                      {updateEmailMutation.isPending ? 'Saving...' : 'Save Email'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={{ alignItems: 'center' }}>
              <Text style={styles.subtitle}>We sent a 6-digit code to</Text>

              <View style={styles.emailRow}>
                <Text style={styles.emailText}>{currentEmail}</Text>
                <TouchableOpacity onPress={() => setIsEditingEmail(true)} style={{ padding: 4 }}>
                  <Text style={styles.editLink}>Edit</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {banner ? (
          <View style={styles.bannerError}>
            <Text style={styles.bannerTextError}>{banner}</Text>
          </View>
        ) : null}

        <View style={styles.form}>
          <Text
            style={{
              fontFamily: fonts.bodyBold,
              fontSize: 13,
              color: colors.ink,
              marginBottom: 8,
              marginLeft: 4,
            }}
          >
            6-digit code
          </Text>
          <OtpInput
            numberOfDigits={6}
            focusColor={colors.primary}
            focusStickBlinkingDuration={500}
            onTextChange={(text) => setOtp(text)}
            onFilled={(text) => {
              setOtp(text);
              // Optionally auto-submit here if you want
            }}
            theme={{
              containerStyle: {
                gap: 8,
              },
              pinCodeContainerStyle: {
                backgroundColor: colors.white,
                borderColor: colors.inkLight,
                borderWidth: 1,
                borderRadius: 12,
                flex: 1,
                height: 56,
              },
              pinCodeTextStyle: {
                fontFamily: fonts.bodyBold,
                color: colors.ink,
                fontSize: 22,
              },
              focusedPinCodeContainerStyle: {
                borderColor: colors.primary,
                borderWidth: 2,
              },
            }}
          />
        </View>

        <View style={styles.footer}>
          <Button
            label={verifyMutation.isPending ? 'Verifying...' : 'Verify Code'}
            size="lg"
            fullWidth
            loading={verifyMutation.isPending}
            onPress={submit}
          />
          <View style={styles.buttonSpacing} />
          <Button
            label={
              resendMutation.isPending
                ? 'Sending...'
                : countdown > 0
                  ? `Resend code (${countdown}s)`
                  : 'Resend code'
            }
            variant="secondary"
            size="lg"
            fullWidth
            disabled={countdown > 0}
            loading={resendMutation.isPending}
            onPress={() => resendMutation.mutate()}
          />
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: colors.white,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  stepBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scroll: {
    paddingHorizontal: 26,
    paddingTop: 12,
  },
  headerCentered: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  iconBox: {
    width: 56,
    height: 56,
    backgroundColor: colors.peach,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 38,
    lineHeight: 38,
    color: colors.ink,
    letterSpacing: -1.14,
    textAlign: 'center',
    marginBottom: 14,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: 2,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  emailText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  editLink: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.primary,
  },
  form: {
    marginTop: 10,
  },
  footer: {
    marginTop: 32,
  },
  buttonSpacing: {
    height: 12,
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  bannerTextError: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
});

export default OTPVerifyScreen;
