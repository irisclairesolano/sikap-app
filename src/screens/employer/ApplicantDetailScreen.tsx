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
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { RouteProp, useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { useApplication } from '../../hooks/useJobApplications';
import { messagesApi } from '../../api/messages';
import { useAlert } from '../../contexts/AlertContext';
import { useConversations } from '../../hooks/useConversations';
import { useMessages } from '../../hooks/useMessages';

type ApplicantDetailScreenRouteProp = RouteProp<EmployerStackParamList, 'ApplicantDetail'>;
type ApplicantDetailScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ApplicantDetail'
>;

const ApplicantDetailScreen: React.FC = () => {
  const route = useRoute<ApplicantDetailScreenRouteProp>();
  const navigation = useNavigation<ApplicantDetailScreenNavigationProp>();
  const { showAlert } = useAlert();
  const [isMenuVisible, setMenuVisible] = useState(false);
  const [expandedExpIds, setExpandedExpIds] = useState<Record<number, boolean>>({});

  const rawAppId = route.params.applicantId || (route.params as any).applicationId;
  const appId = rawAppId ? Number(rawAppId) : 0;
  const {
    data: rawAppData,
    isLoading: queryLoading,
    isError,
    error,
    refetch,
  } = useApplication(appId);
  const appData = ((rawAppData as any)?.data ?? rawAppData) as any;

  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const status = appData?.status || route.params.status || 'pending';
  const applicantName = appData?.worker?.name || route.params.applicantName || 'Worker';
  const jobTitle = appData?.job?.title || route.params.jobTitle || 'Job';
  const coverNote = appData?.cover_note || (route.params as any)?.coverNote;
  const applicantId = appId;

  const barangay = appData?.worker?.barangay || route.params.barangay;
  const municipality = appData?.worker?.municipality || route.params.municipality;
  const reputationScore =
    appData?.worker?.reputation_score !== undefined && appData?.worker?.reputation_score !== null
      ? appData.worker.reputation_score
      : route.params.reputationScore;

  const formatScore = (val: number | string | undefined | null) => {
    if (val === undefined || val === null || val === '' || val === 'N/A') return 'N/A';
    const num = Number(val);
    if (isNaN(num) || num <= 0) return '0.0';
    if (num % 1 === 0) return num.toFixed(1);
    if (Number(num.toFixed(1)) === num) return num.toFixed(1);
    return Number(num.toFixed(2)).toString();
  };
  const experiences = appData?.worker?.experiences || route.params?.experiences || [];
  const reviews = appData?.worker?.reviews || route.params?.reviews || [];
  const bio = appData?.worker?.workerProfile?.bio || appData?.worker?.bio || route.params?.bio;
  const skills = appData?.worker?.skills || route.params?.skills || [];
  const characterReferences =
    appData?.worker?.character_references || route.params?.characterReferences || [];
  const phone = appData?.worker?.phone || route.params?.phone;
  const emergencyContactName =
    appData?.worker?.emergency_contact_name || route.params?.emergencyContactName;
  const emergencyContactPhone =
    appData?.worker?.emergency_contact_phone || route.params?.emergencyContactPhone;

  const { data: conversations } = useConversations('employer');
  const matchedConv = conversations?.find((c) => c.application_id === appId);
  const activeConversationId = appData?.conversation_id || matchedConv?.id || 0;

  const { data: messagesData } = useMessages(activeConversationId);
  const messages = messagesData?.messages || [];

  const hasRealMessageFromEmployer = messages.some(
    (m) =>
      m.sender_id !== null &&
      m.message_type !== 'action_card' &&
      m.message_type !== 'system' &&
      ((m.message_type === 'text' && Boolean(m.body?.trim())) || m.message_type === 'image'),
  );

  const handleOpenChat = async () => {
    try {
      if (activeConversationId) {
        navigation.navigate('Chat', {
          conversationId: activeConversationId,
          jobTitle: appData?.job?.title || jobTitle,
          otherUserName: applicantName,
        });
        return;
      }
      const res = await messagesApi.getConversations();
      const currentAppId = appData?.id ?? appId;
      const conv = res.data.find((c) => c.application_id === currentAppId);
      if (conv) {
        navigation.navigate('Chat', {
          conversationId: conv.id,
          jobTitle: conv.job_title || appData?.job?.title || jobTitle,
          otherUserName: conv.other_user?.name || applicantName,
        });
      }
    } catch {
      showAlert('Error', "Couldn't open chat. Please check your connection and try again.");
    }
  };

  if (queryLoading && !appData) {
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
        <Text
          style={{
            fontFamily: fonts.body,
            fontSize: 14,
            color: colors.inkMuted,
            marginTop: 12,
          }}
        >
          Loading applicant profile...
        </Text>
      </SafeAreaView>
    );
  }

  const hasFallbackInfo = Boolean(route.params.applicantName || route.params.jobTitle);

  if (isError && !appData && !hasFallbackInfo) {
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
        <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
        <Text
          style={{
            fontFamily: fonts.bodyBold,
            fontSize: 18,
            color: colors.ink,
            marginTop: 12,
            textAlign: 'center',
          }}
        >
          Failed to Load Profile
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
          {error?.message || 'Unable to retrieve applicant details.'}
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
          <Button
            label="Go Back"
            variant="outline"
            size="base"
            onPress={() => navigation.goBack()}
          />
          <Button label="Retry" variant="primary" size="base" onPress={() => refetch()} />
        </View>
      </SafeAreaView>
    );
  }

  if (!queryLoading && !appData && !route.params.applicantName) {
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

  const isReferencesLocked =
    appData?.references_locked ??
    appData?.worker?.references_locked ??
    (status === 'pending' || status === 'withdrawn' || stage === 1);

  const isContactLocked =
    appData?.contact_locked ??
    appData?.worker?.contact_locked ??
    (status === 'pending' || status === 'withdrawn' || stage === 1);

  const handleReport = () => {
    setMenuVisible(false);
    navigation.navigate('Report' as any, { id: applicantId, type: 'user' });
  };

  const navigateToConfirmHire = () => {
    if (!hasRealMessageFromEmployer) {
      showAlert(
        'Chat Required',
        'Please message the worker in chat to discuss and agree on terms before sending an offer.',
        [
          { text: 'Go to Chat', onPress: handleOpenChat },
          { text: 'Cancel', style: 'cancel' },
        ],
      );
      return;
    }

    navigation.navigate('ConfirmHire', {
      applicantId,
      applicantName: applicantName || 'Applicant',
      jobTitle: jobTitle || 'Job',
      barangay,
      municipality,
      reputationScore,
      conversationId: activeConversationId || undefined,
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

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={queryLoading}
            onRefresh={refetch}
            colors={[colors.primary, colors.primaryDark]}
            tintColor={colors.primary}
            progressBackgroundColor={colors.paperBright}
          />
        }
      >
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
          {(status === 'pending_negotiation' ||
            status === 'employer_confirmed' ||
            status === 'accepted') && (
            <TouchableOpacity
              style={styles.profileMessageBtn}
              onPress={handleOpenChat}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color={colors.primary} />
              <Text style={styles.profileMessageBtnText}>Message</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Applicant Cover Note */}
        {!!coverNote && (
          <View
            style={{
              backgroundColor: colors.paperBright,
              borderRadius: 16,
              padding: 16,
              marginBottom: 16,
              borderWidth: 1,
              borderColor: colors.inkFaint,
              ...shadows.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <Ionicons name="document-text-outline" size={16} color={colors.primary} />
              <Text
                style={{
                  fontFamily: fonts.bodyBold,
                  fontSize: 12,
                  color: colors.inkSoft,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Applicant's Cover Note
              </Text>
            </View>
            <Text
              style={{
                fontFamily: fonts.body,
                fontSize: 14,
                color: colors.ink,
                lineHeight: 20,
              }}
            >
              {coverNote}
            </Text>
          </View>
        )}

        {/* Reputation Card - Macaron Peach */}
        <View style={styles.reputationCardWrapper}>
          <View style={styles.reputationCard}>
            <View style={styles.reputationHeaderRow}>
              <View style={styles.reputationBadge}>
                <Ionicons name="shield-checkmark" size={13} color={colors.primaryDark} />
              </View>
              <Text style={styles.reputationEyebrow}>Worker Reputation</Text>
            </View>
            <View style={styles.reputationRow}>
              <Text style={styles.reputationScore}>
                {reputationScore !== undefined && reputationScore !== null
                  ? formatScore(reputationScore)
                  : 'N/A'}
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
        </View>

        {/* Stats Grid - Macaron Colors */}
        <View style={styles.statsWrapper}>
          <View style={styles.statsGrid}>
            <View style={[styles.statBox, { backgroundColor: colors.mint }]}>
              <View
                style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.65)' }]}
              >
                <Ionicons name="checkmark-done-outline" size={18} color={colors.mintDeep} />
              </View>
              <Text style={[styles.statValue, { color: colors.mintDeep }]}>
                {appData?.worker?.completed_jobs_count ?? 0}
              </Text>
              <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Completed Jobs</Text>
            </View>

            <View style={[styles.statBox, { backgroundColor: colors.sky }]}>
              <View
                style={[styles.statIconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.65)' }]}
              >
                <Ionicons name="shield-outline" size={18} color={colors.skyDeep} />
              </View>
              <Text style={[styles.statValue, { color: colors.skyDeep }]}>Active</Text>
              <Text style={[styles.statLabel, { color: colors.skyDeep }]}>Worker Status</Text>
            </View>
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
                const isEven = index % 2 === 0;
                const chipBg = isEven ? '#F8FAFC' : '#F1F5F9';
                const chipBorder = isEven ? '#E2E8F0' : '#CBD5E1';
                const chipTextColor = '#334155';
                const iconColor = '#64748B';

                return (
                  <View
                    key={index}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: chipBg,
                        borderWidth: 1,
                        borderColor: chipBorder,
                      },
                    ]}
                  >
                    <Ionicons name="construct-outline" size={13} color={iconColor} />
                    <Text style={[styles.chipText, { color: chipTextColor }]}>{skillName}</Text>
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
        {isReferencesLocked ? (
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
        {isContactLocked ? (
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
              Shortlist worker to unlock direct phone numbers, in-app chat, and character references
              for negotiation.
            </Text>
          </View>
        ) : (
          <View style={[styles.privacyShield, { borderColor: colors.mintDeep }]}>
            <View style={styles.shieldHeader}>
              <View style={[styles.shieldIcon, { backgroundColor: colors.mint }]}>
                <Ionicons name="call" size={16} color={colors.mintDeep} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Contact Details</Text>
                <Text style={[styles.shieldSub, { color: colors.mintDeep }]}>
                  {stage >= 4 ? 'Hired worker contact number' : 'Direct contact number'}
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
              label="Shortlist"
              variant="primary"
              size="lg"
              fullWidth
              onPress={navigateToSendRequest}
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
            {hasRealMessageFromEmployer ? (
              <Button
                label="Send Offer"
                variant="primary"
                size="lg"
                fullWidth
                onPress={navigateToConfirmHire}
              />
            ) : (
              <Button
                label="Chat to Agree on Price"
                variant="primary"
                size="lg"
                fullWidth
                onPress={handleOpenChat}
              />
            )}
            <Button
              label="Cancel"
              variant="ghost"
              size="base"
              fullWidth
              onPress={navigateToCancelHire}
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
              {hasRealMessageFromEmployer
                ? 'Send a formal price offer. The worker must accept before the hire is confirmed.'
                : 'Send a message in chat to discuss details and agree on price before making an offer.'}
            </Text>
          </View>
        )}
        {status === 'employer_confirmed' && (
          <View style={{ gap: 6 }}>
            <Button label="Waiting for worker..." variant="outline" size="lg" fullWidth disabled />
          </View>
        )}
        {status === 'accepted' && (
          <View style={{ gap: 12 }}>
            <Button
              label="Mark Complete"
              variant="primary"
              size="lg"
              fullWidth
              onPress={() => {
                const jobId = appData?.job?.id || (appData as any)?.job_id;
                if (jobId) {
                  navigation.navigate('MarkComplete', {
                    id: jobId,
                    jobTitle: jobTitle || appData?.job?.title || 'Job',
                  });
                } else {
                  navigation.navigate('RateWorker', {
                    id: applicantId,
                    workerName: applicantName || 'Worker',
                    jobTitle: jobTitle || 'Job',
                  });
                }
              }}
            />
          </View>
        )}
        {status === 'completed' && (
          <Button
            label="Rate"
            variant="primary"
            size="lg"
            fullWidth
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
  profileMessageBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.primaryTint,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  profileMessageBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primary,
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
  reputationCardWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  reputationCard: {
    backgroundColor: colors.peach,
    borderRadius: 20,
    padding: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reputationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reputationBadge: {
    width: 22,
    height: 22,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reputationEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  reputationRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  reputationScore: {
    fontFamily: fonts.numericBold,
    fontSize: 48,
    lineHeight: 56,
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
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 10,
  },
  statsWrapper: {
    marginBottom: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 16,
    alignItems: 'center',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: fonts.numericBold,
    fontSize: 20,
    marginTop: 6,
  },
  statLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: 3,
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
