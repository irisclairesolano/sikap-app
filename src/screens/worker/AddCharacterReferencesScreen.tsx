import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import Button from '../../components/common/Button';
import CustomInput from '../../components/common/Input';
import { useAlert } from '../../contexts/AlertContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { profileApi } from '../../api/profile';

// Colors for avatars
const AVATAR_COLORS = [colors.sky, colors.butter, colors.mint];

export const AddCharacterReferencesScreen: React.FC = () => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const workerProfile = profile?.worker_profile ?? (profile as any)?.workerProfile;
  const profileReferences = workerProfile?.references;

  const [references, setReferences] = useState<any[]>([]);

  React.useEffect(() => {
    if (Array.isArray(profileReferences)) {
      setReferences(profileReferences);
    }
  }, [profileReferences]);

  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleNameChange = (text: string) => {
    // Strip out numbers and symbols (allow letters, spaces, hyphens, periods, and ñ/Ñ)
    setName(text.replace(/[^a-zA-Z\s\-\.ñÑ]/g, ''));
    setNameError('');
  };

  const handleRelationshipChange = (text: string) => {
    // Strip out numbers and symbols (allow letters, spaces, hyphens, periods, and ñ/Ñ)
    setRelationship(text.replace(/[^a-zA-Z\s\-\.ñÑ]/g, ''));
    setRelationshipError('');
  };

  const [editingReferenceId, setEditingReferenceId] = useState<number | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);
  const [nameError, setNameError] = useState('');
  const [relationshipError, setRelationshipError] = useState('');

  const { showAlert } = useAlert();

  const normalizeDigits = (val: string) => val.replace(/[^0-9]/g, '');

  const validatePhone = (value: string, currentEditingId: number | null = editingReferenceId) => {
    if (!value) {
      return undefined;
    }
    const sanitized = normalizeDigits(value);
    if (!sanitized.startsWith('09')) {
      return t('char_ref_err_phone_prefix');
    }
    if (sanitized.length !== 11) {
      return t('char_ref_err_phone_digits');
    }

    // Check against own user account phone
    const rawUserPhone = profile?.phone ? normalizeDigits(String(profile.phone)) : '';
    const userPhoneNorm =
      rawUserPhone.startsWith('63') && rawUserPhone.length === 12
        ? '0' + rawUserPhone.slice(2)
        : rawUserPhone.startsWith('9') && rawUserPhone.length === 10
          ? '0' + rawUserPhone
          : rawUserPhone;

    if (userPhoneNorm && sanitized === userPhoneNorm) {
      return t('char_ref_err_phone_own');
    }

    // Check against existing references in list
    const isDuplicate = references.some((ref) => {
      if (!ref || !ref.phone) return false;
      const refClean = normalizeDigits(String(ref.phone));
      const isSelf =
        currentEditingId !== null &&
        Number(ref.id) === Number(currentEditingId) &&
        Number(ref.id) > 0;
      return refClean === sanitized && !isSelf;
    });

    if (isDuplicate) {
      return t('char_ref_err_phone_duplicate');
    }

    return undefined;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newPhone = cleaned.slice(0, 11);
    setPhone(newPhone);

    const errorMsg = validatePhone(newPhone, editingReferenceId);
    if (newPhone.length === 11 || phoneError) {
      setPhoneError(errorMsg);
    } else {
      setPhoneError(undefined);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: {
      id?: number | null;
      name: string;
      phone: string;
      relationship: string;
    }) => {
      if (payload.id && Number(payload.id) > 0) {
        return profileApi.updateReference(Number(payload.id), {
          name: payload.name,
          phone: payload.phone,
          relationship: payload.relationship,
        });
      }
      return profileApi.addReference({
        name: payload.name,
        phone: payload.phone,
        relationship: payload.relationship,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      handleCancel();
    },
    onError: (err: any) => {
      console.error('Failed to save reference', err);
      const serverMsg =
        err?.errors?.phone?.[0] ||
        err?.message ||
        (typeof err === 'string' ? err : t('char_ref_err_save_failed'));
      setPhoneError(serverMsg.includes('phone') ? serverMsg : undefined);
      showAlert('Error', serverMsg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileApi.removeReference(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      handleCancel();
    },
    onError: (err) => {
      console.error('Failed to delete reference', err);
      showAlert('Error', t('char_ref_err_delete_failed'));
    },
  });

  const handleCancel = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setIsAdding(false);
    setEditingReferenceId(null);
    setPhoneError(undefined);
    setNameError('');
    setRelationshipError('');
  };

  const handleEditPress = (ref: any) => {
    setName(ref.name);
    setPhone(ref.phone);
    setRelationship(ref.relationship);
    setEditingReferenceId(ref.id);
    setPhoneError(undefined);
    setIsAdding(true);
  };

  const handleDeletePress = (id: number) => {
    showAlert(t('char_ref_delete_title'), t('char_ref_delete_msg'), [
      { text: t('char_ref_btn_cancel'), style: 'cancel' },
      {
        text: t('char_ref_btn_delete'),
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const getInitials = (n: string) => {
    return n
      .split(' ')
      .map((part) => part.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={handleBackPress} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.appBarBadge}>
            <Text style={styles.appBarBadgeText}>{t('char_ref_badge')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>{t('char_ref_title')}</Text>
          <Text style={styles.subtitleTagalog}>{t('char_ref_subtitle')}</Text>

          <View style={styles.infoBanner}>
            <Ionicons
              name="lock-closed"
              size={18}
              color={colors.mintDeep}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.infoText}>
              <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink }}>
                {t('char_ref_privacy_title')}
              </Text>{' '}
              {t('char_ref_privacy_desc')}
            </Text>
          </View>

          {/* Add reference card at the top of main content */}
          {references.length < 3 && (
            <TouchableOpacity
              style={styles.addButton}
              activeOpacity={0.7}
              onPress={() => setIsAdding(true)}
            >
              <View style={styles.addIconCircle}>
                <Ionicons name="add" size={22} color={colors.white} />
              </View>
              <Text style={styles.addTitle}>{t('char_ref_add_another_btn')}</Text>
              <Text style={styles.addSubtitle}>
                {3 - references.length === 3
                  ? t('char_ref_slots_three')
                  : 3 - references.length === 2
                    ? t('char_ref_slots_two')
                    : t('char_ref_slots_one')}
              </Text>
            </TouchableOpacity>
          )}

          {/* References List is shown below the add card */}
          {references.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>
                {t('char_ref_list_header').replace('{count}', String(references.length))}
              </Text>

              <View style={styles.listContainer}>
                {references.map((ref, index) => (
                  <TouchableOpacity
                    key={ref.id}
                    style={styles.refCard}
                    activeOpacity={0.7}
                    onPress={() => handleEditPress(ref)}
                  >
                    <View
                      style={[
                        styles.avatar,
                        { backgroundColor: AVATAR_COLORS[index % AVATAR_COLORS.length] },
                      ]}
                    >
                      <Text style={styles.avatarText}>{getInitials(ref.name)}</Text>
                    </View>
                    <View style={styles.refDetails}>
                      <Text style={styles.refName}>{ref.name}</Text>
                      <Text style={styles.refRole}>
                        {ref.relationship} · {ref.phone}
                      </Text>
                    </View>
                    <Ionicons
                      name="pencil"
                      size={18}
                      color={colors.inkMuted}
                      style={{ paddingHorizontal: 4 }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>

        <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <Button
            label={t('char_ref_btn_done')}
            size="lg"
            variant="soft"
            fullWidth
            onPress={() => navigation.goBack()}
          />
        </View>

        {/* Add/Edit Reference Modal */}
        <Modal
          visible={isAdding}
          transparent={true}
          animationType="slide"
          onRequestClose={handleCancel}
        >
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          >
            <View style={styles.modalOverlay}>
              <TouchableOpacity
                style={styles.backdropTouchable}
                activeOpacity={1}
                onPress={handleCancel}
              />
              <View
                style={[
                  styles.modalContent,
                  { paddingBottom: Math.max(insets.bottom + 16, Platform.OS === 'ios' ? 36 : 28) },
                ]}
              >
                <View style={styles.dragIndicator} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>
                    {editingReferenceId !== null
                      ? t('char_ref_modal_title_edit')
                      : t('char_ref_modal_title_add')}
                  </Text>
                  <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
                    <Ionicons name="close" size={22} color={colors.inkSoft} />
                  </TouchableOpacity>
                </View>

                <ScrollView
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <View style={{ gap: 16, paddingBottom: 24 }}>
                    <CustomInput
                      label={t('char_ref_name_label')}
                      value={name}
                      onChangeText={handleNameChange}
                      placeholder={t('char_ref_name_placeholder')}
                      icon="person-outline"
                      error={nameError}
                      status={nameError ? 'invalid' : null}
                    />
                    <CustomInput
                      label={t('char_ref_relationship_label')}
                      value={relationship}
                      onChangeText={handleRelationshipChange}
                      placeholder={t('char_ref_relationship_placeholder')}
                      icon="people-outline"
                      error={relationshipError}
                      status={relationshipError ? 'invalid' : null}
                    />
                    <CustomInput
                      label={t('char_ref_phone_label')}
                      value={phone}
                      onChangeText={handlePhoneChange}
                      error={phoneError}
                      status={phoneError ? 'invalid' : null}
                      placeholder={t('char_ref_phone_placeholder')}
                      icon="call-outline"
                      keyboardType="phone-pad"
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {editingReferenceId !== null ? (
                    <Button
                      label={t('char_ref_btn_delete')}
                      size="base"
                      variant="outline"
                      onPress={() => handleDeletePress(editingReferenceId)}
                      style={{ flex: 1, borderColor: colors.error }}
                    />
                  ) : (
                    <Button
                      label={t('char_ref_btn_cancel')}
                      size="base"
                      variant="outline"
                      onPress={handleCancel}
                      style={{ flex: 1 }}
                    />
                  )}
                  <Button
                    label={
                      saveMutation.isPending
                        ? t('char_ref_btn_saving')
                        : editingReferenceId !== null
                          ? t('char_ref_btn_save_changes')
                          : t('char_ref_btn_save_ref')
                    }
                    size="base"
                    style={{ flex: 2 }}
                    loading={saveMutation.isPending}
                    onPress={() => {
                      const errors: Record<string, string> = {};
                      if (!name.trim()) {
                        errors.name = t('char_ref_err_name_req');
                      }
                      if (!relationship.trim()) {
                        errors.relationship = t('char_ref_err_relationship_req');
                      }
                      const phError = validatePhone(phone, editingReferenceId);
                      if (!phone.trim()) {
                        errors.phone = t('char_ref_err_phone_req');
                      } else if (phError) {
                        errors.phone = phError;
                      }

                      if (Object.keys(errors).length > 0) {
                        setNameError(errors.name || '');
                        setRelationshipError(errors.relationship || '');
                        setPhoneError(errors.phone || '');
                        return;
                      }

                      saveMutation.mutate({
                        id: editingReferenceId,
                        name: name.trim(),
                        phone: phone.trim(),
                        relationship: relationship.trim(),
                      });
                    }}
                    disabled={saveMutation.isPending}
                  />
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  appBarBadge: {
    backgroundColor: colors.paperBright,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 100,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  appBarBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 40,
    color: colors.ink,
    letterSpacing: -0.8,
    paddingBottom: 4,
  },
  titleAccent: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  subtitleTagalog: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    lineHeight: 20,
    marginTop: 6,
  },
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    alignItems: 'flex-start',
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    lineHeight: 18,
    color: colors.mintDeep,
  },
  sectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 24,
    marginBottom: 12,
  },
  listContainer: {
    gap: 10,
  },
  refCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    padding: 14,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
    gap: 14,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  refDetails: {
    flex: 1,
  },
  refName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 2,
  },
  refRole: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
  },
  addButton: {
    backgroundColor: '#E0F2FE',
    borderWidth: 2,
    borderColor: '#BAE6FD',
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 20,
    marginTop: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  addIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.skyDeep,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.skyDeep,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 4,
  },
  addTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.skyDeep,
  },
  addSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: '#0369A1',
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 10,
    backgroundColor: colors.paperBright,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  formSectionHeader: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(43, 31, 21, 0.4)', // Ink overlaid color
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    ...StyleSheet.absoluteFill,
  },
  modalContent: {
    backgroundColor: colors.paper,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 36,
    maxHeight: '90%',
  },
  dragIndicator: {
    width: 38,
    height: 4,
    backgroundColor: colors.inkFaint,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  closeButton: {
    padding: 4,
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
});

export default AddCharacterReferencesScreen;
