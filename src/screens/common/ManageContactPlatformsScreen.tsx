import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { profileApi } from '../../api/profile';
import { useAlert } from '../../contexts/AlertContext';
import { useAuth } from '../../hooks/useAuth';
import * as SecureStore from '../../utils/storage';

import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface ContactPlatformSlot {
  platform: string;
  value: string;
}

export const parseContactPlatforms = (raw: any): ContactPlatformSlot[] => {
  if (!raw) return [];
  let parsed = raw;
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      return [];
    }
  }
  if (!Array.isArray(parsed)) return [];
  return parsed.filter(
    (item: any) =>
      item &&
      typeof item === 'object' &&
      typeof item.platform === 'string' &&
      typeof item.value === 'string' &&
      item.value.trim().length > 0,
  );
};

const AVAILABLE_PLATFORMS = [
  {
    id: 'WhatsApp',
    label: 'WhatsApp',
    icon: 'logo-whatsapp',
    color: '#25D366',
    placeholder: '+639123456789 or wa.me/...',
  },
  {
    id: 'Facebook',
    label: 'Facebook / Messenger',
    icon: 'logo-facebook',
    color: '#1877F2',
    placeholder: 'facebook.com/username or m.me/...',
  },
  {
    id: 'Instagram',
    label: 'Instagram',
    icon: 'logo-instagram',
    color: '#E4405F',
    placeholder: '@username or instagram.com/...',
  },
  { id: 'Viber', label: 'Viber', icon: 'call', color: '#7360F2', placeholder: '+639123456789' },
  {
    id: 'Telegram',
    label: 'Telegram',
    icon: 'paper-plane',
    color: '#229ED9',
    placeholder: '@username or t.me/...',
  },
  {
    id: 'Phone',
    label: 'Phone / SMS',
    icon: 'call-outline',
    color: '#1E293B',
    placeholder: '09123456789',
  },
];

export const ManageContactPlatformsScreen: React.FC = () => {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { showAlert } = useAlert();
  const { refetchProfile } = useAuth();

  const { data: user, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const [platforms, setPlatforms] = useState<ContactPlatformSlot[]>(() => {
    const loaded = parseContactPlatforms(user?.contact_platforms);
    return loaded.length > 0 ? loaded : [{ platform: 'WhatsApp', value: '' }];
  });

  const [activePickerIndex, setActivePickerIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync state when profile loads
  React.useEffect(() => {
    const loaded = parseContactPlatforms(user?.contact_platforms);
    if (loaded.length > 0) {
      setPlatforms(loaded);
    }
  }, [user]);

  const getPlatformMeta = (name: string) => {
    return (
      AVAILABLE_PLATFORMS.find((p) => p.id.toLowerCase() === name.toLowerCase()) ||
      AVAILABLE_PLATFORMS[0]
    );
  };

  const handleAddSlot = () => {
    if (platforms.length >= 3) {
      showAlert('Limit Reached', 'You can add up to 3 communication platforms.');
      return;
    }
    const unused = AVAILABLE_PLATFORMS.find(
      (p) => !platforms.some((slot) => slot.platform.toLowerCase() === p.id.toLowerCase()),
    );
    setPlatforms((prev) => [...prev, { platform: unused ? unused.id : 'WhatsApp', value: '' }]);
  };

  const handleRemoveSlot = (index: number) => {
    if (platforms.length === 1) {
      setPlatforms([{ platform: 'WhatsApp', value: '' }]);
      return;
    }
    setPlatforms((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectPlatform = (platformId: string) => {
    if (activePickerIndex !== null) {
      const updated = [...platforms];
      updated[activePickerIndex].platform = platformId;
      setPlatforms(updated);
      setActivePickerIndex(null);
    }
  };

  const handleSave = async () => {
    const valid = platforms.filter((p) => p.value.trim().length > 0);
    setIsSubmitting(true);
    try {
      const res = await profileApi.updateProfile({ contact_platforms: valid });
      if (res?.user) {
        await SecureStore.setItemAsync('user_profile', JSON.stringify(res.user));
        queryClient.setQueryData(['profile'], res.user);
      }
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await refetchProfile();
      showAlert('Success', 'Communication platforms saved successfully.');
      navigation.goBack();
    } catch (err: any) {
      showAlert('Error', err?.message || 'Failed to save communication platforms.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <SafeAreaView style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Bar */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Communication Platforms</Text>
        <View style={styles.iconBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Hero Banner */}
        <View style={styles.heroBanner}>
          <View style={styles.heroIconBox}>
            <Ionicons name="chatbubbles" size={24} color={colors.primaryDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.heroTitle}>Preferred Contact Channels</Text>
            <Text style={styles.heroSub}>
              Add up to 3 platforms where you want users to contact you after shortlisting.
            </Text>
          </View>
        </View>

        {/* Platform Slots */}
        <View style={styles.slotsContainer}>
          {platforms.map((slot, index) => {
            const meta = getPlatformMeta(slot.platform);
            return (
              <View key={index} style={styles.slotCard}>
                <View style={styles.slotHeader}>
                  <Text style={styles.slotLabel}>Platform #{index + 1}</Text>
                  {platforms.length > 1 && (
                    <TouchableOpacity
                      onPress={() => handleRemoveSlot(index)}
                      style={styles.deleteBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Ionicons name="trash-outline" size={18} color={colors.error} />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Dropdown Selector Button */}
                <TouchableOpacity
                  style={styles.pickerTrigger}
                  activeOpacity={0.8}
                  onPress={() => setActivePickerIndex(index)}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={[styles.platformBadge, { backgroundColor: meta.color + '18' }]}>
                      <Ionicons name={meta.icon as any} size={18} color={meta.color} />
                    </View>
                    <Text style={styles.pickerTriggerText}>{meta.label}</Text>
                  </View>
                  <Ionicons name="chevron-down" size={18} color={colors.inkMuted} />
                </TouchableOpacity>

                {/* Handle / Link Text Input */}
                <TextInput
                  style={styles.input}
                  placeholder={meta.placeholder}
                  placeholderTextColor={colors.inkMuted}
                  value={slot.value}
                  onChangeText={(val) => {
                    const updated = [...platforms];
                    updated[index].value = val;
                    setPlatforms(updated);
                  }}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            );
          })}
        </View>

        {/* Add Another Platform Button */}
        {platforms.length < 3 && (
          <TouchableOpacity style={styles.addBtn} activeOpacity={0.8} onPress={handleAddSlot}>
            <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            <Text style={styles.addBtnText}>
              Add Another Platform ({3 - platforms.length} left)
            </Text>
          </TouchableOpacity>
        )}

        {/* Privacy Shield Disclaimer */}
        <View style={styles.privacyBox}>
          <Ionicons name="lock-closed" size={16} color={colors.mintDeep} />
          <Text style={styles.privacyText}>
            Private & Secure: Communication links are strictly hidden until you shortlist or accept
            a job with another user.
          </Text>
        </View>
      </ScrollView>

      {/* Footer Save Button */}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 14) }]}>
        <Button
          label="Save Communication Links"
          variant="primary"
          size="lg"
          fullWidth
          loading={isSubmitting}
          onPress={handleSave}
        />
      </View>

      {/* Platform Dropdown Modal */}
      <Modal visible={activePickerIndex !== null} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setActivePickerIndex(null)}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Choose Platform</Text>
            <Text style={styles.modalSub}>Select a communication channel</Text>
            <View style={{ marginTop: 12 }}>
              {AVAILABLE_PLATFORMS.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.optionRow}
                  onPress={() => handleSelectPlatform(item.id)}
                >
                  <View style={[styles.platformBadge, { backgroundColor: item.color + '18' }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={styles.optionLabel}>{item.label}</Text>
                  {activePickerIndex !== null &&
                    platforms[activePickerIndex]?.platform.toLowerCase() ===
                      item.id.toLowerCase() && (
                      <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                    )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.paper,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  heroBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: colors.peach,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  heroIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: colors.paperBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  heroSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    lineHeight: 18,
  },
  slotsContainer: {
    gap: 16,
  },
  slotCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  slotHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  slotLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  deleteBtn: {
    padding: 4,
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
  },
  platformBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerTriggerText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    marginTop: 16,
    backgroundColor: colors.paperBright,
  },
  addBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primary,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.mint,
    padding: 12,
    borderRadius: 12,
    marginTop: 20,
  },
  privacyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.mintDeep,
    flex: 1,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    ...shadows.md,
  },
  modalTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  modalSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  optionLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    flex: 1,
  },
});

export default ManageContactPlatformsScreen;
