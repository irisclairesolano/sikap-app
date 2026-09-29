import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import { Avatar } from '../common/Avatar';
import { Application, JobPost } from '../../types';

export interface CompletedJobOverviewProps {
  viewerRole: 'employer' | 'worker';
  application?: Application | null;
  job?: JobPost | null;
  onOpenChat?: () => void;
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

export const CompletedJobOverview: React.FC<CompletedJobOverviewProps> = ({
  viewerRole,
  application,
  job: passedJob,
  onOpenChat,
}) => {
  const job = passedJob || application?.job;
  const worker = application?.worker;
  const employer = job?.employer;

  const refNumber = job?.reference_number || `JOB-${job?.id || application?.job_post_id || '000'}`;
  const completedDateStr =
    job?.completed_at || application?.completed_at || job?.updated_at || application?.updated_at;
  const formattedCompletedDate = formatDate(completedDateStr);

  const hasReviewed = Boolean(
    application?.has_reviewed || application?.user_review || (application as any)?.reviewed,
  );
  const userReview = application?.user_review;

  const isRatingWindowClosed = (() => {
    if (!job?.rating_window_expires_at) return false;
    try {
      return new Date(job.rating_window_expires_at).getTime() <= Date.now();
    } catch {
      return false;
    }
  })();

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
        : null;

  const rateUnitText =
    agreedPrice != null
      ? 'Agreed Pay'
      : job?.rate_unit
        ? job.rate_unit.replace('_', ' ')
        : 'Fixed Pay';

  const photos = Array.isArray(job?.photos) ? job.photos : [];

  return (
    <View style={styles.container}>
      {/* 1. JOB HEADER */}
      <View style={styles.headerCard}>
        <View style={styles.headerTopRow}>
          <View style={styles.refBadge}>
            <Ionicons name="document-text-outline" size={13} color={colors.inkSoft} />
            <Text style={styles.refText}>{refNumber}</Text>
          </View>
          <View style={styles.completedBadge}>
            <Ionicons name="checkmark-circle" size={14} color="#15803D" />
            <Text style={styles.completedBadgeText}>Job Completed</Text>
          </View>
        </View>

        <Text style={styles.jobTitle}>{job?.title || 'Job Overview'}</Text>

        {formattedCompletedDate ? (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={13} color={colors.inkMuted} />
            <Text style={styles.completedDateText}>Completed on {formattedCompletedDate}</Text>
          </View>
        ) : null}
      </View>

      {/* 2. COUNTERPARTY PROFILE CARD */}
      {viewerRole === 'employer' && worker ? (
        <View style={styles.partyCard}>
          <Text style={styles.partyCardEyebrow}>Hired Worker</Text>
          <View style={styles.partyRow}>
            <Avatar
              url={worker.is_deleted ? undefined : worker.avatar_url}
              name={worker.name || 'Worker'}
              size={48}
            />
            <View style={styles.partyInfo}>
              <View style={styles.partyNameRow}>
                <Text style={styles.partyName}>{worker.name || 'Worker'}</Text>
                {!worker.is_deleted &&
                  worker.name !== 'Deleted Account' &&
                  worker.verification_badge && (
                    <Ionicons name="checkmark-circle" size={16} color={colors.mintDeep} />
                  )}
              </View>
              {!worker.is_deleted && worker.name !== 'Deleted Account' && worker.barangay ? (
                <Text style={styles.partySub}>
                  <Ionicons name="location-outline" size={12} color={colors.inkMuted} />{' '}
                  {worker.barangay}, {worker.municipality || 'Bulan'}
                </Text>
              ) : null}
              {!worker.is_deleted && worker.name !== 'Deleted Account' && (
                <View style={styles.partyMetaRow}>
                  <View style={styles.partyScoreBadge}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.partyScoreText}>
                      {formatScore(worker.reputation_score)}
                    </Text>
                  </View>
                  {worker.completed_jobs_count != null && (
                    <Text style={styles.partyMetaText}>
                      • {worker.completed_jobs_count} completed jobs
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>
      ) : null}

      {viewerRole === 'worker' && employer ? (
        <View style={styles.partyCard}>
          <Text style={styles.partyCardEyebrow}>Employer</Text>
          <View style={styles.partyRow}>
            <Avatar
              url={employer.is_deleted ? undefined : employer.avatar_url}
              name={employer.name || 'Employer'}
              size={48}
            />
            <View style={styles.partyInfo}>
              <Text style={styles.partyName}>{employer.name || 'Employer'}</Text>
              {!employer.is_deleted && employer.name !== 'Deleted Account' && employer.barangay ? (
                <Text style={styles.partySub}>
                  <Ionicons name="location-outline" size={12} color={colors.inkMuted} />{' '}
                  {employer.barangay}, {employer.municipality || 'Bulan'}
                </Text>
              ) : null}
              {!employer.is_deleted && employer.name !== 'Deleted Account' && (
                <View style={styles.partyMetaRow}>
                  <View style={styles.partyScoreBadge}>
                    <Ionicons name="star" size={12} color={colors.gold} />
                    <Text style={styles.partyScoreText}>
                      {formatScore(employer.reputation_score)}
                    </Text>
                  </View>
                  <Text style={styles.partyMetaText}>• Reputation Score</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      ) : null}

      {/* 3. COMPACT TIMELINE */}
      <View style={styles.timelineCard}>
        <Text style={styles.sectionHeaderTitle}>Hiring & Completion Timeline</Text>
        <View style={styles.timelineContainer}>
          {[
            { label: 'Applied', date: application?.applied_at || application?.created_at },
            { label: 'Shortlisted', date: undefined },
            { label: 'Offered', date: (application as any)?.employer_confirmed_at },
            { label: 'Hired', date: (application as any)?.slot_locked_at },
            { label: 'Done', date: completedDateStr },
          ].map((step, idx, arr) => (
            <React.Fragment key={step.label}>
              <View style={styles.timelineStep}>
                <View style={styles.timelineCircle}>
                  <Ionicons name="checkmark" size={12} color={colors.white} />
                </View>
                <Text style={styles.timelineLabel}>{step.label}</Text>
                {step.date ? (
                  <Text style={styles.timelineDateText}>{formatDate(step.date)}</Text>
                ) : null}
              </View>
              {idx < arr.length - 1 && <View style={styles.timelineLine} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* 4. JOB DETAILS & PAY */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionHeaderTitle}>Job Details</Text>

        {/* Categories */}
        {categories.length > 0 && (
          <View style={styles.categoriesRow}>
            {categories.map((cat, idx) => (
              <View key={idx} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{cat}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Location & Schedule */}
        <View style={styles.metaList}>
          <View style={styles.metaItem}>
            <View style={[styles.metaIconBox, { backgroundColor: colors.sky + '25' }]}>
              <Ionicons name="location" size={16} color={colors.skyDeep} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Location</Text>
              <Text style={styles.metaValue}>{locationText}</Text>
            </View>
          </View>

          {job?.schedule_date ? (
            <View style={styles.metaItem}>
              <View style={[styles.metaIconBox, { backgroundColor: colors.mint + '35' }]}>
                <Ionicons name="calendar" size={16} color={colors.mintDeep} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Schedule Date</Text>
                <Text style={styles.metaValue}>{formatDate(job.schedule_date)}</Text>
              </View>
            </View>
          ) : null}

          {job?.duration ? (
            <View style={styles.metaItem}>
              <View style={[styles.metaIconBox, { backgroundColor: colors.butter + '50' }]}>
                <Ionicons name="time" size={16} color={colors.primaryDark} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>Duration</Text>
                <Text style={styles.metaValue}>
                  {job.duration} {job.duration_unit || 'Days'}
                </Text>
              </View>
            </View>
          ) : null}

          <View style={styles.metaItem}>
            <View style={[styles.metaIconBox, { backgroundColor: colors.peach + '40' }]}>
              <Ionicons name="people" size={16} color={colors.urgent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.metaLabel}>Workers Hired</Text>
              <Text style={styles.metaValue}>
                {job?.accepted_count ?? job?.filled_slots ?? 1} of {job?.slots ?? 1} worker
                {(job?.slots ?? 1) > 1 ? 's' : ''}
              </Text>
            </View>
          </View>
        </View>

        {/* Pay Display */}
        {displayCompensation ? (
          <View style={styles.payBox}>
            <View style={{ flex: 1 }}>
              <Text style={styles.payLabel}>
                {agreedPrice != null ? 'Final Agreed Price' : 'Compensation'}
              </Text>
              <Text style={styles.payAmount}>{displayCompensation}</Text>
            </View>
            <View style={styles.payBadge}>
              <Text style={styles.payBadgeText}>{rateUnitText}</Text>
            </View>
          </View>
        ) : null}

        {/* Description */}
        {job?.description ? (
          <View style={styles.descSection}>
            <Text style={styles.descLabel}>Description</Text>
            <Text style={styles.descText}>{job.description}</Text>
          </View>
        ) : null}

        {/* Photos */}
        {photos.length > 0 && (
          <View style={styles.photosSection}>
            <Text style={styles.descLabel}>Photos ({photos.length})</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
              {photos.map((uri, idx) => (
                <Image key={idx} source={{ uri }} style={styles.photoThumb} />
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      {/* 5. MUTED RATING STATUS (PURELY INFORMATIVE — NO ACTION BUTTON) */}
      <View style={styles.ratingStatusCard}>
        {hasReviewed ? (
          <View style={styles.ratingStatusInner}>
            <View style={styles.ratingStatusIconCircle}>
              <Ionicons name="star" size={18} color={colors.gold} />
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
              <Ionicons name="time-outline" size={18} color={colors.inkSoft} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ratingStatusTitle}>Rating window closed</Text>
              <Text style={styles.ratingStatusSub}>
                The 7-day feedback window for this completed job has ended.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.ratingStatusInner}>
            <View
              style={[styles.ratingStatusIconCircle, { backgroundColor: colors.butter + '50' }]}
            >
              <Ionicons name="star-outline" size={18} color={colors.ink} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.ratingStatusTitle}>Rating window open</Text>
              <Text style={styles.ratingStatusSub}>
                You have not submitted a rating yet. You can submit your rating from your Dashboard
                or notification alerts.
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* 6. OPTIONAL READ-ONLY CHAT ACCESS */}
      {onOpenChat ? (
        <TouchableOpacity style={styles.chatLinkBtn} onPress={onOpenChat} activeOpacity={0.8}>
          <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
          <Text style={styles.chatLinkText}>View Chat History</Text>
          <Ionicons name="chevron-forward" size={16} color={colors.inkLight} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 16,
  },
  headerCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  headerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  refBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.paperCream,
    paddingHorizontal: 8,
    paddingVertical: 3,
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
    fontSize: 20,
    color: colors.ink,
    lineHeight: 26,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  completedDateText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  partyCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  partyCardEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: colors.inkMuted,
    marginBottom: 10,
  },
  partyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  partyInfo: {
    flex: 1,
    gap: 2,
  },
  partyNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  partyName: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  partySub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  partyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  partyScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.butter + '60',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  partyScoreText: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: colors.ink,
  },
  partyMetaText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  timelineCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  sectionHeaderTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 12,
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  timelineStep: {
    alignItems: 'center',
    width: 54,
  },
  timelineCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#15803D',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  timelineLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkSoft,
    textAlign: 'center',
  },
  timelineDateText: {
    fontFamily: fonts.body,
    fontSize: 9,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 2,
  },
  timelineLine: {
    flex: 1,
    height: 2,
    backgroundColor: '#86EFAC',
    marginTop: 10,
  },
  detailsCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    gap: 14,
    ...shadows.sm,
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryChip: {
    backgroundColor: colors.paperCream,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryChipText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.inkSoft,
  },
  metaList: {
    gap: 10,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metaIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metaLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  metaValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
  },
  payBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryTint,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.primarySoft + '30',
  },
  payLabel: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.primarySoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  payAmount: {
    fontFamily: fonts.numericBold,
    fontSize: 18,
    color: colors.primaryDark,
    marginTop: 2,
  },
  payBadge: {
    backgroundColor: colors.white,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  payBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
    textTransform: 'capitalize',
  },
  descSection: {
    gap: 4,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    paddingTop: 12,
  },
  descLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  descText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
  },
  photosSection: {
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
    paddingTop: 12,
  },
  photoThumb: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: colors.paperCream,
  },
  ratingStatusCard: {
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  ratingStatusInner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ratingStatusIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.butter + '60',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  ratingStatusTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
  },
  ratingStarsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.butter + '80',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingStarsScore: {
    fontFamily: fonts.numericBold,
    fontSize: 12,
    color: colors.ink,
  },
  ratingComment: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 18,
  },
  ratingStatusSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  chatLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.paperBright,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  chatLinkText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primary,
    flex: 1,
    marginLeft: 10,
  },
});
