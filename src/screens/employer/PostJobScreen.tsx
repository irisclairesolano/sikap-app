/**
 * ============================================================================
 * SCREEN: Employer Post & Edit Job Screen (src/screens/employer/PostJobScreen.tsx)
 * ============================================================================
 *
 * (a) Screen / Module Role in the SIKAP Mobile App:
 *     Provides the job creation and editing form for verified Employers in
 *     Sorsogon. Supports custom & preset trade category tags (with bilingual
 *     profanity filtering), Sorsogon Municipality/Barangay selection, flexible
 *     pay rate bases (`per_day`, `per_hour`, `per_project`, `per_piece`), a
 *     real-time DOLE Region V Wage Advisory & Equivalence calculator, background
 *     photo/video media uploads with progress bars, and local draft persistence.
 *
 * (b) Key State & Hooks Used:
 *     - Form State: `title`, `categories`, `municipality`, `barangay`, `pay`,
 *       `rateUnit`, `slots`, `duration`, `durationUnit`, `scheduleDate`,
 *       `description`, `exactLocation`, `toolsRequired`, `isUrgent`.
 *     - `getWageEquivalentInfo()`: Computes hourly/daily wage equivalents and
 *       flags non-blocking DOLE Region V minimum-wage advisories (₱455/day in Sorsogon).
 *     - `photos` & `videoUpload`: Tracks immediate background XHR multipart
 *       uploads (`/jobs/upload-photo`, `/jobs/upload-video`) with live progress.
 *     - `AsyncStorage` (`DRAFT_STORAGE_KEY`): Automatically saves and restores
 *       in-progress job drafts so employers never lose work on accidental exit.
 *     - `useCreateJob()` / `useUpdateJob()`: React Query mutations with an
 *       `idempotency_key` guard to prevent duplicate job submissions on slow networks.
 *
 * (c) UI <-> React Query <-> Pusher WebSockets <-> Laravel REST API Data Flow:
 *     1. Selecting worksite photos or videos compresses images client-side via
 *        `expo-image-manipulator` and immediately uploads them via XHR to
 *        Laravel (`POST /api/v1/jobs/upload-photo`), returning remote CDN URLs.
 *     2. Submitting the form sends `POST /api/v1/jobs` (or `PUT /api/v1/jobs/{id}`)
 *        with the remote media URLs and a unique `idempotency_key`.
 *     3. On success, React Query invalidates `['myJobs']` and `['jobs']`,
 *        clears the AsyncStorage draft, and navigates to the celebratory
 *        `SuccessScreen` while Laravel notifies matching workers in Sorsogon.
 * ============================================================================
 */
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import React, { useState, useEffect, useRef } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
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
import { useLanguage } from '../../contexts/LanguageContext';
import { TranslationKey } from '../../locales/en';
import { useCreateJob, useUpdateJob, useEmployerJobs } from '../../hooks/useEmployerJobs';
import { jobsApi } from '../../api/jobs';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import * as SecureStore from '../../utils/storage';
import { appendFileToFormData } from '../../utils/formData';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { triggerHaptic } from '../../utils/haptics';
import { MediaViewerModal } from '../../components/common/MediaViewerModal';

const DRAFT_STORAGE_KEY = 'sikap_post_job_draft_v1';
const DURATION_UNITS_CONFIG: { unit: string; key: TranslationKey }[] = [
  { unit: 'None', key: 'unit_none' },
  { unit: 'Hours', key: 'unit_hours' },
  { unit: 'Days', key: 'unit_days' },
  { unit: 'Weeks', key: 'unit_weeks' },
  { unit: 'Months', key: 'unit_months' },
];

const RATE_UNITS_CONFIG: {
  labelKey: TranslationKey;
  sublabelKey: TranslationKey;
  value: 'per_day' | 'per_hour' | 'per_project' | 'per_piece';
  hint: string;
}[] = [
  { labelKey: 'rate_per_day', sublabelKey: 'sublabel_daily', value: 'per_day', hint: '/ day' },
  { labelKey: 'rate_per_hour', sublabelKey: 'sublabel_hourly', value: 'per_hour', hint: '/ hr' },
  {
    labelKey: 'rate_per_project',
    sublabelKey: 'sublabel_project',
    value: 'per_project',
    hint: 'total',
  },
  {
    labelKey: 'rate_per_piece',
    sublabelKey: 'sublabel_piece_rate',
    value: 'per_piece',
    hint: '/ pc',
  },
];

const DEFAULT_CATEGORIES = [
  'Construction',
  'Domestic',
  'Agriculture',
  'Skilled Trade',
  'Transport',
  'Craft',
];

const CATEGORY_TRANSLATIONS: Record<string, TranslationKey> = {
  Construction: 'cat_construction',
  Domestic: 'cat_domestic',
  Agriculture: 'cat_agriculture',
  'Skilled Trade': 'cat_skilled_trade',
  Transport: 'cat_transport',
  Craft: 'cat_craft',
};

export const PostJobScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<EmployerStackParamList>>();
  const route = useRoute<RouteProp<EmployerStackParamList, 'PostJob'>>();
  const jobToEdit = (route.params as any)?.job;
  const isEditMode = !!jobToEdit;

  const createJobMutation = useCreateJob();
  const updateJobMutation = useUpdateJob();
  const { data: myJobsData } = useEmployerJobs();
  const { showAlert } = useAlert();
  const { t } = useLanguage();

  const [isPublishing, setIsPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [title, setTitle] = useState(jobToEdit?.title || '');

  // Category tags
  const [currentCategory, setCurrentCategory] = useState('');
  const [categories, setCategories] = useState<string[]>(jobToEdit?.categories || []);
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  const [municipality, setMunicipality] = useState(jobToEdit?.municipality || '');
  const [barangay, setBarangay] = useState(jobToEdit?.barangay || '');
  // Pay and Slots
  const [pay, setPay] = useState(jobToEdit?.compensation ? String(jobToEdit.compensation) : '');
  const [rateUnit, setRateUnit] = useState<'per_day' | 'per_hour' | 'per_project' | 'per_piece'>(
    (jobToEdit?.rate_unit as any) ||
      (jobToEdit?.duration_type === 'project-based' ? 'per_project' : 'per_day'),
  );
  const [slots, setSlots] = useState(jobToEdit?.slots ? String(jobToEdit.slots) : '1');

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

  // ==========================================================================
  // DOLE REGION V WAGE ADVISORY & REAL-TIME EQUIVALENCE CALCULATOR
  // ==========================================================================
  const DOLE_DAILY_MINIMUM = 395;
  const DOLE_HOURLY_MINIMUM = 49.38;

  // Wage conversion & sanity check helper
  const getWageEquivalentInfo = () => {
    if (!pay || isNaN(parsedPay) || parsedPay <= 0) return null;

    if (rateUnit === 'per_hour') {
      const dailyEq = parsedPay * 8;
      const isSuspectLow = parsedPay < 50;
      return {
        equivalent: t('wage_eq_daily_workday', {
          amount: dailyEq.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
          }),
        }),
        isWarning: isSuspectLow,
        warningText: isSuspectLow ? t('wage_warn_unusually_low_hourly') : undefined,
        note: `Rate: ₱${parsedPay.toLocaleString()} / hr`,
      };
    }

    if (rateUnit === 'per_day') {
      const hourlyEq = parsedPay / 8;
      const isSuspectLow = parsedPay < 395;
      return {
        equivalent: t('wage_eq_hourly_basis', { amount: hourlyEq.toFixed(2) }),
        isWarning: isSuspectLow,
        warningText: isSuspectLow
          ? t('wage_warn_dole_below_minimum', { amount: parsedPay.toLocaleString() })
          : undefined,
        note: t('standard_daily_rate_note'),
      };
    }

    if (rateUnit === 'per_project') {
      const parsedDur = parseFloat(duration);
      if (durationUnit !== 'None' && parsedDur && !isNaN(parsedDur) && parsedDur > 0) {
        let totalHours = 8;
        if (durationUnit === 'Hours') totalHours = parsedDur;
        else if (durationUnit === 'Days') totalHours = parsedDur * 8;
        else if (durationUnit === 'Weeks') totalHours = parsedDur * 40;
        else if (durationUnit === 'Months') totalHours = parsedDur * 160;

        const hourlyEq = parsedPay / totalHours;
        const localizedUnit =
          durationUnit === 'Hours'
            ? t('unit_hours')
            : durationUnit === 'Days'
              ? t('unit_days')
              : durationUnit === 'Weeks'
                ? t('unit_weeks')
                : durationUnit === 'Months'
                  ? t('unit_months')
                  : durationUnit;

        return {
          equivalent: t('wage_eq_project_duration', {
            amount: hourlyEq.toFixed(2),
            duration: parsedDur,
            unit: localizedUnit.toLowerCase(),
          }),
          isWarning: hourlyEq < 50,
          warningText: hourlyEq < 50 ? t('wage_warn_project_unusually_low') : undefined,
          note: t('wage_eq_fixed_payout'),
        };
      }
      return {
        equivalent: t('wage_eq_fixed_payout'),
        isWarning: false,
        warningText: undefined,
        note: t('sublabel_project'),
      };
    }

    if (rateUnit === 'per_piece') {
      return {
        equivalent: t('wage_eq_piece_payout', { amount: parsedPay.toLocaleString() }),
        isWarning: false,
        warningText: undefined,
        note: t('sublabel_piece_rate'),
      };
    }

    return null;
  };

  const wageInfo = getWageEquivalentInfo();

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
  const [viewerMedia, setViewerMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(
    null,
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
    }
  }, [jobToEdit]);

  // Load draft on mount for new jobs
  useEffect(() => {
    if (!isEditMode) {
      AsyncStorage.getItem(DRAFT_STORAGE_KEY).then((raw) => {
        if (raw) {
          try {
            const draft = JSON.parse(raw);
            if (draft.title && !title) setTitle(draft.title);
            if (draft.categories && draft.categories.length > 0 && categories.length === 0) {
              setCategories(draft.categories);
            }
            if (draft.municipality && !municipality) setMunicipality(draft.municipality);
            if (draft.barangay && !barangay) setBarangay(draft.barangay);
            if (draft.pay && !pay) setPay(draft.pay);
            if (draft.rateUnit) setRateUnit(draft.rateUnit);
            if (draft.slots && !slots) setSlots(draft.slots);
            if (draft.duration && !duration) setDuration(draft.duration);
            if (draft.durationUnit) setDurationUnit(draft.durationUnit);
            if (draft.description && !description) setDescription(draft.description);
            if (draft.exactLocation && !exactLocation) setExactLocation(draft.exactLocation);
            if (draft.toolsRequired && !toolsRequired) setToolsRequired(draft.toolsRequired);
          } catch (_) {}
        }
      });
    }
  }, [isEditMode]);

  // Auto-save draft on form field changes
  useEffect(() => {
    if (!isEditMode) {
      if (title || description || pay || categories.length > 0) {
        const draft = {
          title,
          categories,
          municipality,
          barangay,
          pay,
          rateUnit,
          slots,
          duration,
          durationUnit,
          description,
          exactLocation,
          toolsRequired,
        };
        AsyncStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft)).catch(() => {});
      }
    }
  }, [
    isEditMode,
    title,
    categories,
    municipality,
    barangay,
    pay,
    rateUnit,
    slots,
    duration,
    durationUnit,
    description,
    exactLocation,
    toolsRequired,
  ]);

  const idempotencyKeyRef = useRef<string | null>(null);

  const compressImage = async (uri: string) => {
    const manipResult = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1080 } }], {
      compress: 0.7,
      format: ImageManipulator.SaveFormat.JPEG,
    });
    return manipResult.uri;
  };

  const compressVideo = async (uri: string) => {
    // Skip video compression to prevent Nitro JSI crashes in non-custom development clients
    return uri;
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

      const formData = new FormData();
      await appendFileToFormData(
        formData,
        'video',
        compressedUri,
        fileName || 'video.mp4',
        mimeType || 'video/mp4',
      );

      // Attempt upload via jobsApi / apiClient (with auth and multipart headers configured)
      const res = await jobsApi.uploadVideo(formData);
      setVideoUpload((prev) =>
        prev ? { ...prev, status: 'success', remoteUrl: res.url, progress: 100 } : null,
      );
    } catch (err) {
      console.error('Job video upload error:', err);
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

      const formData = new FormData();
      await appendFileToFormData(
        formData,
        'photo',
        compressedUri,
        `photo_${photoId}.jpg`,
        'image/jpeg',
      );

      // Try uploading via jobsApi / apiClient
      const res = await jobsApi.uploadPhoto(formData);
      setPhotos((prev) =>
        prev.map((p) =>
          p.id === photoId ? { ...p, status: 'success', remoteUrl: res.url, progress: 100 } : p,
        ),
      );
    } catch (err) {
      console.error(`Job photo upload error (photo ${photoId}):`, err);
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
        showAlert(t('alert_profanity_detected'), t('alert_profanity_desc'));
        setCurrentCategory('');
        setShowCategorySuggestions(false);
        return;
      }
      const lowerCategories = categories.map((c) => c.toLowerCase());
      if (lowerCategories.includes(trimmed.toLowerCase())) {
        showAlert(t('alert_duplicate_tag'), t('alert_duplicate_tag_desc'));
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
      showAlert(t('alert_limit_reached'), t('alert_limit_photos_desc'));
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
    if (!title) missingFields.push(t('job_title_label').replace(' *', ''));
    if (finalCategories.length === 0) missingFields.push(t('categories_label').replace(' *', ''));
    if (!barangay) missingFields.push(t('barangay'));
    if (!municipality) missingFields.push(t('municipality'));
    if (!pay) missingFields.push(t('pay_amount_label').replace(' *', ''));
    if (!rateUnit) missingFields.push(t('rate_basis_label').replace(' *', ''));
    if (!slots) missingFields.push(t('slots_workers_needed_label').replace(' *', ''));
    if (!description) missingFields.push(t('job_description_label').replace(' *', ''));

    if (missingFields.length > 0) {
      console.log('⚠️ Missing fields:', missingFields);
      showAlert(
        t('alert_missing_fields'),
        t('alert_missing_fields_desc', { fields: missingFields.join(', ') }),
      );
      return;
    }

    if (payInvalid || slotsInvalid) {
      const invalidFields = [];
      if (payInvalid) invalidFields.push(t('err_pay_min_1'));
      if (slotsInvalid) invalidFields.push(t('err_slots_min_1'));
      showAlert(t('alert_missing_fields'), invalidFields.join('\n'));
      return;
    }

    // Media Upload Progress Guards
    const isUploadingPhotos = photos.some((p) => p.status === 'uploading');
    const isUploadingVideo =
      videoUpload && (videoUpload.status === 'uploading' || videoUpload.status === 'compressing');

    if (isUploadingPhotos || isUploadingVideo) {
      showAlert(t('alert_upload_in_progress'), t('alert_upload_in_progress_desc'));
      return;
    }

    const hasPhotoErrors = photos.some((p) => p.status === 'error');
    const hasVideoError = videoUpload && videoUpload.status === 'error';
    if (hasPhotoErrors || hasVideoError) {
      showAlert(t('alert_upload_error'), t('alert_upload_error_desc'));
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
      rate_unit: rateUnit,
      slots: parseInt(slots, 10),
      description,
      is_urgent: isUrgent,
      schedule_date: scheduleDate.toISOString().split('T')[0],
      photos: remoteUrls,
      video_url: videoUpload?.remoteUrl || null,
    };
    if (duration && durationUnit !== 'None') {
      payload.duration = parseInt(duration, 10);
      payload.duration_unit = durationUnit;
    } else {
      payload.duration = null;
      payload.duration_unit = null;
    }
    if (exactLocation) payload.exact_location = exactLocation;
    if (toolsRequired) payload.tools_required = toolsRequired;
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    }
    payload.idempotency_key = idempotencyKeyRef.current;

    setIsPublishing(true);
    setUploadProgress(90);

    if (isEditMode) {
      updateJobMutation.mutate(
        { id: jobToEdit.id, payload },
        {
          onSuccess: () => {
            idempotencyKeyRef.current = null;
            setIsPublishing(false);
            setUploadProgress(100);
            showAlert(t('alert_job_updated'), t('alert_changes_saved'), [
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
        onSuccess: async () => {
          idempotencyKeyRef.current = null;
          setIsPublishing(false);
          setUploadProgress(100);
          await AsyncStorage.removeItem(DRAFT_STORAGE_KEY).catch(() => {});

          const isFirstJob = !myJobsData || (myJobsData.data && myJobsData.data.length === 0);

          navigation.replace('Success', {
            variant: isFirstJob ? 'milestone' : 'confirm',
            title: isFirstJob ? t('success_first_job_title') : t('success_job_live_title'),
            message: isFirstJob ? t('success_first_job_msg') : t('success_job_live_msg'),
            detail: [
              { label: t('job_title_label').replace(' *', ''), value: title.trim() },
              { label: t('location'), value: `${barangay}, ${municipality}` },
              {
                label: t('compensation'),
                value: `₱${parsedPay.toLocaleString()} / ${rateUnit.replace('per_', '')}`,
              },
              {
                label: t('slots_available'),
                value: `${slots} worker${parseInt(slots, 10) > 1 ? 's' : ''}`,
              },
            ],
            primaryAction: {
              label: t('view_my_jobs_btn'),
              navigateTo: { name: 'MyJobsList' },
            },
            secondaryAction: {
              label: t('post_another_job_btn'),
              navigateTo: { name: 'PostJob' },
            },
          });
        },
        onError: (err: any) => {
          setIsPublishing(false);
          triggerHaptic('error');
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
            <Text style={styles.appBarBadgeText}>
              {isEditMode ? t('edit_post_badge') : t('new_post_badge')}
            </Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            {isEditMode ? t('edit_your_prefix') : t('post_a_prefix')}
            {'\n'}
            <Text style={styles.titleAccent}>
              {isEditMode ? t('job_post_accent') : t('new_job_accent')}
            </Text>
          </Text>

          <View style={styles.formContainer}>
            <CustomInput
              label={t('job_title_label')}
              value={title}
              onChangeText={setTitle}
              placeholder={t('job_title_placeholder')}
            />

            {/* Categories */}
            <View style={{ zIndex: 10 }}>
              <CustomInput
                label={t('categories_label')}
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
                      showAlert(t('alert_profanity_detected'), t('alert_profanity_desc'));
                    } else if (duplicateFound) {
                      showAlert(t('alert_duplicate_tag'), t('alert_duplicate_tag_desc'));
                    }
                  } else {
                    setCurrentCategory(text);
                    setShowCategorySuggestions(true);
                  }
                }}
                onFocus={() => setShowCategorySuggestions(true)}
                placeholder={t('categories_placeholder')}
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
                          <Text style={styles.dropdownItemText}>
                            {CATEGORY_TRANSLATIONS[cat] ? t(CATEGORY_TRANSLATIONS[cat]) : cat}
                          </Text>
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
                              {t('add_category_suggestion', { category: currentCategory.trim() })}
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
                      <Text style={styles.chipText}>
                        {CATEGORY_TRANSLATIONS[cat] ? t(CATEGORY_TRANSLATIONS[cat]) : cat}
                      </Text>
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
              label={t('exact_location_label')}
              value={exactLocation}
              onChangeText={setExactLocation}
              placeholder={t('exact_location_placeholder')}
              icon="map-outline"
            />

            {/* Pay Amount & Rate Basis Group */}
            <View style={styles.fieldBlock}>
              <CustomInput
                label={t('pay_amount_label')}
                value={pay}
                onChangeText={handlePayChange}
                placeholder="600"
                keyboardType="numeric"
                status={payInvalid ? 'invalid' : undefined}
              />
              <View style={{ marginTop: 12 }}>
                <Text style={styles.label}>{t('rate_basis_label')}</Text>
                <View style={styles.rateUnitSelector}>
                  {RATE_UNITS_CONFIG.map((item) => {
                    const isSelected = rateUnit === item.value;
                    return (
                      <TouchableOpacity
                        key={item.value}
                        style={[styles.rateUnitBtn, isSelected && styles.rateUnitBtnActive]}
                        onPress={() => {
                          triggerHaptic();
                          setRateUnit(item.value);
                        }}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.rateUnitBtnText,
                            isSelected && styles.rateUnitBtnTextActive,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {t(item.labelKey)}
                        </Text>
                        <Text
                          style={[
                            styles.rateUnitSubtext,
                            isSelected && styles.rateUnitSubtextActive,
                          ]}
                          numberOfLines={1}
                          adjustsFontSizeToFit
                        >
                          {t(item.sublabelKey)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Live Wage Conversion & Preview */}
                {wageInfo && (
                  <View
                    style={[
                      styles.wagePreviewCard,
                      wageInfo.isWarning && styles.wagePreviewCardWarning,
                    ]}
                  >
                    <View style={styles.wagePreviewHeader}>
                      <Ionicons
                        name={wageInfo.isWarning ? 'warning-outline' : 'calculator-outline'}
                        size={16}
                        color={wageInfo.isWarning ? '#B45309' : '#15803D'}
                      />
                      <Text
                        style={[
                          styles.wagePreviewEquivalent,
                          wageInfo.isWarning && styles.wagePreviewEquivalentWarning,
                        ]}
                      >
                        {wageInfo.equivalent}
                      </Text>
                    </View>
                    {wageInfo.warningText && (
                      <Text style={styles.wagePreviewWarningText}>{wageInfo.warningText}</Text>
                    )}
                    {wageInfo.note && !wageInfo.warningText && (
                      <Text style={styles.wagePreviewNote}>{wageInfo.note}</Text>
                    )}
                    <TouchableOpacity
                      onPress={() => Linking.openURL('https://nwpc.dole.gov.ph/region-v/')}
                      activeOpacity={0.7}
                      style={styles.wageDoleLink}
                    >
                      <Ionicons name="information-circle-outline" size={13} color="#2563EB" />
                      <Text style={styles.wageDoleLinkText}>
                        DOLE Region V Sorsogon Minimum Wage: ₱455/day (Effective Apr 8, 2026)
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>

            {/* Slots Underneath Pay & Rate Basis */}
            <View style={styles.fieldBlock}>
              <CustomInput
                label={t('slots_workers_needed_label')}
                value={slots}
                onChangeText={handleSlotsChange}
                placeholder="2"
                keyboardType="numeric"
                status={slotsInvalid ? 'invalid' : undefined}
              />
            </View>

            <View style={styles.fieldBlock}>
              <CustomInput
                label={t('duration_label')}
                value={durationUnit === 'None' ? '' : duration}
                onChangeText={setDuration}
                placeholder={durationUnit === 'None' ? 'N/A' : 'E.g. 5'}
                keyboardType="numeric"
                icon="time-outline"
                editable={durationUnit !== 'None'}
              />
              <View style={{ marginTop: 10 }}>
                <Text style={styles.label}>{t('duration_unit_label')}</Text>
                <View style={styles.unitSelector}>
                  {DURATION_UNITS_CONFIG.map((item) => (
                    <TouchableOpacity
                      key={item.unit}
                      style={[styles.unitBtn, durationUnit === item.unit && styles.unitBtnActive]}
                      onPress={() => {
                        triggerHaptic();
                        setDurationUnit(item.unit);
                        if (item.unit === 'None') {
                          setDuration('');
                        }
                      }}
                    >
                      <Text
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        style={[
                          styles.unitBtnText,
                          durationUnit === item.unit && styles.unitBtnTextActive,
                        ]}
                      >
                        {t(item.key)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View>
              <Text style={styles.label}>{t('schedule_date_label')}</Text>
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
                  onValueChange={(_event, selectedDate) => {
                    setShowDatePicker(false);
                    if (selectedDate) setScheduleDate(selectedDate);
                  }}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </View>

            <CustomInput
              label={t('job_description_label')}
              value={description}
              onChangeText={setDescription}
              placeholder={t('job_description_placeholder')}
              multiline
              allowEmoji={true}
              icon="create-outline"
            />

            <CustomInput
              label={t('tools_required_label')}
              value={toolsRequired}
              onChangeText={setToolsRequired}
              placeholder={t('tools_required_placeholder')}
              icon="hammer-outline"
            />

            {!isEditMode && (
              <View style={styles.mediaSection}>
                <Text style={styles.label}>{t('photos_video_optional')}</Text>

                <View style={styles.mediaRow}>
                  <TouchableOpacity style={styles.mediaBtn} onPress={pickPhotos}>
                    <Ionicons name="image-outline" size={24} color={colors.primary} />
                    <Text style={styles.mediaBtnText}>{t('add_photos_btn')}</Text>
                    <Text style={styles.mediaBtnSub}>{photos.length}/5</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.mediaBtn}
                    onPress={pickVideo}
                    disabled={isUploadingVideo}
                  >
                    <Ionicons name="videocam-outline" size={24} color={colors.primary} />
                    <Text style={styles.mediaBtnText}>
                      {videoUpload ? t('change_video_btn') : t('add_video_btn')}
                    </Text>
                    <Text style={styles.mediaBtnSub}>{videoUpload ? '1/1' : '0/1'}</Text>
                  </TouchableOpacity>
                </View>

                {photos.length > 0 && overallProgress < 100 && (
                  <View style={styles.progressBarWrapper}>
                    <View style={styles.progressBarBg}>
                      <View style={[styles.progressBarFill, { width: `${overallProgress}%` }]} />
                    </View>
                    <Text style={styles.progressText}>
                      {t('uploading_photos_progress', { progress: overallProgress })}
                    </Text>
                  </View>
                )}

                {videoUpload && videoUpload.status === 'compressing' && (
                  <View style={styles.progressBarWrapper}>
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.progressText}>{t('compressing_video')}</Text>
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
                      {t('uploading_video_progress', { progress: videoUpload.progress })}
                    </Text>
                  </View>
                )}

                {videoUpload && videoUpload.status === 'error' && (
                  <View style={styles.progressBarWrapper}>
                    <Text style={[styles.progressText, { color: colors.error }]}>
                      {t('video_upload_failed')}
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
                        <TouchableOpacity
                          activeOpacity={0.8}
                          onPress={() => setViewerMedia({ type: 'photo', url: p.uri })}
                        >
                          <Image
                            cachePolicy="memory-disk"
                            source={{ uri: p.uri }}
                            style={styles.previewImg}
                            blurRadius={p.status !== 'success' ? 15 : 0}
                          />
                        </TouchableOpacity>
                        {p.status === 'uploading' && (
                          <View style={styles.imgLoaderOverlay}>
                            <ActivityIndicator size="small" color={colors.white} />
                            <Text style={styles.imgLoaderText}>
                              {p.progress >= 100 ? t('processing_label') : `${p.progress}%`}
                            </Text>
                          </View>
                        )}
                        {p.status === 'error' && (
                          <TouchableOpacity
                            style={styles.imgLoaderOverlay}
                            onPress={() => retryUpload(p.id)}
                          >
                            <Ionicons name="refresh-circle" size={24} color={colors.white} />
                            <Text style={styles.imgLoaderText}>{t('retry_label')}</Text>
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
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => setViewerMedia({ type: 'video', url: videoUpload.uri })}
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
                    </TouchableOpacity>
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
                <Text style={styles.urgentTitle}>{t('mark_as_urgent')}</Text>
                <Text style={styles.urgentSubtitle}>{t('urgent_desc')}</Text>
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
            label={isEditMode ? t('save_changes_btn') : t('publish_job_btn')}
            size="lg"
            fullWidth
            loading={createJobMutation.isPending || updateJobMutation.isPending || isPublishing}
            disabled={
              !isAllPhotosUploaded ||
              isUploadingVideo ||
              createJobMutation.isPending ||
              updateJobMutation.isPending
            }
            onPress={handleSubmit}
            style={{ marginTop: 16 }}
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
              {t('wait_media_upload_desc')}
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={isPublishing} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.progressContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.progressTitle}>
              {isEditMode ? t('updating_job_modal') : t('publishing_job_modal')}
            </Text>
            <Text style={styles.progressSubtitle}>{t('please_wait_moment')}</Text>
          </View>
        </View>
      </Modal>

      <MediaViewerModal
        visible={!!viewerMedia}
        media={viewerMedia}
        onClose={() => setViewerMedia(null)}
      />
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
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
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
    paddingBottom: 24,
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
  fieldBlock: {
    marginBottom: 16,
  },
  rateUnitSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  rateUnitBtn: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rateUnitBtnActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  rateUnitBtnText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  rateUnitBtnTextActive: {
    color: '#FFFFFF',
    fontFamily: fonts.bodyBold,
  },
  rateUnitSubtext: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  rateUnitSubtextActive: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontFamily: fonts.bodyMedium,
  },
  wagePreviewCard: {
    marginTop: 10,
    padding: 12,
    backgroundColor: '#F0FDF4',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  wagePreviewCardWarning: {
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
  },
  wagePreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  wagePreviewEquivalent: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#15803D',
    flex: 1,
  },
  wagePreviewEquivalentWarning: {
    color: '#92400E',
  },
  wagePreviewWarningText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: '#B45309',
    marginTop: 4,
    lineHeight: 16,
  },
  wagePreviewNote: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    marginTop: 2,
  },
  wageDoleLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  wageDoleLinkText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 11,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  unitSelector: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 6,
  },
  unitBtn: {
    flex: 1,
    paddingHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
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
    ...StyleSheet.absoluteFill,
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
