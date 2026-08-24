import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import CustomInput from '../../components/common/Input';
import LocationPicker from '../../components/common/LocationPicker';
import { useAlert } from '../../contexts/AlertContext';
import { useCreateJob, useUpdateJob } from '../../hooks/useEmployerJobs';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from '../../utils/storage';

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

  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState(jobToEdit?.title || '');

  // Category tags
  const [currentCategory, setCurrentCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(jobToEdit?.categories || []);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const [municipality, setMunicipality] = useState(jobToEdit?.municipality || '');
  const [barangay, setBarangay] = useState(jobToEdit?.barangay || '');
  const [pay, setPay] = useState(jobToEdit?.compensation ? String(jobToEdit.compensation) : '');
  const [slots, setSlots] = useState(jobToEdit?.slots ? String(jobToEdit.slots) : '');

  const handlePayChange = (text: string) => {
    let cleaned = text.replace(/[^0-9.]/g, '');
    const parts = cleaned.split('.');
    if (parts.length > 2) {
      cleaned = parts[0] + '.' + parts.slice(1).join('');
    }
    if (cleaned.startsWith('0') && cleaned.length > 1 && cleaned[1] !== '.') {
      cleaned = cleaned.substring(1);
    }
    setPay(cleaned);
  };

  const handleSlotsChange = (text: string) => {
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('0') && cleaned.length > 1) {
      cleaned = cleaned.substring(1);
    }
    setSlots(cleaned);
  };

  const parsedPay = parseFloat(pay);
  const payInvalid = pay !== '' && (isNaN(parsedPay) || parsedPay < 1 || pay === '0');

  const parsedSlots = parseInt(slots, 10);
  const slotsInvalid = slots !== '' && (isNaN(parsedSlots) || parsedSlots < 1 || slots === '0');

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
  interface JobPhoto {
    id: string;
    uri: string;
    remoteUrl?: string;
    status: 'pending' | 'uploading' | 'success' | 'error';
    progress: number;
  }

  const [photos, setPhotos] = useState<JobPhoto[]>(
    jobToEdit?.photos
      ? jobToEdit.photos.map((url: string, index: number) => ({
          id: `edit_${index}_${Date.now()}`,
          uri: url,
          remoteUrl: url,
          status: 'success',
          progress: 100,
        }))
      : [],
  );
  interface VideoUpload {
    uri: string;
    remoteUrl: string | null;
    status: 'idle' | 'compressing' | 'uploading' | 'success' | 'error';
    progress: number;
    fileName: string;
    mimeType: string;
  }

  const [videoUpload, setVideoUpload] = useState<VideoUpload | null>(
    jobToEdit?.video_url
      ? {
          uri: jobToEdit.video_url,
          remoteUrl: jobToEdit.video_url,
          status: 'success',
          progress: 100,
          fileName: 'video.mp4',
          mimeType: 'video/mp4',
        }
      : null,
  );
  useEffect(() => {
    if (jobToEdit) {
      setTitle(jobToEdit.title || '');
      setCategories(jobToEdit.categories || []);
      setMunicipality(jobToEdit.municipality || '');
      setBarangay(jobToEdit.barangay || '');
      setPay(jobToEdit.compensation ? String(jobToEdit.compensation) : '');
      setSlots(jobToEdit.slots ? String(jobToEdit.slots) : '');
      setDuration(jobToEdit.duration ? String(jobToEdit.duration) : '');
      setDurationUnit(jobToEdit.duration_unit || 'Days');
      setDescription(jobToEdit.description || '');
      setExactLocation(jobToEdit.exact_location || '');
      setToolsRequired(jobToEdit.tools_required || '');
      setPhotos(
        jobToEdit.photos
          ? jobToEdit.photos.map((url: string, index: number) => ({
              id: `edit_${index}_${Date.now()}`,
              uri: url,
              remoteUrl: url,
              status: 'success',
              progress: 100,
            }))
          : [],
      );
      if (jobToEdit.video_url) {
        setVideoUpload({
          uri: jobToEdit.video_url,
          remoteUrl: jobToEdit.video_url,
          status: 'success',
          progress: 100,
          fileName: 'video.mp4',
          mimeType: 'video/mp4',
        });
      } else {
        setVideoUpload(null);
      }
      if (jobToEdit.schedule_date) {
        setScheduleDate(new Date(jobToEdit.schedule_date));
      }
    } else {
      setTitle('');
      setCategories([]);
      setMunicipality('');
      setBarangay('');
      setPay('');
      setSlots('');
      setDuration('');
      setDurationUnit('Days');
      setDescription('');
      setExactLocation('');
      setToolsRequired('');
      setPhotos([]);
      setVideoUpload(null);
      setScheduleDate(new Date());
    }
  }, [jobToEdit]);

  const compressImage = async (uri: string) => {
    const manipResult = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1080 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return manipResult.uri;
  };

  const compressVideo = async (uri: string) => {
    if (Platform.OS === 'web') {
      return uri;
    }
    try {
      const { Video } = require('react-native-compressor');
      const compressedUri = await Video.compress(uri, {
        compressionMethod: 'auto',
      });
      return compressedUri;
    } catch (e) {
      console.warn('Video compression failed, using original URI:', e);
      return uri;
    }
  };

  const uploadVideoImmediately = async (localUri: string, fileName: string, mimeType: string) => {
    setVideoUpload({
      uri: localUri,
      remoteUrl: null,
      status: 'compressing',
      progress: 0,
      fileName,
      mimeType,
    });

    try {
      const compressedUri = await compressVideo(localUri);
      setVideoUpload((prev) => (prev ? { ...prev, status: 'uploading' } : null));

      const token = await SecureStore.getItemAsync('auth_token');
      const formData = new FormData();
      formData.append('video', {
        uri: compressedUri,
        name: fileName || 'video.mp4',
        type: mimeType || 'video/mp4',
      } as any);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}/jobs/upload-video`);
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setVideoUpload((prev) => (prev ? { ...prev, progress } : null));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          setVideoUpload((prev) =>
            prev ? { ...prev, status: 'success', remoteUrl: res.url, progress: 100 } : null,
          );
        } else {
          setVideoUpload((prev) => (prev ? { ...prev, status: 'error', progress: 0 } : null));
        }
      };

      xhr.onerror = () => {
        setVideoUpload((prev) => (prev ? { ...prev, status: 'error', progress: 0 } : null));
      };

      xhr.send(formData);
    } catch (error) {
      setVideoUpload((prev) => (prev ? { ...prev, status: 'error', progress: 0 } : null));
    }
  };

  const uploadPhotoImmediately = async (photoId: string, localUri: string) => {
    setPhotos((prev) =>
      prev.map((p) => (p.id === photoId ? { ...p, status: 'uploading', progress: 0 } : p)),
    );

    try {
      const compressedUri = localUri.startsWith('http') ? localUri : await compressImage(localUri);

      if (localUri.startsWith('http')) {
        setPhotos((prev) =>
          prev.map((p) =>
            p.id === photoId ? { ...p, status: 'success', remoteUrl: localUri, progress: 100 } : p,
          ),
        );
        return;
      }

      const token = await SecureStore.getItemAsync('auth_token');

      const formData = new FormData();
      formData.append('photo', {
        uri: compressedUri,
        name: `photo_${photoId}.jpg`,
        type: 'image/jpeg',
      } as any);

      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${process.env.EXPO_PUBLIC_API_URL}/jobs/upload-photo`);
      xhr.setRequestHeader('Accept', 'application/json');
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setPhotos((prev) => prev.map((p) => (p.id === photoId ? { ...p, progress } : p)));
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          const res = JSON.parse(xhr.responseText);
          setPhotos((prev) =>
            prev.map((p) =>
              p.id === photoId ? { ...p, status: 'success', remoteUrl: res.url, progress: 100 } : p,
            ),
          );
        } else {
          setPhotos((prev) =>
            prev.map((p) => (p.id === photoId ? { ...p, status: 'error', progress: 0 } : p)),
          );
        }
      };

      xhr.onerror = () => {
        setPhotos((prev) =>
          prev.map((p) => (p.id === photoId ? { ...p, status: 'error', progress: 0 } : p)),
        );
      };

      xhr.send(formData);
    } catch (error) {
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? { ...p, status: 'error', progress: 0 } : p)),
      );
    }
  };

  const filteredSuggestions = DEFAULT_CATEGORIES.filter(
    (cat) => !categories.includes(cat) && cat.toLowerCase().includes(currentCategory.toLowerCase()),
  );

  const BANNED_WORDS = [
    'fuck',
    'shit',
    'asshole',
    'bitch',
    'cunt',
    'dick',
    'pussy',
    'bastard',
    'gago',
    'tarantado',
    'putangina',
    'tangina',
    'puta',
    'kupal',
    'gaga',
    'salsal',
    'ulol',
    'ulul',
    'kantot',
    'iyot',
    'pekpek',
    'titi',
    'puke',
    'bayag',
  ];

  const containsProfanity = (text: string) => {
    const words = text.toLowerCase().split(/\s+/);
    return words.some((word) => BANNED_WORDS.includes(word));
  };

  const addCategory = () => {
    const trimmed = currentCategory.trim();
    if (trimmed) {
      if (containsProfanity(trimmed)) {
        showAlert('Profanity detected', 'Category tags cannot contain inappropriate language.');
        setCurrentCategory('');
        setShowCategorySuggestions(false);
        return;
      }
      const lowerCategories = categories.map((c) => c.toLowerCase());
      if (lowerCategories.includes(trimmed.toLowerCase())) {
        showAlert('Duplicate tag', 'This category tag has already been added.');
      } else {
        setCategories([...categories, trimmed]);
      }
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
    if (!result.canceled && result.assets) {
      const newPhotos: JobPhoto[] = result.assets.map((asset) => ({
        id: Math.random().toString() + '_' + Date.now(),
        uri: asset.uri,
        status: 'pending',
        progress: 0,
      }));
      const updatedPhotos = [...photos, ...newPhotos].slice(0, 5);
      setPhotos(updatedPhotos);

      newPhotos.forEach((photo) => {
        uploadPhotoImmediately(photo.id, photo.uri);
      });
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const retryUpload = (photoId: string) => {
    const photo = photos.find((p) => p.id === photoId);
    if (photo) {
      uploadPhotoImmediately(photoId, photo.uri);
    }
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsMultipleSelection: false,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      uploadVideoImmediately(
        asset.uri,
        asset.fileName || 'video.mp4',
        asset.mimeType || 'video/mp4',
      );
    }
  };

  const overallProgress =
    photos.length > 0
      ? Math.round(photos.reduce((acc, p) => acc + p.progress, 0) / photos.length)
      : 0;

  const isAllPhotosUploaded = photos.every((p) => p.status === 'success');

  const isUploadingVideo = !!(
    videoUpload &&
    (videoUpload.status === 'uploading' || videoUpload.status === 'compressing')
  );

  const isUploadingPhotos = photos.some((p) => p.status === 'uploading');
  const isAnyMediaUploading = isUploadingPhotos || isUploadingVideo;

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
      return;
    }

    if (payInvalid || slotsInvalid) {
      const invalidFields = [];
      if (payInvalid) invalidFields.push('Pay must be at least 1 PHP');
      if (slotsInvalid) invalidFields.push('Slots must be at least 1');
      showAlert('Invalid input', invalidFields.join('\n'));
      return;
    }

    // Media Upload Progress Guards
    const isUploadingPhotos = photos.some((p) => p.status === 'uploading');
    const isUploadingVideo =
      videoUpload && (videoUpload.status === 'uploading' || videoUpload.status === 'compressing');

    if (isUploadingPhotos || isUploadingVideo) {
      showAlert(
        'Upload in progress',
        'Please wait for all media to finish uploading before publishing.',
      );
      return;
    }

    const hasPhotoErrors = photos.some((p) => p.status === 'error');
    const hasVideoError = videoUpload && videoUpload.status === 'error';
    if (hasPhotoErrors || hasVideoError) {
      showAlert(
        'Upload error',
        'Please remove or retry any failed media uploads before publishing.',
      );
      return;
    }

    const remoteUrls = photos
      .filter((p) => p.status === 'success')
      .map((p) => p.remoteUrl)
      .filter(Boolean);

    const payload: any = {
      title,
      categories: JSON.stringify(finalCategories),
      barangay,
      municipality,
      compensation: parseFloat(pay.replace(/[^0-9.]/g, '')),
      slots: parseInt(slots, 10),
      description,
      schedule_date: scheduleDate.toISOString().split('T')[0],
      photos: remoteUrls,
      video_url: videoUpload?.remoteUrl || null,
    };
    if (duration) {
      payload.duration = parseInt(duration, 10);
      payload.duration_unit = durationUnit;
    }
    if (exactLocation) payload.exact_location = exactLocation;
    if (toolsRequired) payload.tools_required = toolsRequired;

    setIsPublishing(true);
    setUploadProgress(90);

    if (isEditMode) {
      updateJobMutation.mutate(
        { id: jobToEdit.id, payload },
        {
          onSuccess: () => {
            setIsPublishing(false);
            setUploadProgress(100);
            showAlert('Job updated!', 'Your changes have been saved.', [
              { text: 'OK', onPress: () => navigation.goBack() },
            ]);
          },
          onError: (err: any) => {
            setIsPublishing(false);
            showAlert('Error', err.message || 'Failed to update job.');
          },
        },
      );
    } else {
      createJobMutation.mutate(payload, {
        onSuccess: () => {
          setIsPublishing(false);
          setUploadProgress(100);
          showAlert('Job published!', 'Your job is now visible to workers.', [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
        onError: (err: any) => {
          setIsPublishing(false);
          showAlert('Error', err.message || 'Failed to publish job.');
        },
      });
    }
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
                  if (text.includes(',')) {
                    const parts = text.split(',');
                    const updatedCategories = [...categories];
                    let duplicateFound = false;
                    let profanityFound = false;
                    parts.forEach((part) => {
                      const trimmed = part.trim();
                      if (trimmed) {
                        if (containsProfanity(trimmed)) {
                          profanityFound = true;
                          return;
                        }
                        const lowerCategories = updatedCategories.map((c) => c.toLowerCase());
                        if (!lowerCategories.includes(trimmed.toLowerCase())) {
                          updatedCategories.push(trimmed);
                        } else {
                          duplicateFound = true;
                        }
                      }
                    });
                    setCategories(updatedCategories);
                    setCurrentCategory('');
                    setShowCategorySuggestions(false);
                    if (profanityFound) {
                      showAlert(
                        'Profanity detected',
                        'Category tags cannot contain inappropriate language.',
                      );
                    } else if (duplicateFound) {
                      showAlert(
                        'Duplicate tag',
                        'One or more category tags have already been added.',
                      );
                    }
                  } else {
                    setCurrentCategory(text);
                    setShowCategorySuggestions(true);
                  }
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                placeholder="Type tag or select suggestion..."
                icon="pricetag-outline"
                onSubmitEditing={addCategory}
              />

              {showCategorySuggestions &&
                (filteredSuggestions.length > 0 || currentCategory.trim().length > 0) && (
                  <View style={styles.dropdownContainer}>
                    <ScrollView
                      keyboardShouldPersistTaps="always"
                      style={{ maxHeight: 200 }}
                      nestedScrollEnabled={true}
                    >
                      {filteredSuggestions.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={styles.dropdownItem}
                          onPress={() => {
                            const lowerCategories = categories.map((c) => c.toLowerCase());
                            if (!lowerCategories.includes(cat.toLowerCase())) {
                              setCategories([...categories, cat]);
                            }
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
                  onChangeText={handlePayChange}
                  placeholder="600"
                  keyboardType="numeric"
                  status={payInvalid ? 'invalid' : undefined}
                />
              </View>
              <View style={styles.col}>
                <CustomInput
                  label="Slots *"
                  value={slots}
                  onChangeText={handleSlotsChange}
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

                  <TouchableOpacity
                    style={styles.mediaBtn}
                    onPress={pickVideo}
                    disabled={isUploadingVideo}
                  >
                    <Ionicons name="videocam-outline" size={24} color={colors.primary} />
                    <Text style={styles.mediaBtnText}>
                      {videoUpload ? 'Change Video' : 'Add Video'}
                    </Text>
                    <Text style={styles.mediaBtnSub}>{videoUpload ? '1/1' : '0/1'}</Text>
                  </TouchableOpacity>
                </View>

                {photos.length > 0 && overallProgress < 100 && (
                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>Uploading photos: {overallProgress}%</Text>
                  </View>
                )}

                {videoUpload && videoUpload.status === 'compressing' && (
                  <View style={styles.progressBarWrapper}>
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.progressText}>Compressing video...</Text>
                  </View>
                )}

                {videoUpload && videoUpload.status === 'uploading' && (
                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBg}>
                      <View
                        style={[styles.progressBarFill, { width: `${videoUpload.progress}%` }]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      Uploading video: {videoUpload.progress}%
                    </Text>
                  </View>
                )}

                {videoUpload && videoUpload.status === 'error' && (
                  <View style={styles.progressBarWrapper}>
                    <Text style={[styles.progressText, { color: colors.error }]}>
                      Video upload failed. Remove and retry.
                    </Text>
                  </View>
                )}

                {photos.length > 0 && (
                  <ScrollView
                    horizontal
                    style={styles.previewScroll}
                    showsHorizontalScrollIndicator={false}
                  >
                    {photos.map((p, idx) => (
                      <View key={p.id} style={styles.previewWrapper}>
                        <Image
                          source={{ uri: p.uri }}
                          style={styles.previewImg}
                          blurRadius={p.status !== 'success' ? 15 : 0}
                        />
                        {p.status === 'uploading' && (
                          <View style={styles.imgLoaderOverlay}>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={styles.imgLoaderText}>{p.progress}%</Text>
                          </View>
                        )}
                        {p.status === 'error' && (
                          <TouchableOpacity
                            style={styles.imgLoaderOverlay}
                            onPress={() => retryUpload(p.id)}
                          >
                            <Ionicons name="refresh-circle" size={24} color={colors.white} />
                            <Text style={styles.imgLoaderText}>Retry</Text>
                          </TouchableOpacity>
                        )}
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

                {videoUpload && (
                  <View style={styles.previewWrapper}>
                    <View
                      style={[
                        styles.previewImg,
                        {
                          backgroundColor: colors.ink,
                          justifyContent: 'center',
                          alignItems: 'center',
                          opacity: videoUpload.status === 'success' ? 1 : 0.5,
                        },
                      ]}
                    >
                      <Ionicons name="film-outline" size={24} color={colors.white} />
                    </View>
                    <TouchableOpacity
                      style={styles.removeMediaBtn}
                      onPress={() => setVideoUpload(null)}
                    >
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
            loading={createJobMutation.isPending || updateJobMutation.isPending || isPublishing}
            disabled={
              !isAllPhotosUploaded ||
              isUploadingVideo ||
              createJobMutation.isPending ||
              updateJobMutation.isPending
            }
            onPress={handleSubmit}
            style={{ marginTop: 24 }}
          />
          {(!isAllPhotosUploaded || isUploadingVideo) && (
            <Text
              style={{
                fontFamily: fonts.body,
                color: colors.error,
                fontSize: 12,
                marginTop: 8,
                textAlign: 'center',
              }}
            >
              Please wait until all selected photos and videos are uploaded before publishing.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isPublishing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressTitle}>Publishing Job Post</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{uploadProgress}% Uploaded</Text>
            <Text style={styles.progressSubtitle}>Uploading photos, videos, and details...</Text>
          </View>
        </View>
      </Modal>

      <Modal visible={isAnyMediaUploading} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressTitle}>
              {isUploadingVideo
                ? videoUpload?.status === 'compressing'
                  ? 'Compressing Video...'
                  : `Uploading Video: ${videoUpload?.progress || 0}%`
                : `Uploading Photos: ${overallProgress}%`}
            </Text>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${
                      isUploadingVideo
                        ? videoUpload?.status === 'compressing'
                          ? 10
                          : videoUpload?.progress || 0
                        : overallProgress
                    }%`,
                  },
                ]}
              />
            </View>
            <Text style={styles.progressPercent}>
              {isUploadingVideo
                ? videoUpload?.status === 'compressing'
                  ? 'Processing...'
                  : `${videoUpload?.progress || 0}%`
                : `${overallProgress}%`}
            </Text>
            <Text style={styles.progressSubtitle}>
              Please wait while we upload your media assets.
            </Text>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    backgroundColor: colors.white,
    borderRadius: 24,
    padding: 30,
    width: '85%',
    alignItems: 'center',
    ...shadows.base,
  },
  progressTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
    marginTop: 16,
    marginBottom: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 8,
    backgroundColor: colors.inkFaint,
    borderRadius: 4,
    marginVertical: 12,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 4,
  },
  progressPercent: {
    fontFamily: fonts.numericBlack,
    fontSize: 15,
    color: colors.primarySoft,
  },
  progressSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 8,
    textAlign: 'center',
  },
  progressBarWrapper: {
    width: '100%',
    marginTop: 12,
  },
  progressText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
    marginTop: 4,
  },
  imgLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imgLoaderText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    marginTop: 2,
  },
});

export default PostJobScreen;
