import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { ApiClientError } from '../../api/client';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAuth } from '../../hooks/useAuth';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { LoginRequest } from '../../types';
import { Ionicons } from '@expo/vector-icons';

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'Login'
>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const insets = useSafeAreaInsets();
  const { loginMutation } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [banner, setBanner] = useState('');

  const handleLogin = () => {
    setBanner('');
    const credentials: LoginRequest = {
      email: email.trim(),
      password,
    };

    if (!credentials.email || !credentials.password) {
      setBanner('Please fill in all fields.');
      return;
    }

    loginMutation.mutate(credentials, {
      onSuccess: (data) => {
        const status = data?.user?.registration_status;
        const navigateByStatus = (status: string) => {
          const user = data?.user;
          const role = (user?.role === 'admin' ? 'worker' : user?.role) || 'worker';
          const userId = user?.id || 0;
          const userEmail = user?.email || email;

          switch (status) {
            case 'pending_email_verification':
              navigation.navigate('OTPVerify', { userId, email: userEmail, role });
              break;
            case 'pending_id_upload':
              navigation.navigate('IDUpload', { userId, role });
              break;
            case 'pending_review':
              navigation.navigate('PendingVerify');
              break;
            case 'approved':
              // notifyAuthChanged() will trigger AuthNavigator re-render and go to Dashboard
              break;
            case 'rejected':
              setBanner('Your application was rejected. Please contact support.');
              break;
            default:
              break;
          }
        };
        if (status) {
          navigateByStatus(status);
        }
        setBanner('');
      },
      onError: (err: unknown) => {
        if (err instanceof ApiClientError) {
          setBanner(err.message === 'UNAUTHORIZED' ? 'Invalid credentials.' : err.message);
          return;
        }
        setBanner(err instanceof Error ? err.message : 'Login failed');
      },
    });
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

        <KeyboardAwareScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          enableOnAndroid={true}
          extraScrollHeight={20}
        >
          <View style={styles.brandRow}>
            <Text style={styles.brandText}>sikap</Text>
            <View style={styles.brandDot} />
          </View>

          <View style={styles.header}>
            <View style={styles.eyebrowContainer}>
              <Text style={styles.eyebrow}>Sign in</Text>
            </View>
            <Text style={styles.title}>
              Welcome <Text style={styles.titleItalic}>back.</Text>
            </Text>
            <Text style={styles.subtitle}>
              Sign in to manage your account.
            </Text>
          </View>

          {banner ? (
            <View style={styles.bannerError}>
              <Text style={styles.bannerTextError}>{banner}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              placeholder="you@example.com"
            />

            <View>
              <Input
                label="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                rightIcon={{
                  name: showPassword ? 'eye-off' : 'eye',
                  type: 'ionicon',
                  onPress: () => setShowPassword(!showPassword),
                }}
                placeholder="Your password"
              />
              <TouchableOpacity 
                style={styles.forgotBtn} 
                onPress={() => navigation.navigate('ForgotPassword')}
              >
                <Text style={styles.forgotText}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              label={loginMutation.isPending ? 'Signing in...' : 'Sign in'}
              size="lg"
              fullWidth
              loading={loginMutation.isPending}
              onPress={handleLogin}
            />
          </View>

          <View style={styles.createAccountContainer}>
            <Text style={styles.newText}>New user?</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Welcome')}>
              <Text style={styles.createText}>Create an account</Text>
            </TouchableOpacity>
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
  scroll: {
    paddingHorizontal: 26,
    paddingTop: 12,
    flexGrow: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 28,
  },
  brandText: {
    fontFamily: fonts.display,
    fontSize: 28,
    fontWeight: '900',
    color: colors.ink,
    letterSpacing: -0.84,
  },
  brandDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.primary,
    borderRadius: 4,
    marginLeft: -2,
    marginBottom: 8,
  },
  header: {
    marginBottom: 28,
  },
  eyebrowContainer: {
    marginBottom: 8,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    lineHeight: 36,
    color: colors.ink,
    letterSpacing: -0.9,
    marginBottom: 10,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
  },
  form: {
    gap: 14,
  },
  forgotBtn: {
    alignItems: 'flex-end',
    marginTop: 6,
  },
  forgotText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  footer: {
    marginTop: 24,
  },
  createAccountContainer: {
    marginTop: 'auto',
    alignItems: 'center',
    paddingTop: 40,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  newText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  createText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primary,
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

export default LoginScreen;
