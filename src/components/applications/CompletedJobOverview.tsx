import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import { Avatar } from '../common/Avatar';
import { Application, JobPost } from '../../types';

export interface CompletedJobOverviewProps {
  viewerRole: 'employer' | 'worker';
  application?: Application | null;
  job?: JobPost | null;
  onOpenChat?: () => void;
  onViewProfile?: () => void;
}

const formatDate = (dateString?: string | null): string => {
  if (!dateString) return '';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
};

const formatScore = (score?: number | null): string => {
  if (score === undefined || score === null) return 'N/A';
  const num = Number(score);
  if (isNaN(num) || num <= 0) return 'N/A';
  return num.toFixed(1);
};

const isDatePast = (dateStr?: string | null): boolean => {
  if (!dateStr) return false;
  try {
    return new Date(dateStr).getTime() <= new Date().getTime();
  } catch {
    return false;
  }
};

export const CompletedJobOverview: React.FC<CompletedJobOverviewProps> = ({
  viewerRole,
  application,
  job: passedJob,
  onOpenChat,
  onViewProfile,
}) => {
  const navigation = useNavigation<any>();
  const job = passedJob || application?.job;
  const worker = application?.worker || (job as any)?.applications?.[0]?.worker;
  const employer = job?.employer;
  const counterparty = viewerRole === 'employer' ? worker : employer;
  const counterpartyLabel = viewerRole === 'employer' ? 'Hired Worker' : 'Employer';

  const refNumber = job?.reference_number || `JOB-${job?.id || application?.job_post_id || '000'}`;
  const completedDateStr =
    job?.completed_at || application?.completed_at || job?.updated_at || application?.updated_at;
  const formattedCompletedDate = formatDate(completedDateStr);

  const hasReviewed = Boolean(
    application?.has_reviewed || application?.user_review || (application as any)?.reviewed,
  );
  const userReview = application?.user_review;

  const isRatingWindowClosed = isDatePast(job?.rating_window_expires_at);

  const categories = job?.categories || (job?.category ? [job.category] : []);
  const locationText = job?.barangay
    ? `${job.barangay}, ${job.municipality || 'Bulan'}`
    : job?.municipality || 'Bulan, Sorsogon';

  const agreedPrice = application?.final_agreed_price;
  const displayCompensation =
    agreedPrice != null
      ? `₱${Number(agreedPrice).toLocaleString()}`
      : job?.compensation != null
        ? `₱${Number(job.compensation).toLocaleString()}`
        : '₱0';

  const rateUnitText =
    agreedPrice != null
      ? 'Agreed Total'
      : job?.rate_unit
        ? job.rate_unit.replace('_', ' ')
        : 'Fixed Pay';

  const photos = Array.isArray(job?.photos) ? job.photos : [];

  const handleRate = () => {
    if (viewerRole === 'employer') {
      if (application) {
        navigation.navigate('RateWorker', {
          id: Number(application.id),
          workerName: String(worker?.name || 'Worker'),
          jobTitle: String(job?.title || 'Job'),
          jobId: Number(job?.id || application.job_post_id),
        });
      } else if (job?.id) {
        navigation.navigate('RateWorkerList', {
          jobId: Number(job.id),
          jobTitle: String(job.title || 'Job'),
        });
      }
    } else {
      navigation.navigate('RateEmployer', {
        id: Number(application?.id),
        employerName: String(employer?.name || 'Employer'),
        jobTitle: String(job?.title || 'Job'),
      });
    }
  };

  const handleCounterpartyPress = () => {
    if (onViewProfile) {
      onViewProfile();
      return;
    }

    if (viewerRole === 'employer') {
      if (application) {
        navigation.navigate('ApplicantDetail', {
          applicantId: application.id,
          applicantName: counterparty?.name || 'Worker',
          jobTitle: job?.title || 'Job',
          status: application.status,
          barangay: counterparty?.barangay,
          municipality: counterparty?.municipality,
          reputationScore: (counterparty as any)?.reputation_score,
          skills: (counterparty as any)?.skills,
          experiences: (counterparty as any)?.experiences,
          characterReferences: (counterparty as any)?.character_references,
          phone: (counterparty as any)?.phone,
          viewProfile: true,
        });
      }
    } else {
      navigation.navigate('EmployerPublicProfile', {
        employerId: job?.employer_id || counterparty?.id,
        employerName: counterparty?.name,
        avatarUrl: counterparty?.avatar_url,
        verificationBadge: (counterparty as any)?.verification_badge,
        reputationScore: (counterparty as any)?.reputation_score,
        barangay: job?.barangay || counterparty?.barangay,
        municipality: job?.municipality || counterparty?.municipality,
        businessDocuments:
          job?.employer?.business_documents || (counterparty as any)?.business_documents || [],
      });
    }
  };

  const counterpartyScore = formatScore((counterparty as any)?.reputation_score);

  return (
    <View style={styles.container}>
      {/* UNIFIED SINGLE RECEIPT CARD */}
      <View style={styles.receiptCard}>
        {/* Receipt Header Row */}
        <View style={styles.receiptTopRow}>
          <View style={styles.refBadge}>
            <Ionicons name="document-text-outline" size={13} color={colors.inkSoft} />
            <Text style={styles.refText}>{refNumber}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.completedBadgeText}>Completed</Text>
          </View>
        </View>

        {/* Job Title & Date */}
        <Text style={styles.jobTitle}>{job?.title || 'Job Completion'}</Text>
        {formattedCompletedDate ? (
          <Text style={styles.completedDateText}>Finished on {formattedCompletedDate}</Text>
        ) : null}

        {/* Amount & Duration Box */}
        <View style={styles.amountBox}>
          <View>
            <Text style={styles.amountLabel}>{rateUnitText}</Text>
            <Text style={styles.amountValue}>{displayCompensation}</Text>
          </View>
          {job?.duration ? (
            <View style={styles.durationPill}>
              <Ionicons name="time-outline" size={13} color={colors.skyDeep} />
              <Text style={styles.durationPillText}>
                {job.duration} {job.duration_unit || 'Days'}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Counterparty Clickable Chip (Worker or Employer) */}
        {counterparty && (
          <TouchableOpacity
            style={styles.partyChip}
            activeOpacity={0.8}
            onPress={handleCounterpartyPress}
          >
            <Avatar
              url={counterparty.is_deleted ? undefined : counterparty.avatar_url}
              name={counterparty.name || counterpartyLabel}
              size={36}
            />
            <View style={styles.partyChipInfo}>
              <Text style={styles.partyChipRole}>{counterpartyLabel}</Text>
              <View style={styles.partyChipNameRow}>
                <Text style={styles.partyChipName} numberOfLines={1}>
                  {counterparty.name || counterpartyLabel}
                </Text>
                {counterpartyScore !== 'N/A' && (
                  <View style={styles.partyChipScoreBadge}>
                    <Ionicons name="star" size={11} color={colors.gold} />
                    <Text style={styles.partyChipScoreText}>{counterpartyScore}</Text>
                  </View>
                )}
              </View>
            </View>
            <View style={styles.viewProfilePill}>
              <Text style={styles.viewProfileText}>View Profile</Text>
              <Ionicons name="chevron-forward" size={13} color={colors.primary} />
            </View>
          </TouchableOpacity>
        )}

        {/* Receipt Divider */}
        <View style={styles.receiptDivider} />

        {/* Receipt Details Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailRow}>
            <View style={styles.detailIconBox}>
              <Ionicons name="location-outline" size={15} color={colors.primary} />
            </View>
            <View style={styles.detailTextBox}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>{locationText}</Text>
            </View>
          </View>

          {job?.schedule_date ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: colors.mint + '30' }]}>
                <Ionicons name="calendar-outline" size={15} color={colors.mintDeep} />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Schedule</Text>
                <Text style={styles.detailValue}>{formatDate(job.schedule_date)}</Text>
              </View>
            </View>
          ) : null}

          {categories.length > 0 && (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: colors.butter + '40' }]}>
                <Ionicons name="pricetag-outline" size={15} color={colors.gold} />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Category</Text>
                <Text style={styles.detailValue}>{categories.join(', ')}</Text>
              </View>
            </View>
          )}

          {job?.description ? (
            <View style={styles.detailRow}>
              <View style={[styles.detailIconBox, { backgroundColor: colors.peach + '40' }]}>
                <Ionicons name="document-text-outline" size={15} color={colors.urgent} />
              </View>
              <View style={styles.detailTextBox}>
                <Text style={styles.detailLabel}>Description</Text>
                <Text style={styles.detailValue} numberOfLines={3}>
                  {job.description}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        {/* Photos Preview */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.detailLabel}>Work Photos ({photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {photos.map((uri, idx) => (
                <Image
                  key={idx}
                  source={{ uri }}
                  style={styles.photoThumb}
                  contentFit="cover"
                  cachePolicy="memory-disk"
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Receipt Divider */}
        <View style={styles.receiptDivider} />

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          {hasReviewed ? (
            <View style={styles.ratingStatusInner}>
              <View style={styles.ratingStatusIconCircle}>
                <Ionicons name="star" size={16} color={colors.gold} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.ratingTitleRow}>
                  <Text style={styles.ratingStatusTitle}>You rated this job</Text>
                  {userReview?.overall_rating ? (
                    <View style={styles.ratingStarsBadge}>
                      <Ionicons name="star" size={12} color={colors.gold} />
                      <Text style={styles.ratingStarsScore}>
                        {Number(userReview.overall_rating).toFixed(1)}
                      </Text>
                    </View>
                  ) : null}
                </View>
                {userReview?.comment ? (
                  <Text style={styles.ratingComment}>"{userReview.comment}"</Text>
                ) : (
                  <Text style={styles.ratingStatusSub}>
                    Thank you for submitting feedback to the SIKAP community.
                  </Text>
                )}
              </View>
            </View>
          ) : isRatingWindowClosed ? (
            <View style={styles.ratingStatusInner}>
              <View style={[styles.ratingStatusIconCircle, { backgroundColor: '#E2E8F0' }]}>
                <Ionicons name="time-outline" size={16} color={colors.inkSoft} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.ratingStatusTitle}>Rating window closed</Text>
                <Text style={styles.ratingStatusSub}>
                  The 7-day feedback window for this completed job has ended.
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.ratingPendingBox}>
              <View style={styles.ratingStatusInner}>
                <View
                  style={[styles.ratingStatusIconCircle, { backgroundColor: colors.butter + '50' }]}
                >
                  <Ionicons name="star-outline" size={16} color={colors.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.ratingStatusTitle}>Rating window open</Text>
                  <Text style={styles.ratingStatusSub}>
                    Share your experience to help the community.
                  </Text>
                </View>
              </View>
              <TouchableOpacity style={styles.rateBtn} onPress={handleRate} activeOpacity={0.85}>
                <Ionicons name="star" size={16} color={colors.white} />
                <Text style={styles.rateBtnText}>
                  {viewerRole === 'employer' ? 'Rate Worker' : 'Rate Employer'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Chat History Action (Optional) */}
        {onOpenChat && (
          <TouchableOpacity style={styles.chatHistoryBtn} onPress={onOpenChat} activeOpacity={0.75}>
            <Ionicons name="chatbubbles-outline" size={15} color={colors.primary} />
            <Text style={styles.chatHistoryText}>View Chat History</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  receiptCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    ...shadows.base,
  },
  receiptTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paperCream,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  refText: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  completedBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#15803D',
  },
  jobTitle: {
    fontFamily: fonts.display,
    fontSize: 22,
    color: colors.ink,
    lineHeight: 28,
  },
  completedDateText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 3,
  },
  amountBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    padding: 14,
    backgroundColor: colors.paperCream,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  amountLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontFamily: fonts.display,
    fontSize: 24,
    color: colors.primaryDark,
    lineHeight: 30,
  },
  durationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.sky + '20',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  durationPillText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.skyDeep,
  },
  partyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 10,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
  },
  partyChipInfo: {
    flex: 1,
  },
  partyChipRole: {
    fontFamily: fonts.body,
    fontSize: 10,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partyChipNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 1,
  },
  partyChipName: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  partyChipScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 6,
  },
  partyChipScoreText: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: colors.gold,
  },
  viewProfilePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 6,
  },
  viewProfileText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  receiptDivider: {
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 16,
  },
  detailsGrid: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  detailIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: colors.sky + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  detailTextBox: {
    flex: 1,
  },
  detailLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginTop: 1,
    lineHeight: 18,
  },
  photosSection: {
    marginTop: 12,
  },
  photoThumb: {
    width: 70,
    height: 70,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: colors.inkFaint,
  },
  ratingSection: {
    marginTop: 2,
  },
  ratingStatusInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  ratingStatusIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ratingStatusTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  ratingStarsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 6,
  },
  ratingStarsScore: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: colors.gold,
  },
  ratingComment: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 3,
    lineHeight: 16,
  },
  ratingStatusSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    lineHeight: 16,
  },
  ratingPendingBox: {
    gap: 12,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 6,
    marginTop: 6,
  },
  rateBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  chatHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 12,
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
  },
  chatHistoryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
});
