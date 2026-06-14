import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { colors, fonts, shadows } from '../../theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../hooks/useAuth';
import { profileApi } from '../../api/profile';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user, refetchProfile } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [barangay, setBarangay] = useState(user?.barangay || '');
  const [municipality, setMunicipality] = useState(user?.municipality || '');
  const [bio, setBio] = useState(user?.worker_profile?.bio || user?.employer_profile?.description || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

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
      Alert.alert('Success', 'Profile picture updated successfully!');
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to upload profile picture.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const updateData: any = {
        barangay,
        municipality,
        bio: user?.role === 'worker' ? bio : undefined,
        description: user?.role === 'employer' ? bio : undefined,
      };
      
      if (!isVerified) {
        updateData.name = name;
      }

      await profileApi.updateProfile(updateData);
      await refetchProfile();
      Alert.alert('Success', 'Profile updated successfully!');
      navigation.goBack();
    } catch (err: any) {
      console.error(err);
      Alert.alert('Error', err.message || 'Failed to update profile.');
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
          <TouchableOpacity style={styles.avatarContainer} onPress={handlePickAvatar} disabled={isUploading}>
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
        </View

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
          <Input 
            value={barangay} 
            onChangeText={setBarangay} 
            placeholder="Barangay" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Municipality</Text>
          <Input 
            value={municipality} 
            onChangeText={setMunicipality} 
            placeholder="Municipality" 
          />
        </View>

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

        <Button title={isSaving ? "Saving..." : "Save changes"} onPress={handleSave} disabled={isSaving} style={{ marginTop: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.paper },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerPill: { backgroundColor: colors.paperBright, paddingVertical: 6, paddingHorizontal: 16, borderRadius: 20, ...shadows.sm },
  headerPillText: { fontFamily: fonts.bodyBold, fontSize: 11, color: colors.inkMuted },
  scrollContent: { padding: 20, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', marginBottom: 32 },
  avatarContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.sky, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 32, color: colors.ink },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.paper },
  avatarHint: { fontFamily: fonts.body, fontSize: 12, color: colors.inkLight, marginTop: 8 },
  formGroup: { marginBottom: 20 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  helperText: { fontFamily: fonts.body, fontSize: 11, color: colors.inkLight, marginTop: 4 },
  textAreaContainer: { minHeight: 100 },
});

export default EditProfileScreen;
