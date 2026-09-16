import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { authApi } from '../../api/auth';
import { ApiClientError } from '../../api/client';
import { sanitizeErrorMessage } from '../../utils/errorSanitizer';
import Button from '../../components/common/Button';
import LocationPicker from '../../components/common/LocationPicker';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { TouchableOpacity } from 'react-native-gesture-handler';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'RegisterStep2'>;
type RouteProps = RouteProp<AuthStackParamList, 'RegisterStep2'>;

const RegisterStep2Screen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<RouteProps>();
  const { role, name, email, phone, password, password_confirmation } = route.params;
  const insets = useSafeAreaInsets();

  const [banner, setBanner] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      municipality: '',
      barangay: '',
    },
  });

  const watchedMunicipality = watch('municipality');
  const watchedBarangay = watch('barangay');

  React.useEffect(() => {
    if (watchedMunicipality) {
      setValue('barangay', '');
    }
  }, [watchedMunicipality, setValue]);

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data: any) => {
      setBanner('');
      const userId = data?.user?.id || 1;
      navigation.navigate('OTPVerify', { userId, email, role });
    },
    onError: (err: any) => {
      console.log('Register onError:', err);
      // Use structural check instead of instanceof which can fail in React Native
      const isApiClientError =
        err &&
        (err instanceof ApiClientError ||
          err.name === 'ApiClientError' ||
          typeof err.status === 'number');

      if (isApiClientError) {
        if (err.status === 422) {
          if (err.errors) {
            const errorMessages = Object.values(err.errors).flat();
            setBanner(errorMessages.join('. '));
          } else {
            setBanner('Validation failed. Please check your information and try again.');
          }
        } else if (err.status === 409) {
          setBanner(
            'Your email is already registered. Redirecting to login so you can resume your application...',
          );
          setTimeout(() => {
            navigation.navigate('Login');
          }, 2500);
        } else {
          setBanner(sanitizeErrorMessage(err.message || 'Registration failed. Please try again.'));
        }
      } else if (err instanceof Error || (err && (err as any).message)) {
        setBanner(
          sanitizeErrorMessage((err as any).message || 'Registration failed. Please try again.'),
        );
      } else {
        setBanner('An unexpected error occurred.');
      }
    },
  });

  const onSubmit = (values: any) => {
    setBanner('');
    if (!values.municipality || !values.barangay) {
      setBanner('Please select a municipality and barangay.');
      return;
    }

    // Verify age is at least 15
    const today = new Date();
    let age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    const dayDiff = today.getDate() - dateOfBirth.getDate();
    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age--;
    }

    if (age < 15) {
      setBanner('You must be at least 15 years old to register.');
      return;
    }

    const payload = {
      role,
      name,
      email,
      phone,
      password,
      password_confirmation,
      municipality: values.municipality,
      barangay: values.barangay,
      date_of_birth: dateOfBirth.toISOString().split('T')[0],
    };

    registerMutation.mutate(payload);
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
            <Text style={styles.stepBadgeText}>2 of 4</Text>
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
            <View style={styles.progressActive} />
            <View style={styles.progressInactive} />
            <View style={styles.progressInactive} />
          </View>

          <Text style={styles.title}>
            Where do{'\n'}you <Text style={styles.titleItalic}>live?</Text>
          </Text>
          <Text style={styles.subtitle}>We use your barangay to show you nearby jobs.</Text>

          {banner ? (
            <View style={styles.bannerError}>
              <Text style={styles.bannerTextError}>{banner}</Text>
            </View>
          ) : null}

          <View style={styles.formCardWrapper}>
            <View style={styles.ambientGlowSky} />
            <View style={styles.ambientGlowPeach} />
            <View style={styles.formCard}>
              <View style={styles.form}>
                <LocationPicker
                  municipalityValue={watchedMunicipality}
                  barangayValue={watchedBarangay}
                  onMunicipalityChange={(value: string) => setValue('municipality', value)}
                  onBarangayChange={(value: string) => setValue('barangay', value)}
                  municipalityError={errors.municipality?.message}
                  barangayError={errors.barangay?.message}
                />

                <View style={{ marginTop: 8 }}>
                  <Text
                    style={{
                      fontFamily: fonts.bodyBold,
                      fontSize: 13,
                      color: colors.inkSoft,
                      marginBottom: 6,
                    }}
                  >
                    Date of Birth
                  </Text>
                  {Platform.OS === 'web' ? (
                    <input
                      type="date"
                      value={dateOfBirth.toISOString().split('T')[0]}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        if (e.target.value) {
                          setDateOfBirth(new Date(e.target.value));
                        }
                      }}
                      style={{
                        borderWidth: 1.5,
                        borderColor: 'rgba(226, 232, 240, 0.85)',
                        borderRadius: 14,
                        padding: 14,
                        fontFamily: 'inherit',
                        fontSize: 15,
                        width: '100%',
                        color: colors.ink,
                        backgroundColor: 'rgba(255, 255, 255, 0.82)',
                      }}
                    />
                  ) : (
                    <>
                      <TouchableOpacity
                        style={styles.datePickerBtn}
                        onPress={() => setShowDatePicker(true)}
                      >
                        <Ionicons name="calendar-outline" size={20} color={colors.inkMuted} />
                        <Text style={{ fontFamily: fonts.body, fontSize: 15, color: colors.ink }}>
                          {dateOfBirth.toLocaleDateString()}
                        </Text>
                      </TouchableOpacity>
                      {showDatePicker && (
                        <DateTimePicker
                          value={dateOfBirth}
                          mode="date"
                          display="default"
                          maximumDate={new Date()}
                          onValueChange={(_event, selectedDate) => {
                            setShowDatePicker(false);
                            if (selectedDate) setDateOfBirth(selectedDate);
                          }}
                          onDismiss={() => setShowDatePicker(false)}
                        />
                      )}
                    </>
                  )}
                </View>
              </View>
            </View>
          </View>

          <View style={styles.roleCard}>
            <Text style={styles.roleLabel}>I am a:</Text>
            <View style={styles.roleRow}>
              <Text style={styles.roleText}>{role === 'worker' ? 'Worker' : 'Employer'}</Text>
              <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
            </View>
          </View>

          <View style={styles.footer}>
            <Button
              label={registerMutation.isPending ? 'Creating account...' : 'Next'}
              size="lg"
              fullWidth
              loading={registerMutation.isPending}
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
    marginBottom: 10,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    marginBottom: 18,
  },
  formCardWrapper: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  ambientGlowSky: {
    position: 'absolute',
    top: -15,
    right: 10,
    width: 140,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(176, 226, 255, 0.40)',
  },
  ambientGlowPeach: {
    position: 'absolute',
    bottom: -15,
    left: 10,
    width: 140,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 197, 208, 0.35)',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  form: {
    gap: 14,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.80)',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
  },
  roleCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 18,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    padding: 16,
    marginTop: 14,
    marginBottom: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  roleLabel: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 12,
    color: colors.inkMuted,
    marginBottom: 4,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  roleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  footer: {
    marginTop: 16,
  },
  bannerError: {
    backgroundColor: colors.status.rejected.bg,
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
    textAlign: 'left',
  },
});

export default RegisterStep2Screen;
