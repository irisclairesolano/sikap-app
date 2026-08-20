import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Modal,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { colors, fonts } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import Button from '../../components/common/Button';
import CustomInput from '../../components/common/Input';
import { useAlert } from '../../contexts/AlertContext';
import { profileApi } from '../../api/profile';

// Colors for avatars
const AVATAR_COLORS = [colors.sky, colors.butter, colors.mint];

export const AddCharacterReferencesScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: profileApi.getProfile,
  });

  const [references, setReferences] = useState<any[]>([]);

  React.useEffect(() => {
    if (profile?.worker_profile?.references) {
      setReferences(profile.worker_profile.references);
    }
  }, [profile?.worker_profile?.references]);

  const [isAdding, setIsAdding] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [relationship, setRelationship] = useState('');

  const handleNameChange = (text: string) => {
    // Strip out numbers and symbols (allow letters, spaces, hyphens, periods, and ñ/Ñ)
    setName(text.replace(/[^a-zA-Z\s\-\.ñÑ]/g, ''));
  };

  const handleRelationshipChange = (text: string) => {
    // Strip out numbers and symbols (allow letters, spaces, hyphens, periods, and ñ/Ñ)
    setRelationship(text.replace(/[^a-zA-Z\s\-\.ñÑ]/g, ''));
  };

  const [editingReferenceId, setEditingReferenceId] = useState<number | null>(null);
  const [phoneError, setPhoneError] = useState<string | undefined>(undefined);

  const { showAlert } = useAlert();

  const validatePhone = (value: string) => {
    if (!value) {
      return undefined;
    }
    const sanitized = value.replace(/[^0-9]/g, '');
    if (!sanitized.startsWith('09')) {
      return 'Phone number must start with 09';
    }
    if (sanitized.length !== 11) {
      return 'Phone number must be exactly 11 digits';
    }
    const sanitizedUserPhone = profile?.phone ? profile.phone.replace(/[^0-9]/g, '') : '';
    if (sanitizedUserPhone && sanitized === sanitizedUserPhone) {
      return 'Cannot be your own phone number';
    }
    return undefined;
  };

  const handlePhoneChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    const newPhone = cleaned.slice(0, 11);
    setPhone(newPhone);

    const errorMsg = validatePhone(newPhone);
    if (newPhone.length === 11 || phoneError) {
      setPhoneError(errorMsg);
    } else {
      setPhoneError(undefined);
    }
  };

  const saveMutation = useMutation({
    mutationFn: async (payload: { name: string; phone: string; relationship: string }) => {
      const errorMsg = validatePhone(payload.phone);
      if (errorMsg) {
        setPhoneError(errorMsg);
        throw new Error(errorMsg);
      }

      if (editingReferenceId !== null) {
        await profileApi.removeReference(editingReferenceId);
      }
      return profileApi.addReference(payload);
    },
    onMutate: async (payload) => {
      // Close modal instantly
      setIsAdding(false);

      const tempId = -Date.now();
      const optimisticItem = {
        id: editingReferenceId !== null ? editingReferenceId : tempId,
        ...payload,
      };

      if (editingReferenceId !== null) {
        setReferences((prev) =>
          prev.map((r) => (r.id === editingReferenceId ? optimisticItem : r)),
        );
      } else {
        setReferences((prev) => [...prev, optimisticItem]);
      }

      handleCancel();
      return { tempId };
    },
    onSuccess: (data, variables, context) => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      const realRef = data?.reference || data;
      if (realRef && realRef.id && editingReferenceId === null) {
        setReferences((prev) => prev.map((r) => (r.id === context?.tempId ? realRef : r)));
      }
      setEditingReferenceId(null);
    },
    onError: (err) => {
      console.error('Failed to save reference', err);
      if (profile?.worker_profile?.references) {
        setReferences(profile.worker_profile.references);
      }
      setEditingReferenceId(null);
      showAlert('Error', err.message || 'Failed to save reference');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => profileApi.removeReference(id),
    onMutate: (id) => {
      setIsAdding(false);
      setReferences((prev) => prev.filter((r) => r.id !== id));
      handleCancel();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
    onError: (err) => {
      console.error('Failed to delete reference', err);
      if (profile?.worker_profile?.references) {
        setReferences(profile.worker_profile.references);
      }
      showAlert('Error', 'Failed to delete reference');
    },
  });

  const handleCancel = () => {
    setName('');
    setPhone('');
    setRelationship('');
    setIsAdding(false);
    setEditingReferenceId(null);
    setPhoneError(undefined);
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
    showAlert('Delete Reference', 'Are you sure you want to delete this character reference?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(id),
      },
    ]);
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const showForm = isAdding || references.length === 0;

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
            <Text style={styles.appBarBadgeText}>References</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            Three people{'\n'}who can <Text style={styles.titleAccent}>vouch.</Text>
          </Text>

          <View style={styles.infoBanner}>
            <Ionicons
              name="lock-closed"
              size={18}
              color={colors.mintDeep}
              style={{ marginTop: 2 }}
            />
            <Text style={styles.infoText}>
              <Text style={{ fontFamily: fonts.bodyBold, color: colors.ink }}>
                Reference contacts stay hidden
              </Text>{' '}
              until an employer formally shortlists you.
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
              <Text style={styles.addTitle}>Add another reference</Text>
              <Text style={styles.addSubtitle}>
                {3 - references.length === 3
                  ? 'Three slots remaining'
                  : 3 - references.length === 2
                    ? 'Two slots remaining'
                    : 'One slot remaining'}
              </Text>
            </TouchableOpacity>
          )}

          {/* References List is shown below the add card */}
          {references.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>References · {references.length} of 3</Text>

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

        <View style={styles.bottomBar}>
          <Button
            label="Done"
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
            <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={handleCancel}>
              <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
                <View style={styles.dragIndicator} />

                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>
                    {editingReferenceId !== null ? 'Edit Reference' : 'Add Reference'}
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
                      label="Full name"
                      value={name}
                      onChangeText={handleNameChange}
                      placeholder="E.g. Juan Reyes"
                      icon="person-outline"
                    />
                    <CustomInput
                      label="Relationship"
                      value={relationship}
                      onChangeText={handleRelationshipChange}
                      placeholder="E.g. Former employer"
                      icon="people-outline"
                    />
                    <CustomInput
                      label="Phone number"
                      value={phone}
                      onChangeText={handlePhoneChange}
                      error={phoneError}
                      placeholder="E.g. 09123456789"
                      icon="call-outline"
                      keyboardType="phone-pad"
                    />
                  </View>
                </ScrollView>

                <View style={styles.modalFooter}>
                  {editingReferenceId !== null ? (
                    <Button
                      label="Delete"
                      size="lg"
                      variant="outline"
                      onPress={() => handleDeletePress(editingReferenceId)}
                      style={{ flex: 1, borderColor: colors.error }}
                      // textStyle will automatically be red since we pass outline, but we can override if needed.
                      // Outline with error border is clear enough
                    />
                  ) : (
                    <Button
                      label="Cancel"
                      size="lg"
                      variant="outline"
                      onPress={handleCancel}
                      style={{ flex: 1 }}
                    />
                  )}
                  <Button
                    label={
                      saveMutation.isPending
                        ? 'Saving...'
                        : editingReferenceId !== null
                          ? 'Save changes'
                          : 'Save reference'
                    }
                    size="lg"
                    style={{ flex: 2 }}
                    loading={saveMutation.isPending}
                    onPress={() =>
                      saveMutation.mutate({
                        name,
                        phone,
                        relationship,
                      })
                    }
                    disabled={!name || !phone || !relationship || !!validatePhone(phone)}
                  />
                </View>
              </View>
            </TouchableOpacity>
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
  infoBanner: {
    flexDirection: 'row',
    backgroundColor: colors.mint,
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
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
    backgroundColor: colors.peach,
    borderWidth: 2,
    borderColor: colors.peachBright,
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
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primaryDark,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
    marginBottom: 4,
  },
  addTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primaryDark,
  },
  addSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primaryDark,
  },
  bottomBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: colors.paper,
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
