import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQuery } from '@tanstack/react-query';
import * as DocumentPicker from 'expo-document-picker';
import * as SecureStore from 'expo-secure-store';
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { authApi } from '../../api/auth';
import { ApiClientError } from '../../api/client';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/authTypes';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'IDUpload'>;
type IDUploadRouteProp = RouteProp<AuthStackParamList, 'IDUpload'>;

const IDUploadScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const route = useRoute<IDUploadRouteProp>();
  const { userId, role } = route.params;
  const userRole = role ?? 'worker';
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();
  const [banner, setBanner] = useState('');
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [selectedSelfie, setSelectedSelfie] = useState<any>(null);
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

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('user_id', userId.toString());
      form.append('role', userRole);

      form.append('id_file', {
        uri: selectedFile.uri,
        name: selectedFile.name ?? 'government-id.jpg',
        type: selectedFile.mimeType ?? 'image/jpeg',
      } as unknown as Blob);

      if (selectedSelfie) {
        form.append('selfie_file', {
          uri: selectedSelfie.uri,
          name: selectedSelfie.name ?? 'selfie.jpg',
          type: selectedSelfie.mimeType ?? 'image/jpeg',
        } as unknown as Blob);
      }

      await authApi.uploadId(form);
    },
    onSuccess: async () => {
      setBanner('');
      notifyAuthChanged();
      navigation.replace('PendingVerify' as any); // The mockup shows this goes to PendingVerification
    },
    onError: (err: unknown) => {
      if (err instanceof Error && err.message === 'PICK_CANCELLED') return;
      if (err instanceof ApiClientError) {
        if (err.status === 401 || err.status === 404) {
          setBanner('Authentication error. Please log in again.');
          setTimeout(() => navigation.replace('Login'), 2000);
        } else if (err.status === 413) {
          setBanner('File too large. Please choose a smaller image.');
        } else {
          setBanner(err.message || 'Upload failed. Please try again.');
        }
      } else if (err instanceof Error) {
        setBanner(`Upload failed: ${err.message}`);
      }
    },
  });

  const handleFileSelect = async (type: 'id' | 'selfie') => {
    setBanner('');
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: ['image/*'],
        copyToCacheDirectory: true,
      });

      if (!pick.canceled && pick.assets[0]) {
        const asset = pick.assets[0];
        if (asset.size && asset.size > MAX_SIZE_MB * 1024 * 1024) {
          showAlert('File Too Large', `Please choose an image under ${MAX_SIZE_MB}MB.`);
          return;
        }
        if (type === 'id') setSelectedFile(asset);
        else setSelectedSelfie(asset);
      }
    } catch (error) {
      console.log('File selection error:', error);
    }
  };

  const handleSubmit = () => {
    if (!selectedFile) {
      setBanner('Please upload your government ID to continue.');
      return;
    }
    // We only enforce selfie if the previous implementation did, but we'll enforce it to be safe
    if (!selectedSelfie) {
      setBanner('Please also upload a selfie holding your ID to continue.');
      return;
    }
    uploadMutation.mutate();
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={[styles.appBar, { paddingHorizontal: 26 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
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

        {/* ID Upload Box */}
        <TouchableOpacity
          style={styles.uploadArea}
          onPress={() => handleFileSelect('id')}
          disabled={uploadMutation.isPending}
        >
          <View style={styles.cameraIconBox}>
            <Ionicons name="camera" size={28} color={colors.white} />
          </View>
          <Text style={styles.uploadTitle}>
            {selectedFile ? 'ID Uploaded ✓' : 'Take a photo of your ID'}
          </Text>
          <Text style={styles.uploadSubtitle}>
            {selectedFile
              ? `${selectedFile.name}`
              : "PhilSys • Driver's License • Voter's ID\nPRC • Postal ID"}
          </Text>
        </TouchableOpacity>

        {/* Selfie Upload Box (Added for backend requirement) */}
        <TouchableOpacity
          style={[styles.uploadArea, { marginTop: 16 }]}
          onPress={() => handleFileSelect('selfie')}
          disabled={uploadMutation.isPending}
        >
          <View style={styles.cameraIconBox}>
            <Ionicons name="person" size={24} color={colors.white} />
          </View>
          <Text style={styles.uploadTitle}>
            {selectedSelfie ? 'Selfie Uploaded ✓' : 'Take a selfie holding your ID'}
          </Text>
          <Text style={styles.uploadSubtitle}>
            {selectedSelfie
              ? `${selectedSelfie.name}`
              : 'Please ensure your face and ID are clear.'}
          </Text>
        </TouchableOpacity>

        <View style={{ marginTop: 12 }}>
          <Button
            label="Choose from gallery"
            variant="ghost"
            onPress={() => handleFileSelect('id')}
          />
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
            disabled={!selectedFile || !selectedSelfie}
            loading={uploadMutation.isPending}
            onPress={handleSubmit}
          />
        </View>
      </ScrollView>
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
    backgroundColor: colors.white,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
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
  uploadArea: {
    backgroundColor: colors.peach,
    borderWidth: 2,
    borderColor: colors.peachBright,
    borderStyle: 'dashed',
    borderRadius: 20,
    paddingVertical: 32,
    paddingHorizontal: 18,
    alignItems: 'center',
    gap: 12,
  },
  cameraIconBox: {
    width: 56,
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  uploadSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 16,
  },
  privacyCard: {
    backgroundColor: colors.mint,
    borderRadius: 14,
    padding: 12,
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
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
    marginTop: 32,
  },
  bannerError: {
    backgroundColor: '#FEE2E2',
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
});

export default IDUploadScreen;
