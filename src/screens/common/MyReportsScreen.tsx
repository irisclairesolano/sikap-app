import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLanguage } from '../../contexts/LanguageContext';
import { markReportsViewed, useMyReports } from '../../hooks/useReports';
import { colors, fonts, shadows } from '../../theme';
import { UserReportItem } from '../../api/reports';

type StatusFilter = 'all' | 'pending' | 'investigating' | 'resolved' | 'dismissed';

const formatReportDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatReasonLabel = (type?: string, language?: string) => {
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
  const queryClient = useQueryClient();
  const isTagalog = language === 'tl';

  const [expandedReportId, setExpandedReportId] = useState<number | null>(null);
  const [selectedFilter, setSelectedFilter] = useState<StatusFilter>('all');

  const { data, isLoading, isError, isFetching, refetch } = useMyReports();
  const rawReports = Array.isArray(data) ? data : (data as any)?.data;
  const reports: UserReportItem[] = Array.isArray(rawReports) ? rawReports : [];

  // Refetch immediately when screen is focused and clear the red dot badge
  useFocusEffect(
    useCallback(() => {
      refetch();
      markReportsViewed();
      queryClient.setQueryData(['reports-badge'], false);
      queryClient.invalidateQueries({ queryKey: ['reports-badge'] });
    }, [refetch, queryClient]),
  );

  // Status mapping and styling
  const getStatusDetails = (status: UserReportItem['status']) => {
    switch (status) {
      case 'resolved':
        return {
          key: 'resolved',
          label: isTagalog ? 'Naaksyunan Na' : 'Resolved',
          shortLabel: isTagalog ? 'Naaksyunan' : 'Resolved',
          bg: '#DCFCE7',
          text: '#15803D',
          border: '#86EFAC',
          icon: 'checkmark-circle' as const,
          explanation: isTagalog
            ? 'Nasuri na ng admin at naisagawa na ang kaukulang aksyon sa iniulat.'
            : 'Moderation review complete. Admin has taken appropriate action regarding this report.',
        };
      case 'investigating':
        return {
          key: 'investigating',
          label: isTagalog ? 'Iniimbestigahan' : 'Under Investigation',
          shortLabel: isTagalog ? 'Sinisiyasat' : 'Investigating',
          bg: '#DBEAFE',
          text: '#1D4ED8',
          border: '#93C5FD',
          icon: 'search' as const,
          explanation: isTagalog
            ? 'Kasalukuyang sinusuri at iniimbestigahan ng moderation team ang iniulat na gawain o nilalaman.'
            : 'Moderation team is actively investigating the reported user, activity, or job posting.',
        };
      case 'dismissed':
        return {
          key: 'dismissed',
          label: isTagalog ? 'Hindi Pinagtibay' : 'Dismissed',
          shortLabel: isTagalog ? 'Dismissed' : 'Dismissed',
          bg: '#F1F5F9',
          text: '#64748B',
          border: '#CBD5E1',
          icon: 'close-circle' as const,
          explanation: isTagalog
            ? 'Natapos ang pagsusuri at napag-alamang walang paglabag sa mga patakaran ng komunidad.'
            : 'Review completed. Moderation concluded that no violation of community guidelines occurred.',
        };
      case 'open':
      case 'pending':
      default:
        return {
          key: 'pending',
          label: isTagalog ? 'Kasalukuyang Sinusuri' : 'Pending Review',
          shortLabel: isTagalog ? 'Pending' : 'Pending',
          bg: '#FEF3C7',
          text: '#B45309',
          border: '#FCD34D',
          icon: 'time' as const,
          explanation: isTagalog
            ? 'Naisumite na ang ulat at nakapila para sa pagsusuri ng aming moderation team.'
            : 'Your report has been submitted and is queued for moderation review.',
        };
    }
  };

  const getTargetTypeBadge = (reportableType: string) => {
    const norm = (reportableType || '').toLowerCase();
    if (norm.includes('job')) {
      return {
        label: isTagalog ? 'Ulat sa Job Post' : 'Job Post',
        icon: 'briefcase-outline' as const,
      };
    }
    return {
      label: isTagalog ? 'Ulat sa Gumagamit' : 'User',
      icon: 'person-outline' as const,
    };
  };

  // Filtered reports
  const filteredReports = useMemo(() => {
    if (selectedFilter === 'all') return reports;
    if (selectedFilter === 'pending') {
      return reports.filter((r) => r.status === 'open' || r.status === 'pending');
    }
    return reports.filter((r) => r.status === selectedFilter);
  }, [reports, selectedFilter]);

  // Counts for tabs
  const counts = useMemo(() => {
    return {
      all: reports.length,
      pending: reports.filter((r) => r.status === 'open' || r.status === 'pending').length,
      investigating: reports.filter((r) => r.status === 'investigating').length,
      resolved: reports.filter((r) => r.status === 'resolved').length,
      dismissed: reports.filter((r) => r.status === 'dismissed').length,
    };
  }, [reports]);

  const renderReportItem = ({ item }: { item: UserReportItem }) => {
    const isExpanded = expandedReportId === item.id;
    const statusDetails = getStatusDetails(item.status);
    const targetInfo = getTargetTypeBadge(item.reportable_type);
    const reasonLabel = formatReasonLabel(item.type, language);

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
            style={[
              styles.statusBadge,
              { backgroundColor: statusDetails.bg, borderColor: statusDetails.border },
            ]}
          >
            <Ionicons
              name={statusDetails.icon}
              size={12}
              color={statusDetails.text}
              style={{ marginRight: 4 }}
            />
            <Text style={[styles.statusBadgeText, { color: statusDetails.text }]}>
              {statusDetails.label}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Details & Status Context */}
        <View style={styles.cardBody}>
          <Text style={styles.descriptionText} numberOfLines={isExpanded ? undefined : 3}>
            {item.description ||
              (isTagalog ? 'Walang karagdagang detalye.' : 'No description provided.')}
          </Text>

          {/* Status Explanation Box */}
          <View
            style={[
              styles.statusContextBox,
              { backgroundColor: statusDetails.bg + '40', borderColor: statusDetails.border },
            ]}
          >
            <Ionicons
              name={statusDetails.icon}
              size={15}
              color={statusDetails.text}
              style={{ marginTop: 1 }}
            />
            <Text style={[styles.statusContextText, { color: statusDetails.text }]}>
              {statusDetails.explanation}
            </Text>
          </View>

          {/* Screenshots Preview if any */}
          {item.evidence_urls && item.evidence_urls.length > 0 && isExpanded && (
            <View style={styles.evidenceContainer}>
              <Text style={styles.evidenceTitle}>
                {isTagalog ? 'Mga Naka-attach na Screenshot:' : 'Attached Evidence:'}
              </Text>
              <View style={styles.evidenceGrid}>
                {item.evidence_urls.map((url, idx) => (
                  <Image key={idx} source={{ uri: url }} style={styles.evidenceImage} />
                ))}
              </View>
            </View>
          )}

          {/* Reporter-visible Admin Response Box */}
          {item.admin_response ? (
            <View style={styles.adminResponseBox}>
              <View style={styles.adminResponseHeader}>
                <Ionicons name="shield-checkmark" size={16} color="#15803D" />
                <Text style={styles.adminResponseTitle}>
                  {isTagalog ? 'Tugon ng Administrator' : 'Administrator Response'}
                </Text>
              </View>
              <Text style={styles.adminResponseText}>{item.admin_response}</Text>
              {item.resolved_at && (
                <Text style={styles.resolvedDateText}>
                  {isTagalog ? 'Naaksyunan noong ' : 'Action taken on '}
                  {formatReportDate(item.resolved_at)}
                </Text>
              )}
            </View>
          ) : null}

          {/* Expand / Collapse toggle */}
          {item.description && item.description.length > 100 && (
            <TouchableOpacity
              onPress={() => setExpandedReportId(isExpanded ? null : item.id)}
              style={styles.expandToggle}
              activeOpacity={0.7}
            >
              <Text style={styles.expandToggleText}>
                {isExpanded
                  ? isTagalog
                    ? 'Ipakita nang mas maikli'
                    : 'Show less'
                  : isTagalog
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

  const filterTabs: { key: StatusFilter; label: string; count: number }[] = [
    { key: 'all', label: isTagalog ? 'Lahat' : 'All', count: counts.all },
    { key: 'pending', label: isTagalog ? 'Pending' : 'Pending', count: counts.pending },
    {
      key: 'investigating',
      label: isTagalog ? 'Iniimbestigahan' : 'In Review',
      count: counts.investigating,
    },
    { key: 'resolved', label: isTagalog ? 'Naaksyunan' : 'Resolved', count: counts.resolved },
    { key: 'dismissed', label: isTagalog ? 'Dismissed' : 'Dismissed', count: counts.dismissed },
  ];

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

      {/* Status Filter Tabs */}
      {reports.length > 0 && (
        <View style={styles.filterScrollWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            {filterTabs.map((tab) => {
              const isActive = selectedFilter === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                  onPress={() => setSelectedFilter(tab.key)}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
                    {tab.label}
                  </Text>
                  {tab.count > 0 && (
                    <View
                      style={[styles.filterBadgeCount, isActive && styles.filterBadgeCountActive]}
                    >
                      <Text
                        style={[
                          styles.filterBadgeCountText,
                          isActive && styles.filterBadgeCountTextActive,
                        ]}
                      >
                        {tab.count}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError && reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="alert-circle-outline" size={32} color={colors.error} />
          </View>
          <Text style={styles.emptyTitle}>
            {isTagalog ? 'Hindi ma-load ang mga ulat' : 'Failed to load reports'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isTagalog
              ? 'Nagkaroon ng problema sa pagkuha ng iyong mga ulat. Pakisubukan muli.'
              : 'There was a problem loading your reports. Please try again.'}
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={styles.retryBtn}>
            <Text style={styles.retryBtnText}>{isTagalog ? 'Subukan Muli' : 'Retry'}</Text>
          </TouchableOpacity>
        </View>
      ) : reports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconCircle}>
            <Ionicons name="flag-outline" size={32} color={colors.primary} />
          </View>
          <Text style={styles.emptyTitle}>
            {t('no_reports_yet') ||
              (isTagalog ? 'Wala pang naisumiteng ulat' : 'No reports submitted')}
          </Text>
          <Text style={styles.emptySubtitle}>
            {t('no_reports_yet_desc') ||
              (isTagalog
                ? 'Wala ka pang naisusumiteng ulat. Dito lalabas ang mga ulat na ipapadala mo tungkol sa mga user o job post.'
                : 'You have not submitted any reports yet. Reports you submit on users or job posts will appear here.')}
          </Text>
        </View>
      ) : filteredReports.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconCircle, { backgroundColor: colors.paperCream }]}>
            <Ionicons name="filter-outline" size={30} color={colors.inkMuted} />
          </View>
          <Text style={styles.emptyTitle}>
            {isTagalog ? 'Walang ulat sa kategoryang ito' : 'No reports in this status'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {isTagalog
              ? 'Wala kang ulat na may ganitong status sa kasalukuyan.'
              : 'You do not have any reports under the selected status filter.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredReports}
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
  filterScrollWrapper: {
    backgroundColor: colors.paperBright,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.60)',
  },
  filterRow: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.paperCream,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.80)',
    gap: 6,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: colors.inkSoft,
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  filterBadgeCount: {
    backgroundColor: 'rgba(15, 23, 42, 0.08)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 10,
  },
  filterBadgeCountActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeCountText: {
    fontFamily: fonts.bodyBold,
    fontSize: 10,
    color: colors.ink,
  },
  filterBadgeCountTextActive: {
    color: '#FFFFFF',
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
  retryBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
  },
  retryBtnText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.white,
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
  statusContextBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    marginTop: 10,
    gap: 8,
  },
  statusContextText: {
    fontFamily: fonts.body,
    fontSize: 12,
    flex: 1,
    lineHeight: 17,
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
