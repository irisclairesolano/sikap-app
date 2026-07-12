import React, { useState } from 'react';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, shadows } from '../../theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { useAlert } from '../../contexts/AlertContext';
import { profileApi } from '../../api/profile';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, refetchProfile } = useAuth();
  const queryClient = useQueryClient();

  const [name, setName] = useState(user?.name || '');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  const [municipality, setMunicipality] = useState(user?.municipality || '');
  const [bio, setBio] = useState(
    user?.worker_profile?.bio || user?.employer_profile?.description || '',
  );
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [dateOfBirth, setDateOfBirth] = useState(
    user?.date_of_birth ? new Date(user.date_of_birth) : new Date('1990-01-01'),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [emergencyContactName, setEmergencyContactName] = useState(
    user?.emergency_contact_name || '',
  );
  const [emergencyContactPhone, setEmergencyContactPhone] = useState(
    user?.emergency_contact_phone || '',
  );

  const { showAlert } = useAlert();

  const isVerified = user?.verification_status === 'approved';

  const getAvatarUrl = () => {
    if (!user?.avatar_url) return null;
    if (user.avatar_url.startsWith('http')) return user.avatar_url;
    return `${process.env.EXPO_PUBLIC_API_URL?.replace('/api/v1', '')}${user.avatar_url}`;
  };

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      uploadAvatar(uri);
    }
  };

  const uploadAvatar = async (uri: string) => {
    try {
      setIsUploading(true);
      await profileApi.uploadAvatar(uri);
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setAlertConfig({
        title: 'Looking Good!',
        message: 'Your profile picture was updated successfully.',
        onPress: undefined,
      });
      setAlertVisible(true);
    } catch (err: any) {
      console.error(err);
      setAlertConfig({
        title: 'Upload Failed',
        message: err.message || 'We could not upload your profile picture.',
        onPress: undefined,
      });
      setAlertVisible(true);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (user?.role === 'worker') {
      const phoneRegex = /^09\d{9}$/;
      if (emergencyContactPhone && !phoneRegex.test(emergencyContactPhone)) {
        setAlertConfig({
          title: 'Invalid Phone Number',
          message: 'Emergency contact phone must start with 09 and be exactly 11 digits long.',
          onPress: undefined,
        });
        setAlertVisible(true);
        return;
      }
      if (emergencyContactPhone && emergencyContactPhone === user.phone) {
        setAlertConfig({
          title: 'Invalid Phone Number',
          message: 'Emergency contact phone cannot be your own phone number.',
          onPress: undefined,
        });
        setAlertVisible(true);
        return;
      }
    }

    try {
      setIsSaving(true);
      const updateData: any = {
        barangay,
        municipality,
        bio: user?.role === 'worker' ? bio : undefined,
        description: user?.role === 'employer' ? bio : undefined,
        date_of_birth: dateOfBirth.toISOString().split('T')[0],
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
      };

      if (!isVerified) {
        updateData.name = name;
      }

      await profileApi.updateProfile(updateData);
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showAlert('Profile Saved', 'Your changes have been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (err: any) {
      console.error(err);
      showAlert('Save Failed', err.message || 'We could not save your changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Edit Profile</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.avatarSection}>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={handlePickAvatar}
            disabled={isUploading}
          >
            {isUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : getAvatarUrl() ? (
              <Image source={{ uri: getAvatarUrl()! }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{name ? name.charAt(0) : 'U'}</Text>
            )}
            <View style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color={colors.paperBright} />
            </View>
          </TouchableOpacity>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="Juan Reyes"
            editable={!isVerified}
          />
          {isVerified && (
            <Text style={styles.helperText}>Verified accounts cannot change their name.</Text>
          )}
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Barangay</Text>
          <Input value={barangay} onChangeText={setBarangay} placeholder="Barangay" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Municipality</Text>
          <Input value={municipality} onChangeText={setMunicipality} placeholder="Municipality" />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Date of Birth</Text>
          <TouchableOpacity
            style={{
              borderWidth: 1,
              borderColor: isVerified ? 'transparent' : colors.inkFaint,
              borderRadius: 12,
              padding: 14,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
              backgroundColor: isVerified ? colors.paperBright : 'transparent',
              opacity: isVerified ? 0.7 : 1,
            }}
            onPress={() => !isVerified && setShowDatePicker(true)}
            activeOpacity={isVerified ? 1 : 0.2}
          >
            <Ionicons name="calendar-outline" size={20} color={colors.inkMuted} />
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 15,
                color: isVerified ? colors.inkMuted : colors.ink,
              }}
            >
              {dateOfBirth.toLocaleDateString()}
            </Text>
          </TouchableOpacity>
          {isVerified && (
            <Text style={styles.helperText}>
              Verified accounts cannot change their date of birth.
            </Text>
          )}
          {showDatePicker && !isVerified && (
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

        {user?.role === 'worker' && (
          <>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Emergency Contact Name</Text>
              <Input
                value={emergencyContactName}
                onChangeText={setEmergencyContactName}
                placeholder="Juan Dela Cruz"
              />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Emergency Contact Phone</Text>
              <Input
                value={emergencyContactPhone}
                onChangeText={(text) => {
                  // Strict length formatting (digits only, max 11)
                  const formatted = text.replace(/[^0-9]/g, '').slice(0, 11);
                  setEmergencyContactPhone(formatted);
                }}
                placeholder="09XXXXXXXXX"
                keyboardType="phone-pad"
                maxLength={11}
                status={
                  emergencyContactPhone.length === 0
                    ? null
                    : emergencyContactPhone === user?.phone
                      ? 'invalid'
                      : /^09\d{9}$/.test(emergencyContactPhone)
                        ? 'valid'
                        : 'invalid'
                }
                statusText={
                  emergencyContactPhone.length > 0 && emergencyContactPhone === user?.phone
                    ? 'Cannot be your own number.'
                    : emergencyContactPhone.length > 0 && !/^09\d{9}$/.test(emergencyContactPhone)
                      ? 'Must start with 09 and be 11 digits long.'
                      : ''
                }
              />
              <Text style={styles.helperText}>
                Only revealed to employers when you start a job.
              </Text>
            </View>
          </>
        )}

        <View style={styles.formGroup}>
          <Text style={styles.label}>Bio / Description</Text>
          <View style={styles.textAreaContainer}>
            <Input
              value={bio}
              onChangeText={setBio}
              placeholder="Tell others about yourself..."
              multiline={true}
              numberOfLines={4}
            />
          </View>
        </View>

        <Button
          title={isSaving ? 'Saving...' : 'Save changes'}
          onPress={handleSave}
          disabled={isSaving}
          style={{ marginTop: 24 }}
        />
      </ScrollView>
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
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.sky,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 32, color: colors.ink },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.paper,
  },
  avatarHint: { fontFamily: fonts.body, fontSize: 12, color: colors.inkLight, marginTop: 8 },
  formGroup: { marginBottom: 20 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  helperText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkLight, marginTop: 4 },
  textAreaContainer: { minHeight: 100 },
});

export default EditProfileScreen;
