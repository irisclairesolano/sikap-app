import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import * as SecureStore from '../../utils/storage';
import { appendFileToFormData } from '../../utils/formData';
import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { authApi } from '../../api/auth';
import { ApiClientError } from '../../api/client';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/authTypes';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'IDUpload'>;
type IDUploadRouteProp = RouteProp<AuthStackParamList, 'IDUpload'>;

const IDUploadScreen: React.FC = () => {
  const queryClient = useQueryClient();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<IDUploadRouteProp>();
  const { userId, role } = route.params;
  const userRole = role ?? 'worker';
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [banner, setBanner] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedFileBack, setSelectedFileBack] = useState<any>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<any>(null);
  const [selectedBusinessDocs, setSelectedBusinessDocs] = useState<any[]>([]);
  const MAX_SIZE_MB = 5;

  useEffect(() => {
    const checkAuthToken = async () => {
      try {
        const token = await SecureStore.getItemAsync('auth_token');
        if (!token) {
          showAlert('Authentication Required', 'Please log in again to continue.');
          navigation.replace('Login');
        }
      } catch (error) {
        console.log('Error checking auth token:', error);
      }
    };
    checkAuthToken();
  }, [userId, userRole, navigation]);

  const compressImage = async (uri: string) => {
    try {
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1200 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      return manipResult.uri;
    } catch (error) {
      console.log('Compression error, using original', error);
      return uri;
    }
  };

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('user_id', userId.toString());
      form.append('role', userRole);

      const idUri = await compressImage(selectedFile.uri);
      await appendFileToFormData(
        form,
        'id_file',
        idUri,
        selectedFile.name ?? 'government-id.jpg',
        'image/jpeg',
      );

      const backUri = await compressImage(selectedFileBack.uri);
      await appendFileToFormData(
        form,
        'id_back_file',
        backUri,
        selectedFileBack.name ?? 'government-id-back.jpg',
        'image/jpeg',
      );

      if (userRole === 'worker' && selectedSelfie) {
        const selfieUri = await compressImage(selectedSelfie.uri);
        await appendFileToFormData(
          form,
          'selfie_file',
          selfieUri,
          selectedSelfie.name ?? 'selfie.jpg',
          'image/jpeg',
        );
      }

      if (userRole === 'employer' && selectedBusinessDocs.length > 0) {
        for (let i = 0; i < selectedBusinessDocs.length; i++) {
          const doc = selectedBusinessDocs[i];
          const fileName = doc.name ?? `business-doc-${i}.pdf`;
          const ext = fileName.split('.').pop()?.toLowerCase();
          let mimeType = doc.mimeType || doc.type;
          if (!mimeType || mimeType === 'unknown' || mimeType === '*/*') {
            if (ext === 'png') mimeType = 'image/png';
            else if (ext === 'jpg' || ext === 'jpeg') mimeType = 'image/jpeg';
            else mimeType = 'application/pdf';
          }
          await appendFileToFormData(form, 'business_documents[]', doc.uri, fileName, mimeType);
        }
      }

      await authApi.uploadId(form);
    },
    onSuccess: async () => {
      setBanner('');
      queryClient.setQueryData(['profile'], (old: any) => {
        if (!old) return old;
        return {
          ...old,
          registration_status: 'pending_review',
          document_url: 'uploaded',
        };
      });
      notifyAuthChanged();
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === 'PICK_CANCELLED') return;
      if (err instanceof ApiClientError) {
        if (err.status === 401 || err.status === 404) {
          showAlert('Authentication Error', 'Authentication error. Please log in again.');
          setTimeout(() => navigation.replace('Login'), 2000);
        } else if (err.status === 413) {
          showAlert('File Too Large', 'File too large. Please choose a smaller image.');
        } else if (err.status === 422 && err.errors) {
          const firstError = Object.values(err.errors)[0]?.[0];
          showAlert('Validation Failed', firstError || err.message || 'Validation failed.');
        } else {
          showAlert('Upload Failed', err.message || 'Upload failed. Please try again.');
        }
      } else if (err instanceof Error) {
        showAlert('Upload Failed', `Upload failed: ${err.message}`);
      }
    },
  });

  const assignFile = (
    type: 'id' | 'back' | 'selfie',
    asset: { uri: string; name?: string; size?: number; mimeType?: string },
  ) => {
    if (asset.size && asset.size > MAX_SIZE_MB * 1024 * 1024) {
      showAlert('File Too Large', `Please choose an image under ${MAX_SIZE_MB}MB.`);
      return;
    }
    if (type === 'id') setSelectedFile(asset);
    else if (type === 'back') setSelectedFileBack(asset);
    else if (type === 'selfie') setSelectedSelfie(asset);
  };

  const handlePickGallery = async (target: 'id' | 'back' | 'selfie') => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showAlert(
          'Photos Permission Required',
          'Please allow photo access to select your image from gallery.',
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsMultipleSelection: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const defaultName =
          target === 'id' ? 'id_front.jpg' : target === 'back' ? 'id_back.jpg' : 'selfie.jpg';
        assignFile(target, {
          uri: asset.uri,
          name: asset.fileName || defaultName,
          size: asset.fileSize,
          mimeType: asset.mimeType || 'image/jpeg',
        });
      }
    } catch (error) {
      console.log('Gallery picker error:', error);
      showAlert('Gallery Error', 'Could not open photo gallery. Please try again.');
    }
  };

  const handlePickBusiness = async () => {
    setBanner('');
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
          if (asset.size && asset.size > MAX_SIZE_MB * 1024 * 1024) {
            hasLargeFile = true;
            return false;
          }
          return true;
        });

        if (hasLargeFile) {
          showAlert('File Too Large', `One or more files exceed the ${MAX_SIZE_MB}MB limit.`);
        }

        setSelectedBusinessDocs(validFiles.slice(0, 3));
      }
    } catch (error) {
      console.log('File selection error:', error);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile || !selectedFileBack) {
      showAlert(
        'Required Files',
        'Please upload both front and back of your government ID to continue.',
      );
      return;
    }

    if (userRole === 'worker' && !selectedSelfie) {
      showAlert('Required Photo', 'Please also upload a selfie holding your ID to continue.');
      return;
    }

    uploadMutation.mutate();
  };

  const handleBackPress = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      showAlert('Sign Out?', 'Do you want to sign out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await SecureStore.deleteItemAsync('auth_token').catch(() => {});
            await SecureStore.deleteItemAsync('user_profile').catch(() => {});
            notifyAuthChanged();
          },
        },
      ]);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={[styles.appBar, { paddingHorizontal: 26 }]}>
        <TouchableOpacity onPress={handleBackPress} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>4 of 4</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.scroll, { paddingBottom: Math.max(insets.bottom, 24) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.progressBar}>
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
          <View style={styles.progressActive} />
        </View>

        <Text style={styles.title}>
          Verify your{'\n'}
          <Text style={styles.titleItalic}>identity.</Text>
        </Text>
        <Text style={styles.subtitle}>Upload a government-issued ID.</Text>

        {banner ? (
          <View style={styles.bannerError}>
            <Text style={styles.bannerTextError}>{banner}</Text>
          </View>
        ) : null}

        <View
          style={[
            styles.privacyCard,
            { backgroundColor: colors.butterBright, marginTop: 0, marginBottom: 16 },
          ]}
        >
          <Ionicons name="alert-circle" size={18} color={colors.gold} style={{ marginTop: 2 }} />
          <Text style={[styles.privacyText, { color: colors.ink }]}>
            <Text style={styles.privacyTextBold}>Upload Guidelines: </Text>
            Choose clear photos from your gallery. Ensure your ID and face are well-lit, not blurry,
            and all text is clearly readable. Unclear photos will be{' '}
            <Text style={{ color: colors.error, fontFamily: fonts.bodyBold }}>rejected</Text>.
          </Text>
        </View>

        {/* Three Separate Upload Cards with ambient glows */}
        <View style={styles.cardsWrapper}>
          <View style={styles.ambientGlowPeach} />
          <View style={styles.ambientGlowSky} />
          <View style={styles.ambientGlowMint} />

          <View style={styles.cardsContainer}>
            {/* Card 1: ID Front */}
            <TouchableOpacity
              style={[
                styles.uploadCardContainer,
                selectedFile && styles.uploadCardContainerSelected,
              ]}
              onPress={() => handlePickGallery('id')}
              disabled={uploadMutation.isPending}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={45}
                tint="light"
                style={[styles.uploadCardBlur, selectedFile && styles.uploadCardBlurSelected]}
              >
                <View style={[styles.cameraIconBox, selectedFile && styles.cameraIconBoxSelected]}>
                  <Ionicons
                    name={selectedFile ? 'checkmark-circle' : 'images'}
                    size={28}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.uploadTitle}>
                  {selectedFile ? 'ID Front Uploaded ✓' : 'Upload ID Front (from gallery)'}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  {selectedFile
                    ? `${selectedFile.name}`
                    : "PhilSys • Driver's License • Voter's ID\nPRC • Postal ID"}
                </Text>
              </BlurView>
            </TouchableOpacity>

            {/* Card 2: ID Back */}
            <TouchableOpacity
              style={[
                styles.uploadCardContainer,
                selectedFileBack && styles.uploadCardContainerSelected,
              ]}
              onPress={() => handlePickGallery('back')}
              disabled={uploadMutation.isPending}
              activeOpacity={0.85}
            >
              <BlurView
                intensity={45}
                tint="light"
                style={[styles.uploadCardBlur, selectedFileBack && styles.uploadCardBlurSelected]}
              >
                <View
                  style={[styles.cameraIconBox, selectedFileBack && styles.cameraIconBoxSelected]}
                >
                  <Ionicons
                    name={selectedFileBack ? 'checkmark-circle' : 'images'}
                    size={28}
                    color={colors.white}
                  />
                </View>
                <Text style={styles.uploadTitle}>
                  {selectedFileBack ? 'ID Back Uploaded ✓' : 'Upload ID Back (from gallery)'}
                </Text>
                <Text style={styles.uploadSubtitle}>
                  {selectedFileBack ? `${selectedFileBack.name}` : 'Back side of your ID'}
                </Text>
              </BlurView>
            </TouchableOpacity>

            {/* Card 3: Worker Selfie OR Employer Business Documents */}
            {userRole === 'worker' ? (
              <TouchableOpacity
                style={[
                  styles.uploadCardContainer,
                  selectedSelfie && styles.uploadCardContainerSelected,
                ]}
                onPress={() => handlePickGallery('selfie')}
                disabled={uploadMutation.isPending}
                activeOpacity={0.85}
              >
                <BlurView
                  intensity={45}
                  tint="light"
                  style={[styles.uploadCardBlur, selectedSelfie && styles.uploadCardBlurSelected]}
                >
                  <View
                    style={[styles.cameraIconBox, selectedSelfie && styles.cameraIconBoxSelected]}
                  >
                    <Ionicons
                      name={selectedSelfie ? 'checkmark-circle' : 'images'}
                      size={26}
                      color={colors.white}
                    />
                  </View>
                  <Text style={styles.uploadTitle}>
                    {selectedSelfie ? 'Selfie Uploaded ✓' : 'Upload selfie with ID (from gallery)'}
                  </Text>
                  <Text style={styles.uploadSubtitle}>
                    {selectedSelfie
                      ? `${selectedSelfie.name}`
                      : 'Please ensure your face and ID are clear.'}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[
                  styles.uploadCardContainer,
                  selectedBusinessDocs.length > 0 && styles.uploadCardContainerSelected,
                ]}
                onPress={handlePickBusiness}
                disabled={uploadMutation.isPending}
                activeOpacity={0.85}
              >
                <BlurView
                  intensity={45}
                  tint="light"
                  style={[
                    styles.uploadCardBlur,
                    selectedBusinessDocs.length > 0 && styles.uploadCardBlurSelected,
                  ]}
                >
                  <View
                    style={[
                      styles.cameraIconBox,
                      selectedBusinessDocs.length > 0 && styles.cameraIconBoxSelected,
                    ]}
                  >
                    <Ionicons
                      name={selectedBusinessDocs.length > 0 ? 'checkmark-circle' : 'document-text'}
                      size={26}
                      color={colors.white}
                    />
                  </View>
                  <Text style={styles.uploadTitle}>
                    {selectedBusinessDocs.length > 0
                      ? `${selectedBusinessDocs.length} Document(s) Uploaded ✓`
                      : 'Business Documents (Optional)'}
                  </Text>
                  <Text style={styles.uploadSubtitle}>
                    {selectedBusinessDocs.length > 0
                      ? selectedBusinessDocs.map((d) => d.name).join(', ')
                      : 'DTI, SEC registration, or Mayor’s permit (PDF or Image, max 3)'}
                  </Text>
                </BlurView>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.privacyCard}>
          <Ionicons
            name="shield-checkmark"
            size={18}
            color={colors.mintDeep}
            style={{ marginTop: 2 }}
          />
          <Text style={styles.privacyText}>
            <Text style={styles.privacyTextBold}>Your ID stays private. </Text>
            Only the SIKAP admin can view it during verification.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button
            label={uploadMutation.isPending ? 'Submitting...' : 'Submit for review'}
            size="lg"
            fullWidth
            disabled={
              !selectedFile || !selectedFileBack || (userRole === 'worker' && !selectedSelfie)
            }
            loading={uploadMutation.isPending}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>

      {uploadMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>
            Uploading government ID... Please keep the app open.
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scroll: {
    paddingHorizontal: 26,
    paddingTop: 12,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepBadge: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 5,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  stepBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
  },
  progressBar: {
    flexDirection: 'row',
    gap: 4,
    marginBottom: 20,
    marginTop: 8,
  },
  progressActive: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 32,
    lineHeight: 32,
    color: colors.ink,
    letterSpacing: -0.8,
    marginBottom: 10,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    marginBottom: 20,
  },
  cardsWrapper: {
    position: 'relative',
    marginTop: 4,
    marginBottom: 8,
  },
  ambientGlowPeach: {
    position: 'absolute',
    top: 15,
    right: -10,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(255, 197, 208, 0.30)',
  },
  ambientGlowSky: {
    position: 'absolute',
    top: '36%',
    left: -15,
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: 'rgba(176, 226, 255, 0.30)',
  },
  ambientGlowMint: {
    position: 'absolute',
    bottom: 10,
    right: -5,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(152, 251, 152, 0.25)',
  },
  cardsContainer: {
    gap: 16,
  },
  uploadCardContainer: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.65)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.04,
    shadowRadius: 18,
    elevation: 2,
  },
  uploadCardContainerSelected: {
    borderColor: 'rgba(34, 197, 94, 0.50)',
  },
  uploadCardBlur: {
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    paddingVertical: 26,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 10,
  },
  uploadCardBlurSelected: {
    backgroundColor: 'rgba(240, 253, 244, 0.65)',
  },
  cameraIconBox: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 2,
  },
  cameraIconBoxSelected: {
    backgroundColor: colors.success,
    shadowColor: colors.success,
  },
  uploadTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  privacyCard: {
    backgroundColor: 'rgba(240, 253, 244, 0.90)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(152, 251, 152, 0.40)',
    padding: 14,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  privacyText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.mintDeep,
    lineHeight: 16,
  },
  privacyTextBold: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  footer: {
    marginTop: 16,
  },
  bannerError: {
    backgroundColor: colors.status.rejected.bg,
    borderColor: colors.error,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  bannerTextError: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.error,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: fonts.bodySemiBold,
    fontSize: 14,
    color: colors.ink,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
});

export default IDUploadScreen;
