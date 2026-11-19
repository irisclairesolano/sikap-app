import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useLanguage } from '../../contexts/LanguageContext';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RouteProps = RouteProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { role } = route.params;
  const insets = useSafeAreaInsets();
  const { language, setLanguage, t } = useLanguage();
  const isTagalog = language === 'tl';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation states
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'valid' | 'invalid' | null>>({});
  const [fieldStatusText, setFieldStatusText] = useState<Record<string, string>>({});

  const capitalizeName = (text: string): string => {
    return text
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const validateName = (name: string): { status: 'valid' | 'invalid' | null; message: string } => {
    if (!name) return { status: null, message: '' };
    if (name.length < 2)
      return {
        status: 'invalid',
        message: isTagalog
          ? 'Ang pangalan ay dapat hindi bababa sa 2 letra'
          : 'Name must be at least 2 characters',
      };
    if (!/^[a-zA-ZñÑáéíóúÁÉÍÓÚüÜ\u00C0-\u017F\s.'-]+$/.test(name))
      return {
        status: 'invalid',
        message: isTagalog
          ? 'Mga letra, tuldok, at gitling lamang ang maaaring gamitin sa pangalan'
          : 'Name can only contain letters, dots, and hyphens',
      };
    return { status: 'valid', message: '' };
  };

  const validateEmail = (
    email: string,
  ): { status: 'valid' | 'invalid' | null; message: string } => {
    if (!email) return { status: null, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email))
      return {
        status: 'invalid',
        message: isTagalog ? 'Hindi wastong format ng email' : 'Invalid email format',
      };
    return { status: 'valid', message: '' };
  };

  const validatePhone = (
    phone: string,
  ): { status: 'valid' | 'invalid' | null; message: string } => {
    if (!phone) return { status: null, message: '' };
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone))
      return {
        status: 'invalid',
        message: isTagalog ? 'Gamitin ang format na: 09XXXXXXXXX' : 'Use format: 09XXXXXXXX',
      };
    return { status: 'valid', message: '' };
  };

  const validatePassword = (
    password: string,
  ): { status: 'valid' | 'invalid' | null; message: string } => {
    if (!password) return { status: null, message: '' };
    if (password.length < 8)
      return {
        status: 'invalid',
        message: isTagalog ? 'Hindi bababa sa 8 karakter' : 'At least 8 characters',
      };
    if (!/[a-z]/.test(password))
      return {
        status: 'invalid',
        message: isTagalog ? 'Maglagay ng maliit na letra' : 'Include lowercase',
      };
    if (!/[A-Z]/.test(password))
      return {
        status: 'invalid',
        message: isTagalog ? 'Maglagay ng malaking letra' : 'Include uppercase',
      };
    if (!/[0-9]/.test(password))
      return {
        status: 'invalid',
        message: isTagalog ? 'Maglagay ng numero' : 'Include number',
      };
    return { status: 'valid', message: '' };
  };

  const validateConfirmPassword = (
    password?: string,
    confirm?: string,
  ): { status: 'valid' | 'invalid' | null; message: string } => {
    if (!confirm) return { status: null, message: '' };
    if (password !== confirm)
      return {
        status: 'invalid',
        message: isTagalog ? 'Hindi tugma ang mga password' : 'Passwords do not match',
      };
    return { status: 'valid', message: '' };
  };

  const { control, handleSubmit, getValues, setError, watch } = useForm({
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      password_confirmation: '',
    },
    mode: 'onBlur',
  });

  const onSubmit = (values: any) => {
    const nv = validateName(values.name);
    const ev = validateEmail(values.email);
    const pv = validatePhone(values.phone);
    const pwv = validatePassword(values.password);
    const cpwv = validateConfirmPassword(values.password, values.password_confirmation);

    if (
      nv.status === 'invalid' ||
      ev.status === 'invalid' ||
      pv.status === 'invalid' ||
      pwv.status === 'invalid' ||
      cpwv.status === 'invalid'
    ) {
      return; // form has errors
    }

    navigation.navigate('RegisterStep2', {
      role,
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      password_confirmation: values.password_confirmation,
    });
  };

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 12),
          paddingBottom: Math.max(insets.bottom, 16),
        },
      ]}
    >
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{isTagalog ? '1 sa 4' : '1 of 4'}</Text>
        </View>
        <View style={styles.langSelector}>
          <TouchableOpacity
            style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
            onPress={() => setLanguage('en')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>EN</Text>
          </TouchableOpacity>
          <View style={styles.langDivider} />
          <TouchableOpacity
            style={[styles.langBtn, language === 'tl' && styles.langBtnActive]}
            onPress={() => setLanguage('tl')}
            activeOpacity={0.8}
          >
            <Text style={[styles.langText, language === 'tl' && styles.langTextActive]}>TL</Text>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAwareScrollView
        style={styles.flex}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) + 64 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        enableOnAndroid={true}
        enableAutomaticScroll={true}
        extraScrollHeight={Platform.OS === 'android' ? 140 : 64}
        extraHeight={Platform.OS === 'android' ? 140 : 64}
        keyboardOpeningTime={0}
      >
        {/* Progress Bar */}
        <View style={styles.progressBar}>
          <View style={styles.progressActive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
          <View style={styles.progressInactive} />
        </View>

        <Text style={styles.title}>
          {isTagalog ? (
            <>
              Ibahagi ang iyong{'\n'}
              <Text style={styles.titleItalic}>pagkakakilanlan.</Text>
            </>
          ) : (
            <>
              Tell us about{'\n'}your <Text style={styles.titleItalic}>identity.</Text>
            </>
          )}
        </Text>

        <View style={styles.formCardWrapper}>
          <View style={styles.ambientGlowMint} />
          <View style={styles.ambientGlowSky} />
          <View style={styles.formCard}>
            <View style={styles.form}>
              <Controller
                control={control}
                name="name"
                rules={{
                  required: isTagalog ? 'Kinakailangan ang pangalan' : 'Name is required',
                }}
                render={({ field: { value, onChange }, fieldState }) => (
                  <Input
                    label={isTagalog ? 'Buong Pangalan' : 'Full Name'}
                    value={value}
                    onChangeText={(text) => {
                      const capitalized = capitalizeName(text);
                      onChange(capitalized);
                      const validation = validateName(capitalized);
                      setFieldStatus((prev) => ({ ...prev, name: validation.status }));
                      setFieldStatusText((prev) => ({ ...prev, name: validation.message }));
                    }}
                    error={fieldState.error?.message}
                    status={fieldStatus.name as any}
                    statusText={fieldStatusText.name}
                    placeholder="Juan Dela Cruz"
                  />
                )}
              />

              <Controller
                control={control}
                name="email"
                rules={{
                  required: isTagalog ? 'Kinakailangan ang email' : 'Email is required',
                }}
                render={({ field: { value, onChange }, fieldState }) => (
                  <Input
                    label="Email"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      const validation = validateEmail(text);
                      setFieldStatus((prev) => ({ ...prev, email: validation.status }));
                      setFieldStatusText((prev) => ({ ...prev, email: validation.message }));
                    }}
                    keyboardType="email-address"
                    error={fieldState.error?.message}
                    placeholder="you@example.com"
                    status={fieldStatus.email as any}
                    statusText={fieldStatusText.email}
                  />
                )}
              />

              <Controller
                control={control}
                name="phone"
                rules={{
                  required: isTagalog ? 'Kinakailangan ang numero' : 'Phone is required',
                }}
                render={({ field: { value, onChange }, fieldState }) => (
                  <Input
                    label={isTagalog ? 'Numero ng Telepono (09...)' : 'Phone (09...)'}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      const validation = validatePhone(text);
                      setFieldStatus((prev) => ({ ...prev, phone: validation.status }));
                      setFieldStatusText((prev) => ({ ...prev, phone: validation.message }));
                    }}
                    keyboardType="phone-pad"
                    error={fieldState.error?.message}
                    placeholder="09123456789"
                    status={fieldStatus.phone as any}
                    statusText={fieldStatusText.phone}
                  />
                )}
              />

              <Controller
                control={control}
                name="password"
                rules={{
                  required: isTagalog ? 'Kinakailangan ang password' : 'Password is required',
                }}
                render={({ field: { value, onChange }, fieldState }) => (
                  <Input
                    label="Password"
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      const validation = validatePassword(text);
                      setFieldStatus((prev) => ({ ...prev, password: validation.status }));
                      setFieldStatusText((prev) => ({ ...prev, password: validation.message }));
                    }}
                    secureTextEntry={!showPassword}
                    rightIcon={{
                      name: showPassword ? 'eye' : 'eye-off',
                      type: 'ionicon',
                      onPress: () => setShowPassword(!showPassword),
                    }}
                    error={fieldState.error?.message}
                    placeholder={
                      isTagalog ? 'Hindi bababa sa 8 karakter...' : 'At least 8 characters...'
                    }
                    status={fieldStatus.password as any}
                    statusText={fieldStatusText.password}
                  />
                )}
              />

              <Controller
                control={control}
                name="password_confirmation"
                rules={{
                  required: isTagalog ? 'Pakikumpirma ang password' : 'Please confirm password',
                }}
                render={({ field: { value, onChange }, fieldState }) => (
                  <Input
                    label={isTagalog ? 'Kumpirmahin ang Password' : 'Confirm Password'}
                    value={value}
                    onChangeText={(text) => {
                      onChange(text);
                      const pwd = watch('password');
                      const validation = validateConfirmPassword(pwd, text);
                      setFieldStatus((prev) => ({ ...prev, confirmPassword: validation.status }));
                      setFieldStatusText((prev) => ({
                        ...prev,
                        confirmPassword: validation.message,
                      }));
                    }}
                    secureTextEntry={!showConfirmPassword}
                    rightIcon={{
                      name: showConfirmPassword ? 'eye' : 'eye-off',
                      type: 'ionicon',
                      onPress: () => setShowConfirmPassword(!showConfirmPassword),
                    }}
                    error={fieldState.error?.message}
                    placeholder={isTagalog ? 'Ilagay muli ang password...' : 'Re-enter password...'}
                    status={fieldStatus.confirmPassword as any}
                    statusText={fieldStatusText.confirmPassword}
                  />
                )}
              />
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={isTagalog ? 'Susunod' : 'Next'}
            size="lg"
            fullWidth
            onPress={handleSubmit(onSubmit)}
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
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    padding: 2,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  langBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  langDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(226, 232, 240, 0.85)',
    marginHorizontal: 1,
  },
  scroll: {
    paddingHorizontal: 26,
    paddingTop: 12,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
  },
  progressActive: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  progressInactive: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.inkFaint,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 32,
    color: colors.ink,
    letterSpacing: -0.8,
    marginBottom: 18,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  formCardWrapper: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  ambientGlowMint: {
    position: 'absolute',
    top: -10,
    right: 10,
    width: 130,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(152, 251, 152, 0.18)',
  },
  ambientGlowSky: {
    position: 'absolute',
    bottom: -10,
    left: 10,
    width: 130,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(176, 226, 255, 0.18)',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  form: {
    gap: 8,
  },
  footer: {
    marginTop: 20,
    marginBottom: 16,
  },
});

export default RegisterScreen;
