import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRoute, useNavigation, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, fonts, shadows } from '../../theme';
import { WorkerStackParamList } from '../../navigation/WorkerNavigator';
import { Avatar } from '../../components/common/Avatar';
import { MediaViewerModal } from '../../components/common/MediaViewerModal';

type EmployerPublicProfileRouteProp = RouteProp<WorkerStackParamList, 'EmployerPublicProfile'>;

export const EmployerPublicProfileScreen: React.FC = () => {
  const route = useRoute<EmployerPublicProfileRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<WorkerStackParamList>>();
  const {
    employerName,
    avatarUrl,
    verificationBadge,
    reputationScore,
    barangay,
    municipality,
    businessDocuments,
  } = route.params;

  const [viewerMedia, setViewerMedia] = useState<{ type: 'photo' | 'video'; url: string } | null>(
    null,
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Employer Profile</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Header Card */}
        <View style={styles.profileHeaderCard}>
          {avatarUrl ? (
            <Image
              cachePolicy="memory-disk"
              source={{ uri: avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Avatar name={employerName || 'Employer'} size={72} />
          )}

          <View style={styles.nameRow}>
            <Text style={styles.employerName}>{employerName || 'Employer'}</Text>
            {verificationBadge && (
              <Ionicons
                name="checkmark-circle"
                size={20}
                color={colors.mintDeep}
                style={{ marginLeft: 4 }}
              />
            )}
          </View>

          {verificationBadge ? (
            <View style={styles.verifiedChip}>
              <Ionicons name="shield-checkmark" size={14} color={colors.mintDeep} />
              <Text style={styles.verifiedText}>Verified Employer</Text>
            </View>
          ) : (
            <View style={styles.unverifiedChip}>
              <Ionicons name="time-outline" size={14} color={colors.inkMuted} />
              <Text style={styles.unverifiedText}>Pending Verification</Text>
            </View>
          )}

          {/* Location */}
          {(barangay || municipality) && (
            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={16} color={colors.inkSoft} />
              <Text style={styles.locationText}>
                {[barangay, municipality].filter(Boolean).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Reputation Score Card */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Employer Reputation</Text>
          <View style={styles.reputationCard}>
            <View style={styles.scoreHeroRow}>
              <Text style={styles.bigScore}>
                {reputationScore ? Number(reputationScore).toFixed(1) : '5.0'}
              </Text>
              <View style={{ gap: 4 }}>
                <View style={{ flexDirection: 'row', gap: 3 }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Ionicons key={s} name="star" size={18} color={colors.gold} />
                  ))}
                </View>
                <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkSoft }}>
                  Overall Employer Rating
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Verification & Business Documents */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Verification & Documents</Text>
          <View style={styles.docCard}>
            <View style={styles.docHeader}>
              <Ionicons
                name={verificationBadge ? 'ribbon' : 'document-text-outline'}
                size={20}
                color={verificationBadge ? colors.primary : colors.inkSoft}
              />
              <Text style={styles.docTitle}>
                {verificationBadge
                  ? 'Business License & Documents Verified'
                  : 'Submitted Documents'}
              </Text>
            </View>
            <Text style={styles.docDesc}>
              {verificationBadge
                ? 'This employer has completed identity and business permit checks with SIKAP Admins.'
                : 'Permits and identity documents are reviewed by SIKAP administrators.'}
            </Text>

            {businessDocuments && businessDocuments.length > 0 && (
              <View style={styles.docList}>
                <Text style={styles.docSubheader}>Attached Business Documents:</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 10, paddingTop: 8 }}
                >
                  {businessDocuments.map((docUrl, idx) => (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      onPress={() => setViewerMedia({ type: 'photo', url: docUrl })}
                      style={styles.docThumb}
                    >
                      <Image
                        cachePolicy="memory-disk"
                        source={{ uri: docUrl }}
                        style={styles.docImage}
                      />
                      <View style={styles.expandOverlay}>
                        <Ionicons name="expand-outline" size={12} color={colors.white} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        </View>

        {/* Worker Reviews & Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reviews & Feedback</Text>
          <View style={styles.emptyReviewsCard}>
            <Ionicons
              name="chatbox-outline"
              size={32}
              color={colors.inkMuted}
              style={{ marginBottom: 6 }}
            />
            <Text style={styles.emptyReviewsTitle}>No reviews yet</Text>
            <Text style={styles.emptyReviewsSubtitle}>
              Reviews from workers who have completed jobs with {employerName || 'this employer'}{' '}
              will appear here once submitted.
            </Text>
          </View>
        </View>
      </ScrollView>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appBarTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  profileHeaderCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    marginTop: 8,
    ...shadows.sm,
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.inkFaint,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  employerName: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
    color: colors.ink,
  },
  verifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.mint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
    marginTop: 8,
  },
  verifiedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.mintDeep,
  },
  unverifiedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inkFaint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    gap: 4,
    marginTop: 8,
  },
  unverifiedText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  reputationCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 10,
  },
  docCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  docHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  docTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  docDesc: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  docList: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  docSubheader: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'uppercase',
  },
  docThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.inkFaint,
  },
  docImage: {
    width: '100%',
    height: '100%',
  },
  expandOverlay: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 3,
    borderRadius: 6,
  },
  scoreHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  bigScore: {
    fontFamily: fonts.numericBold,
    fontSize: 36,
    color: colors.ink,
  },
  emptyReviewsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderStyle: 'dashed',
  },
  emptyReviewsTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 4,
  },
  emptyReviewsSubtitle: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default EmployerPublicProfileScreen;
