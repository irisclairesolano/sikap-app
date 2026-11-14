import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { useMyReports } from '../../hooks/useReports';
import { colors, fonts, shadows } from '../../theme';
import { UserReportItem } from '../../api/reports';

const formatReportDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatReasonLabel = (type?: string, t?: any, language?: string) => {
  if (!type) return '';
  switch (type.toLowerCase()) {
    case 'harassment':
      return language === 'tl' ? 'Pang-aabuso o Harassment' : 'Harassment';
    case 'fake_account':
      return language === 'tl' ? 'Pekeng Account' : 'Fake Account';
    case 'inappropriate_job':
      return language === 'tl' ? 'Hindi Angkop na Trabaho' : 'Inappropriate Job';
    case 'flagged_content':
      return language === 'tl' ? 'Minarkahang Nilalaman' : 'Flagged Content';
    case 'other':
    default:
      return language === 'tl' ? 'Iba Pa' : 'Other';
  }
};

export const MyReportsScreen: React.FC = () => {
  const { t, language } = useLanguage();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);

  const { data, isLoading, isFetching, refetch } = useMyReports();
  const reports: UserReportItem[] = data?.data || [];

  const getStatusBadge = (status: UserReportItem['status']) => {
    switch (status) {
      case 'resolved':
        return {
          label: t('report_status_resolved') || 'Resolved',
          bg: '#DCFCE7',
          text: '#15803D',
          border: '#86EFAC',
          icon: 'checkmark-circle-outline' as const,
        };
      case 'investigating':
        return {
          label: t('report_status_investigating') || 'Investigating',
          bg: '#DBEAFE',
          text: '#1D4ED8',
          border: '#93C5FD',
          icon: 'search-outline' as const,
        };
      case 'dismissed':
        return {
          label: t('report_status_dismissed') || 'Dismissed',
          bg: '#F1F5F9',
          text: '#64748B',
          border: '#CBD5E1',
          icon: 'close-circle-outline' as const,
        };
      case 'open':
      case 'pending':
      default:
        return {
          label: t('report_status_pending') || 'Pending',
          bg: '#FEF3C7',
          text: '#B45309',
          border: '#FCD34D',
          icon: 'time-outline' as const,
        };
    }
  };

  const getTargetTypeBadge = (reportableType: string) => {
    const norm = (reportableType || '').toLowerCase();
    if (norm.includes('job')) {
      return {
        label: t('report_type_job') || 'Job Post',
        icon: 'briefcase-outline' as const,
      };
    }
    return {
      label: t('report_type_user') || 'User',
      icon: 'person-outline' as const,
    };
  };

  const renderReportItem = ({ item }: { item: UserReportItem }) => {
    const isExpanded = expandedReportId === item.id;
    const badge = getStatusBadge(item.status);
    const targetInfo = getTargetTypeBadge(item.reportable_type);
    const reasonLabel = formatReasonLabel(item.type, t, language);

    return (
      <View style={styles.card}>
        {/* Top Header Row */}
        <TouchableOpacity
          style={styles.cardHeader}
          activeOpacity={0.8}
          onPress={() => setExpandedReportId(isExpanded ? null : item.id)}
        >
          <View style={styles.headerLeft}>
            <View style={styles.targetRow}>
              <View style={styles.targetBadge}>
                <Ionicons name={targetInfo.icon} size={12} color={colors.inkSoft} />
                <Text style={styles.targetBadgeText}>{targetInfo.label}</Text>
              </View>
              {item.target_label ? (
                <Text style={styles.targetLabel} numberOfLines={1}>
                  {item.target_label}
                </Text>
              ) : null}
            </View>

            <View style={styles.reasonRow}>
              <Text style={styles.reasonText}>{reasonLabel}</Text>
              <Text style={styles.dateDot}>•</Text>
              <Text style={styles.dateText}>{formatReportDate(item.created_at)}</Text>
            </View>
          </View>

          {/* Status Badge */}
          <View
            style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}
          >
            <Ionicons name={badge.icon} size={12} color={badge.text} style={{ marginRight: 4 }} />
            <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </TouchableOpacity>

        {/* Details & Description */}
        <View style={styles.cardBody}>
          <Text style={styles.descriptionText} numberOfLines={isExpanded ? undefined : 3}>
            {item.description ||
              (language === 'tl' ? 'Walang karagdagang detalye.' : 'No description provided.')}
          </Text>

          {/* Screenshots Preview if any */}
          {item.evidence_urls && item.evidence_urls.length > 0 && isExpanded && (
            <View style={styles.evidenceContainer}>
              <Text style={styles.evidenceTitle}>
                {language === 'tl' ? 'Mga Naka-attach na Screenshot:' : 'Attached Evidence:'}
              </Text>
              <View style={styles.evidenceGrid}>
                {item.evidence_urls.map((url, idx) => (
                  <Image key={idx} source={{ uri: url }} style={styles.evidenceImage} />
                ))}
              </View>
            </View>
          )}

          {/* Admin Response Box */}
          {item.admin_response ? (
            <View style={styles.adminResponseBox}>
              <View style={styles.adminResponseHeader}>
                <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                <Text style={styles.adminResponseTitle}>
                  {t('admin_response') || (language === 'tl' ? 'Tugon ng Admin' : 'Admin Response')}
                </Text>
              </View>
              <Text style={styles.adminResponseText}>{item.admin_response}</Text>
              {item.resolved_at && (
                <Text style={styles.resolvedDateText}>
                  {language === 'tl' ? 'Naaksyunan noong ' : 'Action taken on '}
                  {formatReportDate(item.resolved_at)}
                </Text>
              )}
            </View>
          ) : item.status === 'resolved' || item.status === 'dismissed' ? (
            <View style={styles.adminResolvedNote}>
              <Ionicons name="checkmark-done-circle-outline" size={16} color={colors.mintDeep} />
              <Text style={styles.adminResolvedNoteText}>
                {t('notif_report_action_msg') ||
                  (language === 'tl'
                    ? 'Nasuri na ang iyong ulat at naisagawa na ang nararapat na aksyon.'
                    : 'Your report has been reviewed and appropriate action has been taken.')}
              </Text>
            </View>
          ) : (
            <View style={styles.underReviewBox}>
              <Ionicons name="shield-outline" size={15} color={colors.inkMuted} />
              <Text style={styles.underReviewText}>
                {t('under_review') ||
                  (language === 'tl'
                    ? 'Kasalukuyang sinusuri ng moderation team'
                    : 'Under review by moderation team')}
              </Text>
            </View>
          )}

          {/* Expand / Collapse toggle */}
          {item.description && item.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setExpandedReportId(isExpanded ? null : item.id)}
              style={styles.expandToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.expandToggleText}>
                {isExpanded
                  ? language === 'tl'
                    ? 'Ipakita nang mas maikli'
                    : 'Show less'
                  : language === 'tl'
                    ? 'Ipakita ang buong detalye'
                    : 'View full details'}
              </Text>
              <Ionicons
                name={isExpanded ? 'chevron-up' : 'chevron-down'}
                size={14}
                color={colors.primary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{t('my_reports') || 'My Reports'}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="flag-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('no_reports_yet') ||
              (language === 'tl' ? 'Wala pang naisumiteng ulat' : 'No reports submitted')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('no_reports_yet_desc') ||
              (language === 'tl'
                ? 'Wala ka pang naisusumiteng ulat. Dito lalabas ang mga ulat na ipapadala mo tungkol sa mga user o job post.'
                : 'You have not submitted any reports yet. Reports you submit on users or job posts will appear here.')}
          </Text>
        </View>
      ) : (
        <FlatList
          data={reports}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderReportItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: Math.max(insets.bottom, 24) + 16 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isFetching && !isLoading}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

export default MyReportsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.60)',
    backgroundColor: colors.paperBright,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: {
    padding: 16,
    gap: 14,
  },
  card: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.80)',
    padding: 16,
    ...shadows.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
  },
  headerLeft: {
    flex: 1,
  },
  targetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 6,
  },
  targetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.paperCream,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  targetBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  targetLabel: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.ink,
    flexShrink: 1,
  },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reasonText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
  dateDot: {
    color: colors.inkMuted,
    fontSize: 12,
  },
  dateText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  cardBody: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(241, 245, 249, 0.90)',
    paddingTop: 10,
  },
  descriptionText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
  evidenceContainer: {
    marginTop: 12,
  },
  evidenceTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
    marginBottom: 8,
  },
  evidenceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  evidenceImage: {
    width: 72,
    height: 72,
    borderRadius: 8,
    backgroundColor: colors.paperCream,
  },
  adminResponseBox: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  adminResponseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  adminResponseTitle: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: '#15803D',
  },
  adminResponseText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: '#166534',
    lineHeight: 18,
  },
  resolvedDateText: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#15803D',
    marginTop: 6,
    opacity: 0.8,
  },
  adminResolvedNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  adminResolvedNoteText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    flex: 1,
  },
  underReviewBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  underReviewText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  expandToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  expandToggleText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.primary,
  },
});
