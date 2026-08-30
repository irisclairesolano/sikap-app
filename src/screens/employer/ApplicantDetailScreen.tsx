import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { EmployerStackParamList } from '../../navigation/EmployerNavigator';
import { colors, fonts, shadows } from '../../theme';
import Button from '../../components/common/Button';
import { useJobRequest } from '../../hooks/useJobApplications';

type ApplicantDetailScreenRouteProp = RouteProp<EmployerStackParamList, 'ApplicantDetail'>;
type ApplicantDetailScreenNavigationProp = NativeStackNavigationProp<
  EmployerStackParamList,
  'ApplicantDetail'
>;

const ApplicantDetailScreen: React.FC = () => {
  const route = useRoute<ApplicantDetailScreenRouteProp>();
  const navigation = useNavigation<ApplicantDetailScreenNavigationProp>();
  const { applicantId, jobTitle, applicantName, status } = route.params;

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

  const { showAlert } = useAlert();
  const [isMenuVisible, setMenuVisible] = useState(false);

  const handleReport = () => {
    setMenuVisible(false);
    navigation.navigate('Report' as any, { id: applicantId, type: 'user' });
  };

  const isShortlisted =
    status === 'employer_requested' || status === 'accepted' || status === 'employer_confirmed';
  const isConfirmed = status === 'employer_confirmed';
  const isAccepted = status === 'accepted';
  const isPending = status === 'pending';
  const isCompleted = status === 'completed';

  const navigateToConfirmHire = () => {
    navigation.navigate('ConfirmHire', { applicantId, applicantName, jobTitle });
  };

  const navigateToSendRequest = () => {
    navigation.navigate('SendRequest', { id: applicantId, applicantName, jobTitle });
  };

  const navigateToCancelHire = () => {
    navigation.navigate('CancelHire', { id: applicantId, applicantName, jobTitle });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
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
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{applicantName.charAt(0)}</Text>
          </View>
          <View style={styles.profileInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.nameText}>{applicantName}</Text>
              <Ionicons name="checkmark-circle" size={18} color={colors.mintDeep} />
            </View>
            <Text style={styles.locationText}>
              <Ionicons name="location" size={12} color={colors.primary} />{' '}
              {route.params.barangay
                ? `${route.params.barangay}, ${route.params.municipality}`
                : 'Worker'}
            </Text>
          </View>
        </View>

        {/* Reputation Card */}
        <View style={styles.reputationCard}>
          <Text style={styles.reputationEyebrow}>Reputation</Text>
          <View style={styles.reputationRow}>
            <Text style={styles.reputationScore}>
              {route.params.reputationScore !== undefined && route.params.reputationScore !== null
                ? route.params.reputationScore
                : 'N/A'}
            </Text>
            <View style={styles.reputationStars}>
              <Text style={styles.reputationCount}>
                {route.params.reputationScore !== undefined && route.params.reputationScore !== null
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
              {route.params.experiences ? route.params.experiences.length : 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.mintDeep }]}>Jobs listed</Text>
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
            {!route.params.reviews || route.params.reviews.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No feedback reviews yet.
              </Text>
            ) : (
              route.params.reviews.map((rev: any) => (
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
        {route.params.bio ? (
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
              {route.params.bio}
            </Text>
          </View>
        ) : null}

        {/* Skills */}
        <View style={styles.skillsSection}>
          <Text style={styles.sectionEyebrow}>Skills</Text>
          <View style={styles.skillsList}>
            {!route.params.skills || route.params.skills.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No skills added yet.
              </Text>
            ) : (
              route.params.skills.map((skillName: string, index: number) => {
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
            {!route.params.experiences || route.params.experiences.length === 0 ? (
              <Text style={{ fontFamily: fonts.body, color: colors.inkMuted, fontSize: 13 }}>
                No work history added yet.
              </Text>
            ) : (
              route.params.experiences.map((exp: any) => (
                <View
                  key={exp.id}
                  style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
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
                    <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>
                      {exp.job_title}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.ink }}>
                      {exp.company}
                    </Text>
                    <Text style={{ fontFamily: fonts.body, fontSize: 12, color: colors.inkMuted }}>
                      {exp.duration}
                    </Text>
                  </View>
                </View>
              ))
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
          route.params.characterReferences &&
          route.params.characterReferences.length > 0 && (
            <View style={styles.skillsSection}>
              <Text style={styles.sectionEyebrow}>Character References</Text>
              <View style={{ marginTop: 10, gap: 12 }}>
                {route.params.characterReferences.map((ref: any) => (
                  <View
                    key={ref.id}
                    style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}
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
                      <Text style={{ fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink }}>
                        {ref.name}
                      </Text>
                      <Text style={{ fontFamily: fonts.body, fontSize: 13, color: colors.inkSoft }}>
                        {ref.relationship} · {ref.contact_number}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          )
        )}

        {/* Contact Info Visibility Guards */}
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
              Shortlist worker to review profile and hire to request contact information.
            </Text>
          </View>
        ) : status === 'pending_negotiation' || status === 'employer_confirmed' ? (
          <View style={styles.privacyShield}>
            <View style={styles.shieldHeader}>
              <View style={styles.shieldIcon}>
                <Ionicons name="lock-closed" size={16} color={colors.primary} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Contact Details Locked</Text>
                <Text style={styles.shieldSub}>Waiting for offer acceptance</Text>
              </View>
            </View>
            <Text style={styles.shieldDesc}>
              Direct phone number and emergency contacts will unlock once the worker accepts your
              hire offer.
            </Text>
          </View>
        ) : (
          <View style={[styles.privacyShield, { borderColor: colors.mintDeep }]}>
            <View style={styles.shieldHeader}>
              <View style={[styles.shieldIcon, { backgroundColor: colors.mint }]}>
                <Ionicons name="eye" size={16} color={colors.mintDeep} />
              </View>
              <View>
                <Text style={styles.shieldTitle}>Contact Details Unlocked</Text>
                <Text style={[styles.shieldSub, { color: colors.mintDeep }]}>
                  Hired worker contact details
                </Text>
              </View>
            </View>
            <View style={{ marginTop: 12, gap: 12 }}>
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
                    Phone
                  </Text>
                  <Text
                    style={{
                      fontFamily: fonts.bodyBold,
                      color: colors.ink,
                      fontSize: 15,
                      marginTop: 2,
                    }}
                  >
                    {route.params.phone || '0912 345 6789'}
                  </Text>
                </View>
                {route.params.phone ? (
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`tel:${route.params.phone}`)}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary + '10',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="call" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => Linking.openURL(`sms:${route.params.phone}`)}
                      style={{
                        padding: 8,
                        borderRadius: 10,
                        backgroundColor: colors.primary + '10',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Ionicons name="chatbox" size={16} color={colors.primary} />
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
              {route.params.emergencyContactName && (
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
                      Emergency Contact ({route.params.emergencyContactName})
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.bodyBold,
                        color: colors.ink,
                        fontSize: 15,
                        marginTop: 2,
                      }}
                    >
                      {route.params.emergencyContactPhone}
                    </Text>
                  </View>
                  {route.params.emergencyContactPhone ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => Linking.openURL(`tel:${route.params.emergencyContactPhone}`)}
                        style={{
                          padding: 8,
                          borderRadius: 10,
                          backgroundColor: colors.primary + '10',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Ionicons name="call" size={16} color={colors.primary} />
                      </TouchableOpacity>
                    </View>
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
          <Button
            label="Shortlist Applicant"
            variant="primary"
            size="lg"
            fullWidth
            onPress={navigateToSendRequest}
            icon={<Ionicons name="star" size={18} color="white" />}
          />
        )}
        {status === 'pending_negotiation' && (
          <View style={{ gap: 12 }}>
            <Button
              label="Proceed to Confirm Hire"
              variant="primary"
              size="lg"
              fullWidth
              icon={<Ionicons name="arrow-forward" size={18} color="white" />}
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
          <View style={{ gap: 12 }}>
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
            icon={<Ionicons name="star" size={18} color="white" />}
            onPress={() =>
              navigation.navigate('RateWorker', {
                id: applicantId,
                workerName: applicantName,
                jobTitle,
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
    padding: 20,
    paddingBottom: 24,
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
