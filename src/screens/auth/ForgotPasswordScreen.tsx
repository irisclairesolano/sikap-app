import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;

const ForgotPasswordScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOTP = async () => {
    if (!email) {
      setError('Email is required');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return;
    }

    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      // Even if user not found, we might want to navigate to OTP screen for security,
      // but backend returns 404 for UX as per our implementation.
      navigation.navigate('ResetOTPVerify', { email });
    } catch (err: any) {
      // If the backend returns 404, we can still show a generic message or the error.
      Alert.alert('Notice', 'If an account exists with this email, an OTP has been sent.');
      navigation.navigate('ResetOTPVerify', { email });
    } finally {
      setLoading(false);
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
        <View style={styles.iconBox}>
          <Ionicons name="lock-closed" size={32} color={colors.primary} />
        </View>

        <Text style={styles.title}>
          Forgot{'\n'}
          <Text style={styles.titleItalic}>password?</Text>
        </Text>

        <Text style={styles.body}>
          Enter the email address associated with your account, and we'll send you an OTP to reset
          your password.
        </Text>

        <Input
          label="Email Address"
          placeholder="e.g. juan@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={(val) => {
            setEmail(val);
            setError('');
          }}
          error={error}
        />

        <View style={styles.footer}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Button label="Send OTP" size="lg" fullWidth onPress={handleSendOTP} />
          )}
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
    paddingTop: 24,
  },
  iconBox: {
    width: 64,
    height: 64,
    backgroundColor: colors.peach,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 36,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.9,
    marginBottom: 12,
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
  footer: {
    marginTop: 24,
  },
});

export default ForgotPasswordScreen;
