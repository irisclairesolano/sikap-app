import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useApplication } from '../../hooks/useJobApplications';
import { parseContactPlatforms } from '../common/ManageContactPlatformsScreen';

type ApplicantDetailScreenRouteProp = RouteProp<EmployerStackParamList, 'ApplicantDetail'>;
type ApplicantDetailScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ApplicantDetail'
>;

const ApplicantDetailScreen: React.FC = () => {
  const route = useRoute<ApplicantDetailScreenRouteProp>();
  const navigation = useNavigation<ApplicantDetailScreenNavigationProp>();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [expandedExpIds, setExpandedExpIds] = useState<Record<number, boolean>>({});

  const appId = route.params.applicantId || (route.params as any).applicationId;
  const { data: appData, isLoading: queryLoading, refetch } = useApplication(appId);

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const status = appData?.status || route.params.status;
  const applicantName = appData?.worker?.name || route.params.applicantName;
  const jobTitle = appData?.job?.title || route.params.jobTitle;
  const applicantId = appId;

  const barangay = appData?.worker?.barangay || route.params.barangay;
  const municipality = appData?.worker?.municipality || route.params.municipality;
  const reputationScore =
    appData?.worker?.reputation_score !== undefined && appData?.worker?.reputation_score !== null
      ? appData.worker.reputation_score
      : route.params.reputationScore;
  const experiences = appData?.worker?.experiences || route.params?.experiences;
  const reviews = appData?.worker?.reviews || route.params?.reviews;
  const bio = appData?.worker?.workerProfile?.bio || appData?.worker?.bio || route.params?.bio;
  const skills = appData?.worker?.skills || route.params?.skills;
  const characterReferences =
    appData?.worker?.character_references || route.params?.characterReferences;
  const phone = appData?.worker?.phone || route.params?.phone;
  const emergencyContactName =
    appData?.worker?.emergency_contact_name || route.params?.emergencyContactName;
  const emergencyContactPhone =
    appData?.worker?.emergency_contact_phone || route.params?.emergencyContactPhone;

  if (queryLoading && !applicantName) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!queryLoading && !appData && !applicantName) {
    return (
      <SafeAreaView
        style={{
          flex: 1,
          backgroundColor: colors.paper,
          justifyContent: 'center',
          alignItems: 'center',
          padding: 24,
        }}
      >
        <Ionicons name="alert-circle-outline" size={48} color={colors.primary} />
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 18,
            color: colors.ink,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Applicant Not Found
        </Text>
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.inkMuted,
            marginTop: 4,
            textAlign: 'center',
          }}
        >
          This application details may no longer be available.
        </Text>
        <Button
          label="Go Back"
          variant="outline"
          size="base"
          onPress={() => navigation.goBack()}
          style={{ marginTop: 20 }}
        />
      </SafeAreaView>
    );
  }

  const getStage = () => {
    switch (status) {
      case 'pending':
        return 1;
      case 'shortlisted':
      case 'pending_negotiation':
      case 'employer_requested':
        return 2;
      case 'employer_confirmed':
        return 3;
      case 'accepted':
        return 4;
      case 'completed':
        return 5;
      default:
        return 1;
    }
  };

  const stage = getStage();

  const handleReport = () => {
    setMenuVisible(false);
    navigation.navigate('Report' as any, { id: applicantId, type: 'user' });
  };

  const navigateToConfirmHire = () => {
    navigation.navigate('ConfirmHire', {
      applicantId,
      applicantName: applicantName || 'Applicant',
      jobTitle: jobTitle || 'Job',
    });
  };

  const navigateToSendRequest = () => {
    navigation.navigate('SendRequest', {
      id: applicantId,
      applicantName: applicantName || 'Applicant',
      jobTitle: jobTitle || 'Job',
    });
  };

  const navigateToCancelHire = () => {
    navigation.navigate('CancelHire', {
      id: applicantId,
      applicantName: applicantName || 'Applicant',
      jobTitle: jobTitle || 'Job',
    });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerPill}>
          <Text style={styles.headerPillText}>Applicant profile</Text>
        </View>
        <TouchableOpacity style={styles.iconBtn} onPress={() => setMenuVisible(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* 5-Stage Tracker */}
        <View style={styles.stages}>
          <View style={stage >= 1 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 2 ? styles.stageDone : stage === 1 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 2 ? (
                <Ionicons name="checkmark" size={12} color="white" />
              ) : (
                <Text style={stage === 1 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  1
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Applied</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 2 && styles.stageDoneDivider]} />

          <View style={stage >= 2 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 3 ? styles.stageDone : stage === 2 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 3 ? (
                <Ionicons name="checkmark" size={12} color="white" />
              ) : (
                <Text style={stage === 2 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  2
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Shortlist</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 3 && styles.stageDoneDivider]} />

          <View style={stage >= 3 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 4 ? styles.stageDone : stage === 3 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 4 ? (
                <Ionicons name="checkmark" size={12} color="white" />
              ) : (
                <Text style={stage === 3 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  3
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Offer</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 4 && styles.stageDoneDivider]} />

          <View style={stage >= 4 ? styles.stageActive : styles.stage}>
            <View
              style={[
                styles.stageCircle,
                stage >= 5 ? styles.stageDone : stage === 4 ? styles.stageCircleActive : null,
              ]}
            >
              {stage >= 5 ? (
                <Ionicons name="checkmark" size={12} color="white" />
              ) : (
                <Text style={stage === 4 ? styles.stageCircleTextActive : styles.stageCircleText}>
                  4
                </Text>
              )}
            </View>
            <Text style={styles.stageLabel}>Hired</Text>
          </View>
          <View style={[styles.stageDivider, stage >= 5 && styles.stageDoneDivider]} />

          <View style={stage >= 5 ? styles.stageActive : styles.stage}>
            <View style={[styles.stageCircle, stage === 5 ? styles.stageCircleActive : null]}>
              <Text style={stage === 5 ? styles.stageCircleTextActive : styles.stageCircleText}>
                5
              </Text>
            </View>
            <Text style={styles.stageLabel}>Done</Text>
          </View>
        </View>

        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar url={appData?.worker?.avatar_url} name={applicantName || 'Worker'} size={52} />
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{applicantName}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} />
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={12} color={colors.primary} />{' '}
              {barangay ? `${barangay}, ${municipality}` : 'Worker'}
            </Text>
          </View>
        </View>

        {/* Reputation Card */}
        <View style={styles.reputationCard}>
          <Text style={styles.reputationEyebrow}>Reputation</Text>
          <View style={styles.reputationRow}>
            <Text style={styles.reputationScore}>
              {reputationScore !== undefined && reputationScore !== null ? reputationScore : 'N/A'}
            </Text>
            <View style={styles.reputationStars}>
              <Text style={styles.reputationCount}>
                {reputationScore !== undefined && reputationScore !== null
                  ? 'Reputation Score'
                  : 'No ratings yet'}
              </Text>
            </View>
          </View>
          <Text style={styles.reputationTagline}>Their score travels with them.</Text>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={[styles.statBox, { backgroundColor: colors.mint }]}>
            <Text style={[styles.statValue, { color: colors.mintDeep }]}>
              {appData?.worker?.completed_jobs_count ?? 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Completed Jobs</Text>
          </View>
          <View style={[styles.statBox, { backgroundColor: colors.sky }]}>
            <Text style={[styles.statValue, { color: colors.skyDeep }]}>Active</Text>
            <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Worker</Text>
          </View>
        </View>

        {/* Worker Reviews List */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionEyebrow}>Employer Reviews</Text>
          <View style={{ marginTop: 10, gap: 12 }}>
            {!reviews || reviews.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No feedback reviews yet.
              </Text>
            ) : (
              reviews.map((rev: any) => (
                <View
                  key={rev.id}
                  style={{
                    backgroundColor: colors.paperBright,
                    padding: 14,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: colors.inkFaint,
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      flexDirection: 'row',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>
                      {rev.reviewer_name}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                      {rev.created_at}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                    <Ionicons
                      name="star"
                      size={14}
                      color={colors.butter}
                      style={{
                        textShadowColor: 'rgba(0,0,0,0.1)',
                        textShadowOffset: { width: 0, height: 1 },
                        textShadowRadius: 1,
                      }}
                    />
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink }}>
                      {rev.overall_rating} / 5.0
                    </Text>
                  </View>
                  {rev.comment ? (
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        fontSize: 13,
                        color: colors.inkSoft,
                        marginTop: 4,
                        lineHeight: 18,
                      }}
                    >
                      "{rev.comment}"
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        </View>

        {/* About Me */}
        {bio ? (
          <View style={styles.skillsSection}>
            <Text style={styles.sectionEyebrow}>About Me</Text>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.ink,
                marginTop: 4,
                lineHeight: 22,
              }}
            >
              {bio}
            </Text>
          </View>
        ) : null}

        {/* Skills */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionEyebrow}>Skills</Text>
          <View style={styles.skillsList}>
            {!skills || skills.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No skills added yet.
              </Text>
            ) : (
              skills.map((skillName: string, index: number) => {
                const bgColors = [colors.peach, colors.mint, colors.butter, colors.sky];
                const textColors = [
                  colors.primaryDark,
                  colors.mintDeep,
                  colors.ink,
                  colors.skyDeep,
                ];
                const icons = ['hammer', 'construct', 'brush', 'water'] as const;
                const colorIdx = index % 4;

                return (
                  <View key={index} style={[styles.chip, { backgroundColor: bgColors[colorIdx] }]}>
                    <Ionicons name={icons[colorIdx]} size={14} color={textColors[colorIdx]} />
                    <Text style={[styles.chipText, { color: textColors[colorIdx] }]}>
                      {skillName}
                    </Text>
                  </View>
                );
              })
            )}
          </View>
        </View>

        {/* Work History */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionEyebrow}>Work History</Text>
          <View style={{ marginTop: 10, gap: 12 }}>
            {!experiences || experiences.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No work history added yet.
              </Text>
            ) : (
              experiences.map((exp: any) => {
                const isExpanded = !!expandedExpIds[exp.id];
                return (
                  <TouchableOpacity
                    key={exp.id}
                    activeOpacity={0.7}
                    onPress={() => {
                      setExpandedExpIds((prev) => ({ ...prev, [exp.id]: !prev[exp.id] }));
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'flex-start',
                      gap: 12,
                      padding: 12,
                      backgroundColor: colors.paperBright,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: colors.inkFaint,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: colors.butter,
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="briefcase" size={18} color={colors.inkSoft} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <View
                        style={{
                          flexDirection: 'row',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: fonts.bodyBold,
                            fontSize: 14,
                            color: colors.ink,
                            flex: 1,
                          }}
                        >
                          {exp.job_title}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={16}
                          color={colors.inkMuted}
                          style={{ marginLeft: 6 }}
                        />
                      </View>
                      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                        {exp.company || exp.employer_name}
                      </Text>
                      <Text
                        style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}
                      >
                        {exp.duration}
                      </Text>
                      {isExpanded && exp.description ? (
                        <Text
                          style={{
                            fontFamily: fonts.body,
                            fontSize: 13,
                            color: colors.inkSoft,
                            marginTop: 8,
                            paddingTop: 8,
                            borderTopWidth: 1,
                            borderTopColor: colors.inkFaint,
                            lineHeight: 18,
                          }}
                        >
                          {exp.description}
                        </Text>
                      ) : null}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </View>
        </View>
        {/* Character References */}
        {status === 'pending' || status === 'withdrawn' ? (
          <View style={styles.skillsSection}>
            <Text style={styles.sectionEyebrow}>Character References</Text>
            <View style={styles.privacyShield}>
              <View style={styles.shieldHeader}>
                <View style={styles.shieldIcon}>
                  <Ionicons name="lock-closed" size={16} color={colors.primary} />
                </View>
                <View>
                  <Text style={styles.shieldTitle}>References Locked</Text>
                  <Text style={styles.shieldSub}>Shortlist worker to unlock references</Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.skillsSection}>
            <Text style={styles.sectionEyebrow}>Character References</Text>
            <View style={{ marginTop: 10, gap: 12 }}>
              {!characterReferences || characterReferences.length === 0 ? (
                <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                  No character references listed by worker.
                </Text>
              ) : (
                characterReferences.map((ref: any) => {
                  const refPhone =
                    ref.contact_number || ref.phone || ref.contactNumber || ref.number;
                  return (
                    <View
                      key={ref.id || ref.name}
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: colors.paperBright,
                        padding: 12,
                        borderRadius: 14,
                        borderWidth: 1,
                        borderColor: colors.inkFaint,
                      }}
                    >
                      <View
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}
                      >
                        <View
                          style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: colors.peach,
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Ionicons name="person" size={18} color={colors.primary} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}
                          >
                            {ref.name}
                          </Text>
                          <Text
                            style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}
                          >
                            {ref.relationship} {refPhone ? `· ${refPhone}` : ''}
                          </Text>
                        </View>
                      </View>
                      {refPhone ? (
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                          <TouchableOpacity
                            onPress={() => Linking.openURL(`tel:${refPhone}`)}
                            style={{
                              padding: 8,
                              borderRadius: 10,
                              backgroundColor: colors.primary + '15',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="call" size={16} color={colors.primary} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => Linking.openURL(`sms:${refPhone}`)}
                            style={{
                              padding: 8,
                              borderRadius: 10,
                              backgroundColor: colors.primary + '15',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Ionicons name="chatbox" size={16} color={colors.primary} />
                          </TouchableOpacity>
                        </View>
                      ) : null}
                    </View>
                  );
                })
              )}
            </View>
          </View>
        )}

        {/* Contact Info & Direct Communication Channels */}
        {status === 'pending' || status === 'withdrawn' ? (
          <View style={styles.privacyShield}>
            <View style={styles.shieldHeader}>
              <View style={styles.shieldIcon}>
                <Ionicons name="lock-closed" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Privacy Shield Active</Text>
                <Text style={styles.shieldSub}>Contact details hidden</Text>
              </View>
            </View>
            <Text style={styles.shieldDesc}>
              Shortlist worker to unlock direct phone numbers, communication channels, and character
              references for negotiation.
            </Text>
          </View>
        ) : (
          <View style={[styles.privacyShield, { borderColor: colors.mintDeep }]}>
            <View style={styles.shieldHeader}>
              <View style={[styles.shieldIcon, { backgroundColor: colors.mint }]}>
                <Ionicons name="call" size={16} color={colors.mintDeep} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Contact Details & Channels</Text>
                <Text style={[styles.shieldSub, { color: colors.mintDeep }]}>
                  {stage >= 4 ? 'Hired worker contact details' : 'Direct negotiation channels'}
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12, gap: 12 }}>
              {/* Direct Phone */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <View>
                  <Text
                    style={{
                      fontFamily: fonts.body,
                      color: colors.inkSoft,
                      fontSize: 11,
                      textTransform: 'uppercase',
                    }}
                  >
                    Phone Number
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyBold,
                      color: colors.ink,
                      fontSize: 15,
                      marginTop: 2,
                    }}
                  >
                    {phone || 'Not provided'}
                  </Text>
                </View>
                {phone ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${phone}`)}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="call" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`sms:${phone}`)}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="chatbox" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>

              {/* Communication Platforms (Viber, WhatsApp, Telegram, etc.) */}
              {(() => {
                const platforms = parseContactPlatforms(
                  (appData?.worker as any)?.contact_platforms ||
                    (route.params as any)?.contact_platforms,
                );
                if (platforms.length === 0) return null;

                const openPlatformLink = (platform: string, val: string) => {
                  const cleanVal = val.trim();
                  if (platform.toLowerCase() === 'whatsapp') {
                    const cleanPhone = cleanVal.replace(/[^0-9]/g, '');
                    Linking.openURL(`https://wa.me/${cleanPhone}`);
                  } else if (platform.toLowerCase() === 'viber') {
                    Linking.openURL(`viber://chat?number=${cleanVal}`);
                  } else if (platform.toLowerCase() === 'telegram') {
                    const cleanUsername = cleanVal.replace(/^@/, '');
                    Linking.openURL(`https://t.me/${cleanUsername}`);
                  } else if (
                    platform.toLowerCase() === 'facebook' ||
                    platform.toLowerCase() === 'messenger'
                  ) {
                    Linking.openURL(
                      cleanVal.startsWith('http') ? cleanVal : `https://m.me/${cleanVal}`,
                    );
                  } else if (cleanVal.startsWith('http')) {
                    Linking.openURL(cleanVal);
                  } else {
                    Linking.openURL(`sms:${cleanVal}`);
                  }
                };

                return (
                  <View
                    style={{
                      borderTopWidth: 1,
                      borderTopColor: colors.inkFaint,
                      paddingTop: 10,
                      gap: 8,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        color: colors.inkSoft,
                        fontSize: 11,
                        textTransform: 'uppercase',
                      }}
                    >
                      Preferred Communication Platforms
                    </Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                      {platforms.map((p, idx) => (
                        <TouchableOpacity
                          key={idx}
                          onPress={() => openPlatformLink(p.platform, p.value)}
                          style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 6,
                            paddingVertical: 6,
                            paddingHorizontal: 10,
                            borderRadius: 10,
                            backgroundColor: colors.paperBright,
                            borderWidth: 1,
                            borderColor: colors.mint,
                          }}
                        >
                          <Ionicons name="chatbubble-ellipses" size={14} color={colors.mintDeep} />
                          <Text
                            style={{ fontFamily: fonts.bodyBold, fontSize: 12, color: colors.ink }}
                          >
                            {p.platform}: {p.value}
                          </Text>
                          <Ionicons name="open-outline" size={12} color={colors.inkSoft} />
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                );
              })()}

              {/* Emergency Contact (Stage 4+) */}
              {emergencyContactName && (
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    borderTopWidth: 1,
                    borderTopColor: colors.inkFaint,
                    paddingTop: 10,
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.body,
                        color: colors.inkSoft,
                        fontSize: 11,
                        textTransform: 'uppercase',
                      }}
                    >
                      Emergency Contact ({emergencyContactName})
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        color: colors.ink,
                        fontSize: 15,
                        marginTop: 2,
                      }}
                    >
                      {emergencyContactPhone}
                    </Text>
                  </View>
                  {emergencyContactPhone ? (
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${emergencyContactPhone}`)}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary + '15',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="call" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              )}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Fixed Bottom Action */}
      <View style={styles.footer}>
        {status === 'pending' && (
          <View style={{ gap: 6 }}>
            <Button
              label="Shortlist applicant"
              variant="primary"
              size="lg"
              fullWidth
              onPress={navigateToSendRequest}
              icon="star"
            />
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.inkSoft,
                textAlign: 'center',
                marginTop: 2,
              }}
            >
              Shortlisting allows you to view contact info, negotiate details, and confirm the hire.
            </Text>
          </View>
        )}
        {status === 'pending_negotiation' && (
          <View style={{ gap: 6 }}>
            <Button
              label="Proceed to Confirm Hire"
              variant="primary"
              size="lg"
              fullWidth
              icon="arrow-forward"
              onPress={navigateToConfirmHire}
            />
            <Button
              label="Cancel Hire"
              variant="ghost"
              size="base"
              fullWidth
              onPress={navigateToCancelHire}
            />
          </View>
        )}
        {status === 'employer_confirmed' && (
          <View style={{ gap: 6 }}>
            <Button label="Waiting for worker..." variant="outline" size="lg" fullWidth disabled />
            <Button
              label="Cancel Hire"
              variant="ghost"
              size="base"
              fullWidth
              onPress={navigateToCancelHire}
            />
          </View>
        )}
        {status === 'accepted' && (
          <Button label="Job is in progress" variant="outline" size="lg" fullWidth disabled />
        )}
        {status === 'completed' && (
          <Button
            label="Rate Worker"
            variant="primary"
            size="lg"
            fullWidth
            icon="star"
            onPress={() =>
              navigation.navigate('RateWorker', {
                id: applicantId,
                workerName: applicantName || 'Worker',
                jobTitle: jobTitle || 'Job',
              })
            }
          />
        )}
      </View>

      <Modal visible={isMenuVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setMenuVisible(false)}
        >
          <View style={styles.menuContainer}>
            <TouchableOpacity style={styles.menuOption} onPress={handleReport}>
              <Ionicons name="flag-outline" size={20} color={colors.error} />
              <Text style={[styles.menuOptionText, { color: colors.error }]}>Report Applicant</Text>
            </TouchableOpacity>
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
    paddingVertical: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerPill: {
    backgroundColor: colors.paperBright,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 20,
    ...shadows.sm,
  },
  headerPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkMuted,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 20,
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: fonts.bodyBold,
    fontSize: 24,
    color: colors.primaryDark,
  },
  profileInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontFamily: fonts.bodyBold,
    fontSize: 20,
    letterSpacing: -0.5,
    color: colors.ink,
  },
  locationText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  verifiedBadge: {
    backgroundColor: colors.mint,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  verifiedBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.mintDeep,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reputationCard: {
    backgroundColor: colors.peach,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  reputationEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reputationScore: {
    fontFamily: fonts.bodyBold,
    fontSize: 52,
    lineHeight: 60,
    color: colors.ink,
  },
  reputationStars: {
    alignItems: 'flex-end',
    paddingBottom: 6,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
  },
  reputationCount: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkSoft,
    marginTop: 4,
  },
  reputationTagline: {
    fontFamily: fonts.displayItalic,
    fontSize: 14,
    color: colors.primaryDark,
    marginTop: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 18,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  skillsSection: {
    marginBottom: 24,
  },
  sectionEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  skillsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  chipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
  },
  privacyShield: {
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    borderRadius: 16,
    padding: 16,
    backgroundColor: colors.paperBright,
  },
  shieldHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  shieldIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  shieldSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.primary,
  },
  shieldDesc: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 4,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: colors.paper,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  menuContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    marginTop: 60,
    marginRight: 16,
    width: 220,
    ...shadows.base,
  },
  menuOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuOptionText: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  stages: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
    backgroundColor: colors.paperBright,
    padding: 16,
    borderRadius: 16,
    ...shadows.sm,
  },
  stage: { alignItems: 'center', opacity: 0.5 },
  stageActive: { alignItems: 'center', opacity: 1 },
  stageCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.inkFaint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  stageCircleActive: { borderColor: colors.primary, backgroundColor: colors.primary },
  stageDone: { borderColor: colors.mintDeep, backgroundColor: colors.mintDeep, borderWidth: 0 },
  stageCircleText: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.inkMuted },
  stageCircleTextActive: { fontFamily: fonts.bodyBold, fontSize: 10, color: 'white' },
  stageLabel: { fontFamily: fonts.bodyBold, fontSize: 10, color: colors.ink },
  stageDivider: {
    height: 2,
    flex: 1,
    backgroundColor: colors.inkFaint,
    marginHorizontal: 8,
    marginBottom: 16,
  },
  stageDoneDivider: { backgroundColor: colors.mintDeep },
});

export default ApplicantDetailScreen;
