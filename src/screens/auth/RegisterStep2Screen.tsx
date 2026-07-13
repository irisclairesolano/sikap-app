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
        } else {
          setBanner(err.message || 'Registration failed. Please try again.');
        }
      } else if (err instanceof Error || (err && err.message)) {
        setBanner(`Registration failed: ${err.message || 'Unknown error'}`);
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
              <TouchableOpacity
                style={{
                  borderWidth: 1,
                  borderColor: colors.inkFaint,
                  borderRadius: 12,
                  padding: 14,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                }}
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
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setDateOfBirth(selectedDate);
                  }}
                />
              )}
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
    marginBottom: 22,
  },
  form: {
    gap: 14,
  },
  roleCard: {
    marginTop: 16,
    backgroundColor: colors.peach,
    padding: 16,
    borderRadius: 14,
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
    color: colors.primaryDark,
  },
  footer: {
    marginTop: 32,
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
    textAlign: 'left',
  },
});

export default RegisterStep2Screen;
