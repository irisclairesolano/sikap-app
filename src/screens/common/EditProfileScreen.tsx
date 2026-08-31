import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { Image } from 'expo-image';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from '../../utils/storage';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { profileApi } from '../../api/profile';
import LocationPicker from '../../components/common/LocationPicker';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import { ApiClientError } from '../../api/client';
import { colors, fonts, shadows } from '../../theme';

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
  const [selectedBusinessDocs, setSelectedBusinessDocs] = useState<any[]>([]);

  const handlePickBusinessDocs = async () => {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: true,
      });

      if (!pick.canceled && pick.assets) {
        if (pick.assets.length > 3) {
          showAlert('Too Many Files', 'You can only upload up to 3 business documents.');
          return;
        }

        let hasLargeFile = false;
        const validFiles = pick.assets.filter((asset) => {
          if (asset.size && asset.size > 5 * 1024 * 1024) {
            hasLargeFile = true;
            return false;
          }
          return true;
        });

        if (hasLargeFile) {
          showAlert('File Too Large', 'One or more files exceed the 5MB limit.');
        }

        setSelectedBusinessDocs(validFiles.slice(0, 3));
      }
    } catch (error) {
      console.log('Error selecting business documents:', error);
    }
  };
  const [isUploading, setIsUploading] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);

  React.useEffect(() => {
    setImageError(false);
  }, [localAvatarUri, user?.avatar_url]);

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
    if (localAvatarUri) return localAvatarUri;
    if (!user?.avatar_url) return null;
    let url = user.avatar_url;
    if (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1')) {
      const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api.*$/, '');
      url = url.replace(/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?/, apiBase);
    }
    if (url.startsWith('http')) return url;
    const apiBase = (process.env.EXPO_PUBLIC_API_URL || '').replace(/\/api.*$/, '');
    return `${apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
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
      setLocalAvatarUri(uri);
    }
  };

  const handleSave = async () => {
    if (user?.role === 'worker') {
      const phoneRegex = /^09\d{9}$/;
      if (emergencyContactPhone && !phoneRegex.test(emergencyContactPhone)) {
        showAlert(
          'Invalid Phone Number',
          'Emergency contact phone must start with 09 and be exactly 11 digits long.',
        );
        return;
      }
      if (emergencyContactPhone && emergencyContactPhone === user.phone) {
        showAlert(
          'Invalid Phone Number',
          'Emergency contact phone cannot be your own phone number.',
        );
        return;
      }
    }

    if (dateOfBirth) {
      const today = new Date();
      let age = today.getFullYear() - dateOfBirth.getFullYear();
      const monthDiff = today.getMonth() - dateOfBirth.getMonth();
      const dayDiff = today.getDate() - dateOfBirth.getDate();
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        age--;
      }

      if (age < 15) {
        showAlert('Invalid Age', 'You must be at least 15 years old.');
        return;
      }
    }

    try {
      setIsSaving(true);

      // 1. Upload avatar first if a new one was selected locally
      if (localAvatarUri) {
        try {
          setIsUploading(true);
          const manipResult = await ImageManipulator.manipulateAsync(
            localAvatarUri,
            [{ resize: { width: 800 } }],
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
          );
          const res = await profileApi.uploadAvatar(manipResult.uri);
          if (res?.avatar_url && user) {
            const updatedUser = { ...user, avatar_url: res.avatar_url };
            await SecureStore.setItemAsync('user_profile', JSON.stringify(updatedUser));
            queryClient.setQueryData(['profile'], updatedUser);
          }
          setLocalAvatarUri(null); // Clear local URI upon successful upload
        } catch (error: any) {
          console.error('Avatar upload failed during save:', error);
          showAlert('Save Failed', 'We could not upload your profile picture. Please try again.');
          setIsSaving(false);
          setIsUploading(false);
          return;
        } finally {
          setIsUploading(false);
        }
      }

      // 2. Save profile fields
      let res;
      if (selectedBusinessDocs.length > 0) {
        const formData = new FormData();
        formData.append('_method', 'PUT'); // Laravel method override for multipart PUT

        formData.append('barangay', barangay || '');
        formData.append('municipality', municipality || '');
        if (dateOfBirth) {
          formData.append('date_of_birth', dateOfBirth.toISOString().split('T')[0]);
        }
        formData.append('emergency_contact_name', emergencyContactName || '');
        formData.append('emergency_contact_phone', emergencyContactPhone || '');

        if (user?.role === 'worker') {
          formData.append('bio', bio || '');
        } else {
          formData.append('description', bio || '');
        }

        if (!isVerified && name) {
          formData.append('name', name);
        }

        selectedBusinessDocs.forEach((doc, idx) => {
          formData.append('business_documents[]', {
            uri: doc.uri,
            name: doc.name || `business-doc-${idx}.pdf`,
            type: doc.mimeType || 'application/pdf',
          } as any);
        });

        res = await profileApi.updateProfile(formData);
      } else {
        const updateData: any = {
          barangay: barangay || undefined,
          municipality: municipality || undefined,
          date_of_birth: dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : undefined,
          emergency_contact_name: emergencyContactName || undefined,
          emergency_contact_phone: emergencyContactPhone || undefined,
          bio: user?.role === 'worker' ? bio : undefined,
          description: user?.role === 'employer' ? bio : undefined,
        };

        if (!isVerified && name) {
          updateData.name = name;
        }

        res = await profileApi.updateProfile(updateData);
      }

      if (res?.user) {
        await SecureStore.setItemAsync('user_profile', JSON.stringify(res.user));
        queryClient.setQueryData(['profile'], res.user);
      }
      await refetchProfile();
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      showAlert('Profile Saved', 'Your changes have been saved successfully.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error(err);
      const msg =
        err instanceof ApiClientError && err.errors
          ? Object.values(err.errors)[0]?.[0] || err.message
          : err.message || 'We could not save your changes.';
      showAlert('Save Failed', msg);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.headerPill}>
            <Text style={styles.headerPillText}>Edit Profile</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
        >
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handlePickAvatar}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color={colors.primary} />
              ) : getAvatarUrl() && !imageError ? (
                <Image
                  source={{ uri: getAvatarUrl()! }}
                  style={styles.avatarImage}
                  onError={() => setImageError(true)}
                />
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

          <LocationPicker
            municipalityValue={municipality}
            barangayValue={barangay}
            onMunicipalityChange={setMunicipality}
            onBarangayChange={setBarangay}
          />

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
                  onChangeText={(text) => {
                    const cleaned = text.replace(/[^a-zA-Z\s\-\.ñÑ]/g, '');
                    setEmergencyContactName(cleaned.slice(0, 5));
                  }}
                  placeholder="Juan"
                  maxLength={5}
                />
                <Text style={styles.helperText}>
                  {emergencyContactName.length} / 5 characters (letters only)
                </Text>
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

          {user?.role === 'employer' && (
            <View style={styles.formGroup}>
              <Text style={styles.label}>Business Permit / Documents</Text>

              {user.business_documents && user.business_documents.length > 0 && (
                <View style={{ marginBottom: 12, gap: 8 }}>
                  <Text
                    style={{
                      fontFamily: fonts.bodyBold,
                      fontSize: 11,
                      color: colors.inkSoft,
                      textTransform: 'uppercase',
                    }}
                  >
                    Current Documents:
                  </Text>
                  {user.business_documents.map((docUrl: string, idx: number) => {
                    const docName = docUrl.split('/').pop() || `document_${idx + 1}`;
                    return (
                      <View
                        key={idx}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 8,
                          backgroundColor: colors.paperBright,
                          padding: 12,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.inkFaint,
                        }}
                      >
                        <Ionicons name="document-text" size={16} color={colors.primary} />
                        <Text
                          numberOfLines={1}
                          style={{
                            flex: 1,
                            fontFamily: fonts.body,
                            fontSize: 13,
                            color: colors.ink,
                          }}
                        >
                          {docName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}

              <TouchableOpacity
                style={{
                  backgroundColor: colors.paperBright,
                  borderWidth: 1.5,
                  borderColor: colors.inkFaint,
                  borderStyle: 'dashed',
                  borderRadius: 14,
                  padding: 20,
                  alignItems: 'center',
                }}
                onPress={handlePickBusinessDocs}
                disabled={isSaving}
              >
                <Ionicons
                  name="cloud-upload"
                  size={24}
                  color={colors.primary}
                  style={{ marginBottom: 6 }}
                />
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 14,
                    color: colors.ink,
                    textAlign: 'center',
                  }}
                >
                  {selectedBusinessDocs.length > 0
                    ? `${selectedBusinessDocs.length} New Document(s) Selected`
                    : 'Upload New Business Documents'}
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 11,
                    color: colors.inkMuted,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                >
                  {selectedBusinessDocs.length > 0
                    ? selectedBusinessDocs.map((doc) => doc.name).join('\n')
                    : 'DTI / SEC / TIN (Max 3 files, PDF/Image)'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={styles.label}>Bio / Description</Text>
            <View style={styles.textAreaContainer}>
              <Input
                value={bio}
                onChangeText={(text) => setBio(text.slice(0, 250))}
                placeholder="Tell others about yourself..."
                multiline={true}
                numberOfLines={4}
                maxLength={250}
              />
            </View>
            <Text style={styles.helperText}>{bio.length} / 250 characters</Text>
          </View>

          <Button
            title={isSaving ? 'Saving...' : 'Save changes'}
            onPress={handleSave}
            disabled={isSaving}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
      </KeyboardAvoidingView>
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
    overflow: 'hidden',
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
