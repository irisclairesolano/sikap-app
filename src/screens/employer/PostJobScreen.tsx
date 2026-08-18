import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import CustomInput from '../../components/common/Input';
import LocationPicker from '../../components/common/LocationPicker';
import { useAlert } from '../../contexts/AlertContext';
import { useCreateJob, useUpdateJob } from '../../hooks/useEmployerJobs';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts } from '../../theme';

const DURATION_UNITS = ['Hours', 'Days', 'Weeks', 'Months'];
const DEFAULT_CATEGORIES = [
  'Construction',
  'Domestic',
  'Agriculture',
  'Skilled Trade',
  'Transport',
  'Craft',
];

export const PostJobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const route = useRoute<RouteProp<EmployerStackParamList, 'PostJob'>>();
  const jobToEdit = (route.params as any)?.job;
  const isEditMode = !!jobToEdit;

  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const { showAlert } = useAlert();

  const [title, setTitle] = useState(jobToEdit?.title || '');

  // Category tags
  const [currentCategory, setCurrentCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(jobToEdit?.categories || []);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const [municipality, setMunicipality] = useState(jobToEdit?.municipality || '');
  const [barangay, setBarangay] = useState(jobToEdit?.barangay || '');
  const [pay, setPay] = useState(jobToEdit?.compensation ? String(jobToEdit.compensation) : '');
  const [slots, setSlots] = useState(jobToEdit?.slots ? String(jobToEdit.slots) : '');

  const parsedPay = parseFloat(pay);
  const payInvalid = pay !== '' && (isNaN(parsedPay) || parsedPay < 1);

  const parsedSlots = parseInt(slots, 10);
  const slotsInvalid = slots !== '' && (isNaN(parsedSlots) || parsedSlots < 1);

  // Duration
  const [duration, setDuration] = useState(jobToEdit?.duration ? String(jobToEdit.duration) : '');
  const [durationUnit, setDurationUnit] = useState(jobToEdit?.duration_unit || 'Days');

  const [description, setDescription] = useState(jobToEdit?.description || '');
  const [isUrgent, setIsUrgent] = useState(false);
  const [scheduleDate, setScheduleDate] = useState(
    jobToEdit?.schedule_date ? new Date(jobToEdit.schedule_date) : new Date(),
  );
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [exactLocation, setExactLocation] = useState(jobToEdit?.exact_location || '');
  const [toolsRequired, setToolsRequired] = useState(jobToEdit?.tools_required || '');

  // Media
  const [photos, setPhotos] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [video, setVideo] = useState<ImagePicker.ImagePickerAsset | null>(null);

  const filteredSuggestions = DEFAULT_CATEGORIES.filter(
    (cat) => !categories.includes(cat) && cat.toLowerCase().includes(currentCategory.toLowerCase()),
  );

  const addCategory = () => {
    const trimmed = currentCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      setCategories([...categories, trimmed]);
    }
    setCurrentCategory('');
    setShowCategorySuggestions(false);
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
  };

  const pickPhotos = async () => {
    if (photos.length >= 5) {
      showAlert('Limit reached', 'You can only upload up to 5 photos.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: 5 - photos.length,
      quality: 0.8,
    });
    if (!result.canceled) {
      setPhotos([...photos, ...result.assets].slice(0, 5));
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled) {
      setVideo(result.assets[0]);
    }
  };

  const handleSubmit = () => {
    // Automatically add currentCategory if the user forgot to press enter/space
    let finalCategories = [...categories];
    const trimmedCategory = currentCategory.trim();
    if (trimmedCategory && !finalCategories.includes(trimmedCategory)) {
      finalCategories.push(trimmedCategory);
      setCategories(finalCategories);
      setCurrentCategory('');
    }

    console.log('📋 Validating job post fields:', {
      title: title ? 'filled' : 'empty',
      categories: finalCategories,
      barangay: barangay ? 'filled' : 'empty',
      municipality: municipality ? 'filled' : 'empty',
      pay: pay ? 'filled' : 'empty',
      slots: slots ? 'filled' : 'empty',
      description: description ? 'filled' : 'empty',
      duration: duration ? 'filled' : 'empty',
    });

    const missingFields = [];
    if (!title) missingFields.push('Job Title');
    if (finalCategories.length === 0) missingFields.push('Categories');
    if (!barangay) missingFields.push('Barangay');
    if (!municipality) missingFields.push('Municipality');
    if (!pay) missingFields.push('Pay');
    if (!slots) missingFields.push('Slots');
    if (!description) missingFields.push('Description');

    if (missingFields.length > 0) {
      console.log('⚠️ Missing fields:', missingFields);
      showAlert(
        'Missing fields',
        `Please fill in all the required fields: ${missingFields.join(', ')}`,
      );
    }

    if (payInvalid || slotsInvalid) {
      const invalidFields = [];
      if (payInvalid) invalidFields.push('Pay must be at least 1 PHP');
      if (slotsInvalid) invalidFields.push('Slots must be at least 1');
      showAlert('Invalid input', invalidFields.join('\n'));
      return;
    }

    if (isEditMode) {
      const payload: any = {
        title,
        categories: JSON.stringify(finalCategories),
        barangay,
        municipality,
        compensation: parseFloat(pay.replace(/[^0-9.]/g, '')),
        slots: parseInt(slots, 10),
        description,
      };
      if (duration) {
        payload.duration = parseInt(duration, 10);
        payload.duration_unit = durationUnit;
      }
      if (exactLocation) payload.exact_location = exactLocation;
      if (toolsRequired) payload.tools_required = toolsRequired;

      updateJobMutation.mutate(
        { id: jobToEdit.id, payload },
        {
          onSuccess: () => {
            showAlert('Job updated!', 'Your changes have been saved.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
          onError: (err: any) => {
            showAlert('Error', err.message || 'Failed to update job.');
          },
        },
      );
      return;
    }

    const formData = new FormData();
    formData.append('title', title);
    formData.append('categories', JSON.stringify(finalCategories));
    formData.append('barangay', barangay);
    formData.append('municipality', municipality);
    formData.append('compensation', pay.replace(/[^0-9.]/g, ''));
    formData.append('slots', slots);
    formData.append('description', description);
    if (duration) {
      formData.append('duration', duration);
      formData.append('duration_unit', durationUnit);
    }
    formData.append('schedule_date', scheduleDate.toISOString().split('T')[0]);

    if (exactLocation) formData.append('exact_location', exactLocation);
    if (toolsRequired) formData.append('tools_required', toolsRequired);

    photos.forEach((photo, index) => {
      formData.append('photos[]', {
        uri: photo.uri,
        name: photo.fileName || `photo_${index}.jpg`,
        type: photo.mimeType || 'image/jpeg',
      } as any);
    });

    if (video) {
      formData.append('video', {
        uri: video.uri,
        name: video.fileName || 'video.mp4',
        type: video.mimeType || 'video/mp4',
      } as any);
    }

    createJobMutation.mutate(formData, {
      onSuccess: () => {
        showAlert('Job published!', 'Your job is now visible to workers.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      },
      onError: (err: any) => {
        console.error('Job creation failed', err);
        showAlert('Error', err.message || 'Failed to publish job.');
      },
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.appBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}>
            <Ionicons name="close" size={24} color={colors.ink} />
          </TouchableOpacity>
          <View style={styles.appBarBadge}>
            <Text style={styles.appBarBadgeText}>{isEditMode ? 'Edit post' : 'New post'}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {isEditMode ? 'Edit your' : 'Post a'}
            {'\n'}
            <Text style={styles.titleAccent}>{isEditMode ? 'job post.' : 'new job.'}</Text>
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              label="Job title *"
              value={title}
              onChangeText={setTitle}
              placeholder="E.g. Carpenter wanted"
            />

            {/* Categories */}
            <View style={{ zIndex: 10 }}>
              <CustomInput
                label="Categories *"
                value={currentCategory}
                onChangeText={(text) => {
                  setCurrentCategory(text);
                  setShowCategorySuggestions(true);
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                placeholder="Type tag or select suggestion..."
                icon="pricetag-outline"
                onSubmitEditing={addCategory}
                onKeyPress={(e: any) => {
                  if (e.nativeEvent?.key === ' ') {
                    addCategory();
                  }
                }}
              />

              {showCategorySuggestions &&
                (filteredSuggestions.length > 0 || currentCategory.trim().length > 0) && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView keyboardShouldPersistTaps="always" style={{ maxHeight: 200 }}>
                      {filteredSuggestions.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.dropdownItem}
                          onPress={() => {
                            setCategories([...categories, cat]);
                            setCurrentCategory('');
                            setShowCategorySuggestions(false);
                          }}
                        >
                          <Text style={styles.dropdownItemText}>{cat}</Text>
                          <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                        </TouchableOpacity>
                      ))}
                      {currentCategory.trim().length > 0 &&
                        !categories.includes(currentCategory.trim()) &&
                        !DEFAULT_CATEGORIES.includes(currentCategory.trim()) && (
                          <TouchableOpacity
                            style={[styles.dropdownItem, { backgroundColor: colors.primaryTint }]}
                            onPress={addCategory}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                { fontFamily: fonts.bodyBold, color: colors.primary },
                              ]}
                            >
                              Add "{currentCategory.trim()}"
                            </Text>
                            <Ionicons name="add-circle" size={18} color={colors.primary} />
                          </TouchableOpacity>
                        )}
                    </ScrollView>
                  </View>
                )}

              {categories.length > 0 && (
                <View style={styles.chipContainer}>
                  {categories.map((cat, idx) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.chip}
                      onPress={() => removeCategory(idx)}
                    >
                      <Text style={styles.chipText}>{cat}</Text>
                      <Ionicons name="close-circle" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            <LocationPicker
              municipalityValue={municipality}
              barangayValue={barangay}
              onMunicipalityChange={setMunicipality}
              onBarangayChange={setBarangay}
            />

            <CustomInput
              label="Exact Location"
              value={exactLocation}
              onChangeText={setExactLocation}
              placeholder="E.g. 123 Main St near Plaza"
              icon="map-outline"
            />

            <View style={styles.row}>
              <View style={styles.col}>
                <CustomInput
                  label="Pay (PHP) *"
                  value={pay}
                  onChangeText={setPay}
                  placeholder="600"
                  keyboardType="numeric"
                  status={payInvalid ? 'invalid' : undefined}
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label="Slots *"
                  value={slots}
                  onChangeText={setSlots}
                  placeholder="2"
                  keyboardType="numeric"
                  status={slotsInvalid ? 'invalid' : undefined}
                />
              </View>
            </View>

            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <CustomInput
                  label="Duration (Optional)"
                  value={duration}
                  onChangeText={setDuration}
                  placeholder="E.g. 5"
                  keyboardType="numeric"
                  icon="time-outline"
                />
              </View>
              <View style={{ flex: 1.2 }}>
                <Text style={styles.label}>Unit (Optional)</Text>
                <View style={styles.unitSelector}>
                  {DURATION_UNITS.map((unit) => (
                    <TouchableOpacity
                      key={unit}
                      style={[styles.unitBtn, durationUnit === unit && styles.unitBtnActive]}
                      onPress={() => setDurationUnit(unit)}
                    >
                      <Text
                        style={[
                          styles.unitBtnText,
                          durationUnit === unit && styles.unitBtnTextActive,
                        ]}
                      >
                        {unit}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.label}>Schedule Date *</Text>
              <TouchableOpacity
                style={styles.datePickerBtn}
                onPress={() => setShowDatePicker(true)}
              >
                <Ionicons name="calendar-outline" size={20} color={colors.inkMuted} />
                <Text style={styles.datePickerText}>{scheduleDate.toLocaleDateString()}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setScheduleDate(selectedDate);
                  }}
                />
              )}
            </View>

            <CustomInput
              label="Description *"
              value={description}
              onChangeText={setDescription}
              placeholder="Need help installing..."
              multiline
              icon="create-outline"
            />

            <CustomInput
              label="Tools Required (Optional)"
              value={toolsRequired}
              onChangeText={setToolsRequired}
              placeholder="E.g. Hammer, nails, saw"
              icon="hammer-outline"
            />

            {!isEditMode && (
              <View style={styles.mediaSection}>
                <Text style={styles.label}>Photos & Video (Optional)</Text>

                <View style={styles.mediaRow}>
                  <TouchableOpacity style={styles.mediaBtn} onPress={pickPhotos}>
                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                    <Text style={styles.mediaBtnText}>Add Photos</Text>
                    <Text style={styles.mediaBtnSub}>{photos.length}/5</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.mediaBtn} onPress={pickVideo}>
                    <Ionicons name="videocam-outline" size={24} color={colors.primary} />
                    <Text style={styles.mediaBtnText}>{video ? 'Change Video' : 'Add Video'}</Text>
                    <Text style={styles.mediaBtnSub}>{video ? '1/1' : '0/1'}</Text>
                  </TouchableOpacity>
                </View>

                {photos.length > 0 && (
                  <ScrollView
                    horizontal
                    style={styles.previewScroll}
                    showsHorizontalScrollIndicator={false}
                  >
                    {photos.map((p, idx) => (
                      <View key={idx} style={styles.previewWrapper}>
                        <Image source={{ uri: p.uri }} style={styles.previewImg} />
                        <TouchableOpacity
                          style={styles.removeMediaBtn}
                          onPress={() => removePhoto(idx)}
                        >
                          <Ionicons name="close" size={16} color={colors.white} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}

                {video && (
                  <View style={styles.previewWrapper}>
                    <View
                      style={[
                        styles.previewImg,
                        {
                          backgroundColor: colors.ink,
                          justifyContent: 'center',
                          alignItems: 'center',
                        },
                      ]}
                    >
                      <Ionicons name="play" size={24} color={colors.white} />
                    </View>
                    <TouchableOpacity style={styles.removeMediaBtn} onPress={() => setVideo(null)}>
                      <Ionicons name="close" size={16} color={colors.white} />
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}

            {/* Urgent Toggle */}
            <View style={styles.urgentCard}>
              <Ionicons name="flame" size={22} color={colors.primary} />
              <View style={styles.urgentTextContainer}>
                <Text style={styles.urgentTitle}>Mark as urgent</Text>
                <Text style={styles.urgentSubtitle}>Appears at the top of worker feeds</Text>
              </View>
              <Switch
                trackColor={{ false: colors.inkFaint, true: colors.primary }}
                thumbColor={colors.white}
                ios_backgroundColor={colors.inkFaint}
                onValueChange={setIsUrgent}
                value={isUrgent}
              />
            </View>
          </View>

          <Button
            label={isEditMode ? 'Save changes' : 'Publish job'}
            size="lg"
            fullWidth
            icon={isEditMode ? 'checkmark' : 'arrow-forward'}
            iconPosition="right"
            loading={createJobMutation.isPending || updateJobMutation.isPending}
            onPress={handleSubmit}
            style={{ marginTop: 24 }}
          />
        </ScrollView>
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
    paddingTop: 12,
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
  formContainer: {
    marginTop: 24,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginBottom: 6,
  },
  datePickerBtn: {
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
  },
  datePickerText: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryTint,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
  },
  dropdownContainer: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 8,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.paper,
  },
  dropdownItemText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  unitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  unitBtn: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.white,
  },
  unitBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  unitBtnText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  unitBtnTextActive: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
  },
  mediaSection: {
    padding: 16,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  mediaRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  mediaBtn: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.paper,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderStyle: 'dashed',
  },
  mediaBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
    marginTop: 8,
  },
  mediaBtnSub: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  previewScroll: {
    marginTop: 16,
  },
  previewWrapper: {
    position: 'relative',
    marginRight: 12,
    marginTop: 16,
  },
  previewImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  removeMediaBtn: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentCard: {
    backgroundColor: colors.butter,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  urgentTextContainer: {
    flex: 1,
  },
  urgentTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  urgentSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
});

export default PostJobScreen;
