import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import { useAuth } from '../../store/AuthContext'; // Assuming this exists or using useAuthCheck
import { useAuthCheck } from '../../hooks/useAuthCheck';

export const EditProfileScreen: React.FC = () => {
  const navigation = useNavigation();
  const { user } = useAuthCheck();

  const [name, setName] = useState(user?.name || '');
  const [location, setLocation] = useState('San Rafael, Bulan'); // Add to user model if it exists
  const [bio, setBio] = useState('Hardworking and reliable.');

  const handleSave = () => {
    // Send to backend via API
    navigation.goBack();
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
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{name ? name.charAt(0) : 'U'}</Text>
            <TouchableOpacity style={styles.editAvatarBtn}>
              <Ionicons name="camera" size={14} color={colors.paperBright} />
            </TouchableOpacity>
          </View>
          <Text style={styles.avatarHint}>Tap to change photo</Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Full Name</Text>
          <Input 
            value={name} 
            onChangeText={setName} 
            placeholder="Juan Reyes" 
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Location</Text>
          <Input 
            value={location} 
            onChangeText={setLocation} 
            placeholder="Barangay, Municipality" 
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

        <Button title="Save changes" onPress={handleSave} style={{ marginTop: 24 }} />
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
  avatarText: { fontFamily: fonts.bodyBold, fontSize: 32, color: colors.ink },
  editAvatarBtn: { position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: colors.paper },
  avatarHint: { fontFamily: fonts.body, fontSize: 12, color: colors.inkLight, marginTop: 8 },
  formGroup: { marginBottom: 20 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, marginBottom: 8 },
  textAreaContainer: { minHeight: 100 },
});

export default EditProfileScreen;
