import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Share,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, shadows } from '../../theme';
import { Avatar } from '../common/Avatar';
import { useAlert } from '../../contexts/AlertContext';
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

// Deterministic barcode bar widths for authentic receipt footer
const BARCODE_PATTERN = [
  3, 1, 2, 1, 4, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 4, 1, 2, 1, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 4, 1, 2,
  1, 3,
];

const SAWTOOTH_COUNT = 22;

export const CompletedJobOverview: React.FC<CompletedJobOverviewProps> = ({
  viewerRole,
  application,
  job: passedJob,
  onOpenChat,
  onViewProfile,
}) => {
  const navigation = useNavigation<any>();
  const { showAlert } = useAlert();
  const receiptRef = useRef<View>(null);
  const [isSavingReceipt, setIsSavingReceipt] = useState(false);
  const [failedPhotos, setFailedPhotos] = useState<Record<string, boolean>>({});

  const job = passedJob || application?.job;
  const worker = application?.worker || (job as any)?.applications?.[0]?.worker;
  const employer = job?.employer;
  const counterparty = viewerRole === 'employer' ? worker : employer;
  const counterpartyLabel = viewerRole === 'employer' ? 'Hired Worker' : 'Employer';

  const refNumber =
    job?.reference_number || `SIKAP-${job?.id || application?.job_post_id || '000'}`;
  const completedDateStr =
    job?.completed_at || application?.completed_at || job?.updated_at || application?.updated_at;
  const formattedCompletedDate =
    formatDate(completedDateStr) || formatDate(new Date().toISOString());

  const hasReviewed = Boolean(
    application?.has_reviewed || application?.user_review || (application as any)?.reviewed,
  );
  const userReview = application?.user_review;

  const isRatingWindowClosed = isDatePast(job?.rating_window_expires_at);

  const categories = job?.categories || (job?.category ? [job.category] : []);
  const locationText = job?.barangay
    ? `${job.barangay}, ${job.municipality || 'Sorsogon'}`
    : job?.municipality || 'Province of Sorsogon';

  const agreedPrice = application?.final_agreed_price;
  const displayCompensation =
    agreedPrice != null
      ? `₱${Number(agreedPrice).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
      : job?.compensation != null
        ? `₱${Number(job.compensation).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
        : '₱0.00';

  const rateUnitText =
    agreedPrice != null
      ? 'FINAL AGREED COMPENSATION'
      : job?.rate_unit
        ? `COMPENSATION (${job.rate_unit.replace(/_/g, ' ').toUpperCase()})`
        : 'TOTAL COMPENSATION';

  const rawPhotos = Array.isArray(job?.photos) ? job.photos : [];
  const validPhotos = rawPhotos.filter(
    (uri) => typeof uri === 'string' && uri.trim().length > 0 && !failedPhotos[uri],
  );

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

  const handleDownloadReceipt = async () => {
    if (isSavingReceipt) return;
    setIsSavingReceipt(true);
    try {
      let capturedUri: string | null = null;
      try {
        const ViewShot = require('react-native-view-shot');
        if (ViewShot?.captureRef && receiptRef.current) {
          capturedUri = await ViewShot.captureRef(receiptRef, {
            format: 'png',
            quality: 1,
            result: 'tmpfile',
          });
        }
      } catch (captureErr) {
        console.warn('ViewShot capture unavailable in current binary:', captureErr);
      }

      if (capturedUri) {
        try {
          const MediaLibrary = require('expo-media-library');
          const permission = await MediaLibrary.requestPermissionsAsync();
          if (permission?.granted) {
            await MediaLibrary.saveToLibraryAsync(capturedUri);
            showAlert(
              'Receipt Saved',
              'A photo of this official completion receipt has been saved to your phone gallery.',
            );
            return;
          }
        } catch (mediaErr) {
          console.warn('MediaLibrary save fallback to Sharing:', mediaErr);
        }

        try {
          const Sharing = require('expo-sharing');
          if (await Sharing.isAvailableAsync()) {
            await Sharing.shareAsync(capturedUri, {
              mimeType: 'image/png',
              dialogTitle: `SIKAP Receipt ${refNumber}`,
            });
            return;
          }
        } catch (shareErr) {
          console.warn('expo-sharing fallback:', shareErr);
        }
      }

      // Fallback if native image capture is not linked in an older APK build
      await Share.share({
        title: `SIKAP Job Completion Receipt (${refNumber})`,
        message: [
          '=== SIKAP OFFICIAL COMPLETION RECEIPT ===',
          `Reference No.: ${refNumber}`,
          `Status: COMPLETED`,
          `Date Completed: ${formattedCompletedDate}`,
          `Job Title: ${job?.title || 'Completed Job'}`,
          `${rateUnitText}: ${displayCompensation}`,
          counterparty?.name ? `${counterpartyLabel}: ${counterparty.name}` : null,
          `Location: ${locationText}`,
          '=========================================',
        ]
          .filter(Boolean)
          .join('\n'),
      });
    } catch (err) {
      console.warn('Failed to save or share receipt:', err);
      showAlert('Unable to Save Receipt', 'Please try again.');
    } finally {
      setIsSavingReceipt(false);
    }
  };

  const counterpartyScore = formatScore((counterparty as any)?.reputation_score);
  const counterpartyLocation = counterparty?.barangay
    ? `${counterparty.barangay}${counterparty.municipality ? `, ${counterparty.municipality}` : ''}`
    : counterparty?.municipality || '';

  return (
    <View style={styles.container}>
      {/* CAPTUREABLE AUTHENTIC RECEIPT PAPER */}
      <View ref={receiptRef} collapsable={false} style={styles.receiptCaptureWrapper}>
        {/* Top Sawtooth Perforation Edge */}
        <View style={styles.sawtoothRowTop}>
          {Array.from({ length: SAWTOOTH_COUNT }).map((_, i) => (
            <View key={`top-${i}`} style={styles.sawtoothTriangleTop} />
          ))}
        </View>

        <View style={styles.receiptPaper}>
          {/* LEVEL 1: OFFICIAL RECEIPT HEADER */}
          <View style={styles.receiptHeader}>
            <View style={styles.brandRow}>
              <View style={styles.brandSeal}>
                <Ionicons name="shield-checkmark" size={14} color={colors.primaryDark} />
              </View>
              <Text style={styles.brandTitle}>SIKAP OFFICIAL RECEIPT</Text>
            </View>
            <Text style={styles.brandSubtitle}>
              Digital Job Completion Record • Province of Sorsogon
            </Text>

            <View style={styles.headerMetaRow}>
              <View style={styles.refPill}>
                <Text style={styles.refPillLabel}>REF #</Text>
                <Text style={styles.refPillValue}>{refNumber}</Text>
              </View>
              <View style={styles.completedStamp}>
                <Ionicons name="checkmark-circle" size={14} color="#15803D" />
                <Text style={styles.completedStampText}>COMPLETED</Text>
              </View>
            </View>
          </View>

          {/* LEVEL 2: HERO AMOUNT & JOB TITLE */}
          <View style={styles.heroAmountSection}>
            <Text style={styles.amountEyebrow}>{rateUnitText}</Text>
            <Text style={styles.heroAmountValue}>{displayCompensation}</Text>

            <Text style={styles.heroJobTitle}>{job?.title || 'Job Completion'}</Text>

            <View style={styles.heroSubMetaRow}>
              {formattedCompletedDate ? (
                <View style={styles.heroMetaChip}>
                  <Ionicons name="calendar-outline" size={13} color={colors.inkSoft} />
                  <Text style={styles.heroMetaChipText}>{formattedCompletedDate}</Text>
                </View>
              ) : null}
              {job?.duration ? (
                <View style={[styles.heroMetaChip, styles.durationChip]}>
                  <Ionicons name="time-outline" size={13} color={colors.skyDeep} />
                  <Text style={[styles.heroMetaChipText, { color: colors.skyDeep }]}>
                    {job.duration} {job.duration_unit || 'Days'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* PERFORATED TEAR LINE WITH SIDE NOTCHES */}
          <View style={styles.perforationContainer}>
            <View style={[styles.notch, styles.notchLeft]} />
            <View style={styles.dashedLine} />
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          {/* LEVEL 3: COUNTERPARTY PROFILE BOX (Spacious, Clickable, No Crowded "View Profile" Button) */}
          {counterparty && (
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionEyebrow}>{counterpartyLabel.toUpperCase()}</Text>
              <TouchableOpacity
                style={styles.partyCard}
                activeOpacity={0.78}
                onPress={handleCounterpartyPress}
                accessibilityRole="button"
                accessibilityLabel={`View ${counterparty.name || counterpartyLabel} profile`}
              >
                <Avatar
                  url={counterparty.is_deleted ? undefined : counterparty.avatar_url}
                  name={counterparty.name || counterpartyLabel}
                  size={48}
                />
                <View style={styles.partyCardBody}>
                  <Text style={styles.partyCardName} numberOfLines={2}>
                    {counterparty.name || counterpartyLabel}
                  </Text>
                  <View style={styles.partyCardMetaRow}>
                    {counterpartyScore !== 'N/A' ? (
                      <View style={styles.partyScoreBadge}>
                        <Ionicons name="star" size={11} color="#B45309" />
                        <Text style={styles.partyScoreText}>{counterpartyScore}</Text>
                      </View>
                    ) : (
                      <Text style={styles.partyNoRatingText}>Verified SIKAP Member</Text>
                    )}
                    {counterpartyLocation ? (
                      <Text style={styles.partyLocationText} numberOfLines={1}>
                        • {counterpartyLocation}
                      </Text>
                    ) : null}
                  </View>
                </View>
                <View style={styles.partyChevronCircle}>
                  <Ionicons name="chevron-forward" size={16} color={colors.primaryDark} />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* LEVEL 4: ITEMIZED RECEIPT LEDGER */}
          <View style={styles.ledgerSection}>
            <Text style={styles.sectionEyebrow}>JOB DETAILS & SUMMARY</Text>

            <View style={styles.ledgerTable}>
              <View style={styles.ledgerRow}>
                <Text style={styles.ledgerLabel}>Location</Text>
                <Text style={styles.ledgerValue}>{locationText}</Text>
              </View>

              {job?.schedule_date ? (
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Scheduled Date</Text>
                  <Text style={styles.ledgerValue}>{formatDate(job.schedule_date)}</Text>
                </View>
              ) : null}

              {categories.length > 0 && (
                <View style={styles.ledgerRow}>
                  <Text style={styles.ledgerLabel}>Trade Category</Text>
                  <Text style={styles.ledgerValue}>{categories.join(', ')}</Text>
                </View>
              )}

              {job?.description ? (
                <View style={[styles.ledgerRow, styles.ledgerRowVertical]}>
                  <Text style={styles.ledgerLabel}>Work Scope / Notes</Text>
                  <Text style={styles.ledgerDescription} numberOfLines={3}>
                    {job.description}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>

          {/* WORK PHOTOS (IF AVAILABLE & NOT REVOKED) */}
          {validPhotos.length > 0 && (
            <View style={styles.photosSection}>
              <Text style={styles.sectionEyebrow}>ATTACHED WORK PHOTOS ({validPhotos.length})</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginTop: 8 }}
              >
                {validPhotos.map((uri, idx) => (
                  <Image
                    key={`${uri}-${idx}`}
                    source={{ uri }}
                    style={styles.photoThumb}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    onError={() =>
                      setFailedPhotos((prev) => ({
                        ...prev,
                        [uri]: true,
                      }))
                    }
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* PERFORATED TEAR LINE BEFORE BARCODE FOOTER */}
          <View style={styles.perforationContainer}>
            <View style={[styles.notch, styles.notchLeft]} />
            <View style={styles.dashedLine} />
            <View style={[styles.notch, styles.notchRight]} />
          </View>

          {/* LEVEL 5: FEEDBACK / RATING RECORD */}
          <View style={styles.ratingSection}>
            {hasReviewed ? (
              <View style={styles.ratingStatusInner}>
                <View style={styles.ratingStatusIconCircle}>
                  <Ionicons name="star" size={16} color="#B45309" />
                </View>
                <View style={{ flex: 1 }}>
                  <View style={styles.ratingTitleRow}>
                    <Text style={styles.ratingStatusTitle}>Feedback Submitted</Text>
                    {userReview?.overall_rating ? (
                      <View style={styles.ratingStarsBadge}>
                        <Ionicons name="star" size={11} color="#B45309" />
                        <Text style={styles.ratingStarsScore}>
                          {Number(userReview.overall_rating).toFixed(1)} / 5.0
                        </Text>
                      </View>
                    ) : null}
                  </View>
                  {userReview?.comment ? (
                    <Text style={styles.ratingComment}>"{userReview.comment}"</Text>
                  ) : (
                    <Text style={styles.ratingStatusSub}>
                      Thank you for rating this completed job on SIKAP.
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
                  <Text style={styles.ratingStatusTitle}>7-Day Rating Window Closed</Text>
                  <Text style={styles.ratingStatusSub}>
                    The feedback period for this completed job has ended.
                  </Text>
                </View>
              </View>
            ) : (
              <View style={styles.ratingPendingBox}>
                <View style={styles.ratingStatusInner}>
                  <View
                    style={[
                      styles.ratingStatusIconCircle,
                      { backgroundColor: colors.butter + '60' },
                    ]}
                  >
                    <Ionicons name="star-outline" size={16} color="#B45309" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ratingStatusTitle}>7-Day Rating Window Open</Text>
                    <Text style={styles.ratingStatusSub}>
                      Rate your experience to build trusted community reputation.
                    </Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.rateBtn} onPress={handleRate} activeOpacity={0.85}>
                  <Ionicons name="star" size={15} color={colors.white} />
                  <Text style={styles.rateBtnText}>
                    {viewerRole === 'employer' ? 'Rate Worker' : 'Rate Employer'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* AUTHENTIC BARCODE & VERIFICATION FOOTER */}
          <View style={styles.barcodeFooter}>
            <View style={styles.barcodeRow}>
              {BARCODE_PATTERN.map((width, index) => (
                <View
                  key={index}
                  style={[
                    styles.barcodeBar,
                    {
                      width: width * 2,
                      opacity: index % 3 === 0 ? 0.85 : 0.65,
                    },
                  ]}
                />
              ))}
            </View>
            <Text style={styles.barcodeCodeText}>{refNumber}</Text>
            <Text style={styles.receiptFooterNote}>
              Verified Digital Receipt • SIKAP Sorsogon Portal
            </Text>
          </View>
        </View>

        {/* Bottom Sawtooth Perforation Edge */}
        <View style={styles.sawtoothRowBottom}>
          {Array.from({ length: SAWTOOTH_COUNT }).map((_, i) => (
            <View key={`bot-${i}`} style={styles.sawtoothTriangleBottom} />
          ))}
        </View>
      </View>

      {/* RECEIPT ACTION BAR (OUTSIDE CAPTURE VIEW SO BUTTONS DON'T CLUTTER SAVED PHOTO) */}
      <View style={styles.actionsBar}>
        <TouchableOpacity
          style={styles.downloadReceiptBtn}
          onPress={handleDownloadReceipt}
          disabled={isSavingReceipt}
          activeOpacity={0.82}
        >
          {isSavingReceipt ? (
            <ActivityIndicator size="small" color={colors.white} />
          ) : (
            <>
              <Ionicons name="download-outline" size={17} color={colors.white} />
              <Text style={styles.downloadReceiptText}>Download Receipt Photo</Text>
            </>
          )}
        </TouchableOpacity>

        {onOpenChat && (
          <TouchableOpacity style={styles.chatHistoryBtn} onPress={onOpenChat} activeOpacity={0.78}>
            <Ionicons name="chatbubbles-outline" size={16} color={colors.primaryDark} />
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
    paddingBottom: 28,
  },
  receiptCaptureWrapper: {
    backgroundColor: colors.paper,
    paddingVertical: 4,
  },
  sawtoothRowTop: {
    flexDirection: 'row',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 8,
    marginHorizontal: 2,
  },
  sawtoothTriangleTop: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#FFFFFF',
  },
  sawtoothRowBottom: {
    flexDirection: 'row',
    justifyContent: 'center',
    overflow: 'hidden',
    height: 8,
    marginHorizontal: 2,
  },
  sawtoothTriangleBottom: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#FFFFFF',
  },
  receiptPaper: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 20,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E2E8F0',
    ...shadows.base,
  },
  receiptHeader: {
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  brandSeal: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.sky + '25',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    letterSpacing: 1.4,
  },
  brandSubtitle: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    marginTop: 2,
  },
  headerMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
  },
  refPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  refPillLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.inkMuted,
    letterSpacing: 0.5,
  },
  refPillValue: {
    fontFamily: fonts.numericBold,
    fontSize: 11.5,
    color: colors.ink,
  },
  completedStamp: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#86EFAC',
  },
  completedStampText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: '#15803D',
    letterSpacing: 0.6,
  },
  heroAmountSection: {
    alignItems: 'center',
    paddingVertical: 18,
    paddingHorizontal: 12,
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    marginTop: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  amountEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: colors.inkMuted,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  heroAmountValue: {
    fontFamily: fonts.display,
    fontSize: 32,
    color: colors.primaryDark,
    lineHeight: 38,
    marginTop: 4,
  },
  heroJobTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  heroSubMetaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
  },
  heroMetaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  durationChip: {
    backgroundColor: colors.sky + '18',
    borderColor: colors.sky + '40',
  },
  heroMetaChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11.5,
    color: colors.inkSoft,
  },
  perforationContainer: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 18,
    height: 20,
  },
  dashedLine: {
    flex: 1,
    borderTopWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  notch: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    zIndex: 2,
  },
  notchLeft: {
    left: -31,
  },
  notchRight: {
    right: -31,
  },
  sectionBlock: {
    marginBottom: 16,
  },
  sectionEyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 10.5,
    color: colors.inkMuted,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  partyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 12,
  },
  partyCardBody: {
    flex: 1,
    justifyContent: 'center',
  },
  partyCardName: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    lineHeight: 21,
  },
  partyCardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 5,
  },
  partyScoreBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  partyScoreText: {
    fontFamily: fonts.numericBold,
    fontSize: 11.5,
    color: '#B45309',
  },
  partyNoRatingText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
  },
  partyLocationText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    flexShrink: 1,
  },
  partyChevronCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  ledgerSection: {
    marginTop: 2,
  },
  ledgerTable: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  ledgerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    borderStyle: 'dashed',
    gap: 12,
  },
  ledgerRowVertical: {
    flexDirection: 'column',
    gap: 4,
    borderBottomWidth: 0,
  },
  ledgerLabel: {
    fontFamily: fonts.body,
    fontSize: 12.5,
    color: colors.inkSoft,
    flexShrink: 0,
  },
  ledgerValue: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    textAlign: 'right',
    flex: 1,
  },
  ledgerDescription: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 18,
  },
  photosSection: {
    marginTop: 16,
  },
  photoThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    marginRight: 8,
    backgroundColor: colors.inkFaint,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  ratingSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
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
    flexShrink: 0,
  },
  ratingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingStarsScore: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: '#B45309',
  },
  ratingComment: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    fontStyle: 'italic',
    marginTop: 4,
    lineHeight: 17,
  },
  ratingStatusSub: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    marginTop: 2,
    lineHeight: 16,
  },
  ratingPendingBox: {
    gap: 10,
  },
  rateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  rateBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
  },
  barcodeFooter: {
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  barcodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 32,
    gap: 2.5,
  },
  barcodeBar: {
    height: '100%',
    backgroundColor: '#0F172A',
    borderRadius: 0.5,
  },
  barcodeCodeText: {
    fontFamily: fonts.numericBold,
    fontSize: 11,
    color: colors.inkSoft,
    letterSpacing: 2,
    marginTop: 6,
  },
  receiptFooterNote: {
    fontFamily: fonts.body,
    fontSize: 10.5,
    color: colors.inkMuted,
    marginTop: 2,
  },
  actionsBar: {
    marginTop: 14,
    gap: 10,
  },
  downloadReceiptBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.ink,
    paddingVertical: 13,
    paddingHorizontal: 18,
    borderRadius: 14,
    ...shadows.base,
  },
  downloadReceiptText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.white,
  },
  chatHistoryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  chatHistoryText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.primaryDark,
  },
});
