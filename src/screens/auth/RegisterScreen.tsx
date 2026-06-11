import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'Register'>;
type RouteProps = RouteProp<AuthStackParamList, 'Register'>;

const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { role } = route.params;
  const insets = useSafeAreaInsets();

  const [showPassword, setShowPassword] = useState(false);
  
  // Validation states
  const [fieldStatus, setFieldStatus] = useState<Record<string, 'valid' | 'invalid' | null>>({});
  const [fieldStatusText, setFieldStatusText] = useState<Record<string, string>>({});

  const capitalizeName = (text: string): string => {
    return text
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const validateName = (name: string): { status: 'valid' | 'invalid' | null, message: string } => {
    if (!name) return { status: null, message: '' };
    if (name.length < 2) return { status: 'invalid', message: 'Name must be at least 2 characters' };
    if (!/^[a-zA-Z\s]+$/.test(name)) return { status: 'invalid', message: 'Name can only contain letters' };
    return { status: 'valid', message: '' };
  };

  const validateEmail = (email: string): { status: 'valid' | 'invalid' | null, message: string } => {
    if (!email) return { status: null, message: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { status: 'invalid', message: 'Invalid email format' };
    return { status: 'valid', message: '' };
  };

  const validatePhone = (phone: string): { status: 'valid' | 'invalid' | null, message: string } => {
    if (!phone) return { status: null, message: '' };
    const phoneRegex = /^09\d{9}$/;
    if (!phoneRegex.test(phone)) return { status: 'invalid', message: 'Use format: 09XXXXXXXX' };
    return { status: 'valid', message: '' };
  };

  const validatePassword = (password: string): { status: 'valid' | 'invalid' | null, message: string } => {
    if (!password) return { status: null, message: '' };
    if (password.length < 8) return { status: 'invalid', message: 'At least 8 characters' };
    if (!/[a-z]/.test(password)) return { status: 'invalid', message: 'Include lowercase' };
    if (!/[A-Z]/.test(password)) return { status: 'invalid', message: 'Include uppercase' };
    if (!/[0-9]/.test(password)) return { status: 'invalid', message: 'Include number' };
    return { status: 'valid', message: '' };
  };

  const { control, handleSubmit, getValues, setError } = useForm({
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

    if (nv.status === 'invalid' || ev.status === 'invalid' || pv.status === 'invalid' || pwv.status === 'invalid') {
      return; // form has errors
    }

    // Since we omit confirm password for now, just copy it or validate it
    navigation.navigate('RegisterStep2', {
      role,
      name: values.name,
      email: values.email,
      phone: values.phone,
      password: values.password,
      password_confirmation: values.password, // For backend if needed, or add field back
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
        
        {/* App Bar */}
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>1 of 4</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress Bar */}
          <View style={styles.progressBar}>
            <View style={styles.progressActive} />
            <View style={styles.progressInactive} />
            <View style={styles.progressInactive} />
            <View style={styles.progressInactive} />
          </View>

          <Text style={styles.title}>
            Tell us about{'\n'}your <Text style={styles.titleItalic}>identity.</Text>
          </Text>

          <View style={styles.form}>
            <Controller
              control={control}
              name="name"
              rules={{ required: 'Name is required' }}
              render={({ field: { value, onChange }, fieldState }) => (
                <Input
                  label="Full Name"
                  value={value}
                  onChangeText={(text) => {
                    const capitalized = capitalizeName(text);
                    onChange(capitalized);
                    const validation = validateName(capitalized);
                    setFieldStatus(prev => ({ ...prev, name: validation.status }));
                    setFieldStatusText(prev => ({ ...prev, name: validation.message }));
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
              rules={{ required: 'Email is required' }}
              render={({ field: { value, onChange }, fieldState }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    const validation = validateEmail(text);
                    setFieldStatus(prev => ({ ...prev, email: validation.status }));
                    setFieldStatusText(prev => ({ ...prev, email: validation.message }));
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
              rules={{ required: 'Phone is required' }}
              render={({ field: { value, onChange }, fieldState }) => (
                <Input
                  label="Mobile Number"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    const validation = validatePhone(text);
                    setFieldStatus(prev => ({ ...prev, phone: validation.status }));
                    setFieldStatusText(prev => ({ ...prev, phone: validation.message }));
                  }}
                  keyboardType="phone-pad"
                  error={fieldState.error?.message}
                  placeholder="09XXXXXXXXX"
                  status={fieldStatus.phone as any}
                  statusText={fieldStatusText.phone}
                />
              )}
            />

            <Controller
              control={control}
              name="password"
              rules={{ required: 'Password is required' }}
              render={({ field: { value, onChange }, fieldState }) => (
                <Input
                  label="Password"
                  value={value}
                  onChangeText={(text) => {
                    onChange(text);
                    const validation = validatePassword(text);
                    setFieldStatus(prev => ({ ...prev, password: validation.status }));
                    setFieldStatusText(prev => ({ ...prev, password: validation.message }));
                  }}
                  secureTextEntry={!showPassword}
                  rightIcon={{
                    name: showPassword ? 'eye-off' : 'eye',
                    type: 'ionicon',
                    onPress: () => setShowPassword(!showPassword),
                  }}
                  error={fieldState.error?.message}
                  status={fieldStatus.password as any}
                  statusText={fieldStatusText.password}
                />
              )}
            />
          </View>

          <View style={styles.footer}>
            <Button
              label="Next"
              size="lg"
              fullWidth
              onPress={handleSubmit(onSubmit)}
            />
          </View>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: 22,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  form: {
    gap: 8,
  },
  footer: {
    marginTop: 32,
  },
});

export default RegisterScreen;
