import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { useAlert } from '../../contexts/AlertContext';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ResetOTPVerify'>;
type RouteType = RouteProp<AuthStackParamList, 'ResetOTPVerify'>;

const ResetOTPVerifyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteType>();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const { email } = route.params;

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [cooldown]);

  const handleVerify = async () => {
    Keyboard.dismiss();
    if (otp.length !== 6) {
      setError('Please enter a 6-digit OTP.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const res = await authApi.verifyResetOtp(email, otp);
      if (res.reset_token) {
        navigation.navigate('NewPassword', { resetToken: res.reset_token });
      } else {
        setError('Verification failed. Please try again.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await authApi.forgotPassword(email);
      showAlert('Sent', 'A new OTP has been sent to your email.');
      setCooldown(60);
    } catch (err: any) {
      showAlert('Notice', 'A new OTP has been sent if the email exists.');
      setCooldown(60);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={{ width: 40 }} />
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>
          Check{'\n'}
          <Text style={styles.titleItalic}>your email</Text>
        </Text>

        <Text style={styles.body}>
          We sent a 6-digit verification code to <Text style={styles.emailText}>{email}</Text>.
          Please enter it below to reset your password.
        </Text>

        <Input
          label="Verification Code (OTP)"
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={(val) => {
            setOtp(val.replace(/[^0-9]/g, ''));
            setError('');
          }}
          error={error}
        />

        <View style={styles.footer}>
          <Button
            label="Verify Code"
            size="lg"
            fullWidth
            onPress={handleVerify}
            loading={loading}
          />

          <TouchableOpacity
            style={[styles.resendBtn, cooldown > 0 && { opacity: 0.6 }]}
            onPress={handleResend}
            disabled={cooldown > 0}
          >
            <Text style={[styles.resendText, cooldown > 0 && { color: colors.inkMuted }]}>
              {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't receive a code? Resend"}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
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
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.9,
    marginBottom: 16,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkSoft,
    lineHeight: 22,
    marginBottom: 24,
  },
  emailText: {
    fontFamily: fonts.bodyMedium,
    color: colors.ink,
  },
  footer: {
    marginTop: 12,
  },
  resendBtn: {
    marginTop: 24,
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: colors.primary,
  },
});

export default ResetOTPVerifyScreen;
