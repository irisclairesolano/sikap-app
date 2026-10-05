import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAlert } from '../../contexts/AlertContext';
import { useCreateSupportTicket, useMySupportTickets } from '../../hooks/useSupportTickets';
import { colors, fonts, shadows } from '../../theme';
import { SupportTicket } from '../../types';
import Button from '../../components/common/Button';

const formatTicketDate = (dateStr?: string | null) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

export const SupportTicketsScreen: React.FC = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<'tickets' | 'new'>('tickets');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [expandedTicketId, setExpandedTicketId] = useState<number | null>(null);

  const { data: tickets = [], isLoading, isFetching, refetch } = useMySupportTickets();
  const { mutate: createTicket, isPending: isSubmitting } = useCreateSupportTicket();

  const handleCreateTicket = () => {
    if (!subject.trim() || !message.trim()) {
      showAlert('Required Fields', 'Please enter both a subject and a description of your issue.');
      return;
    }

    createTicket(
      { subject: subject.trim(), message: message.trim() },
      {
        onSuccess: (res) => {
          setSubject('');
          setMessage('');
          setActiveTab('tickets');
          setExpandedTicketId(res.ticket.id);
          showAlert(
            'Ticket Submitted',
            'Your support ticket has been received. Our admin team will review it and reply directly inside the app.',
          );
        },
        onError: (err: any) => {
          showAlert(
            'Submission Error',
            err.message || 'Unable to submit ticket. Please try again.',
          );
        },
      },
    );
  };

  const getStatusBadge = (status: SupportTicket['status']) => {
    switch (status) {
      case 'resolved':
        return {
          label: 'Resolved',
          bg: '#DCFCE7',
          text: '#15803D',
          border: '#86EFAC',
          icon: 'checkmark-circle' as const,
        };
      case 'processing':
        return {
          label: 'In Review',
          bg: '#DBEAFE',
          text: '#1D4ED8',
          border: '#93C5FD',
          icon: 'time' as const,
        };
      case 'open':
      default:
        return {
          label: 'Open',
          bg: '#FEF3C7',
          text: '#B45309',
          border: '#FCD34D',
          icon: 'chatbubble-ellipses' as const,
        };
    }
  };

  const renderTicketItem = ({ item }: { item: SupportTicket }) => {
    const badge = getStatusBadge(item.status);
    const isExpanded = expandedTicketId === item.id;

    return (
      <TouchableOpacity
        style={[styles.ticketCard, isExpanded && styles.ticketCardExpanded]}
        activeOpacity={0.85}
        onPress={() => setExpandedTicketId(isExpanded ? null : item.id)}
      >
        <View style={styles.cardHeader}>
          <View style={styles.headerLeft}>
            <View
              style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}
            >
              <Ionicons name={badge.icon} size={12} color={badge.text} />
              <Text style={[styles.statusBadgeText, { color: badge.text }]}>{badge.label}</Text>
            </View>
            <Text style={styles.ticketId}>Ticket #{item.id}</Text>
          </View>
          <Text style={styles.ticketDate}>{formatTicketDate(item.created_at)}</Text>
        </View>

        <Text style={styles.ticketSubject} numberOfLines={isExpanded ? undefined : 2}>
          {item.subject}
        </Text>

        <Text
          style={[styles.ticketMessage, !isExpanded && { maxHeight: 42 }]}
          numberOfLines={isExpanded ? undefined : 2}
        >
          {item.message}
        </Text>

        {/* Admin Reply Section */}
        {item.admin_reply ? (
          <View style={styles.replyBox}>
            <View style={styles.replyHeader}>
              <View style={styles.adminTag}>
                <Ionicons name="shield-checkmark" size={13} color="#0D9488" />
                <Text style={styles.adminTagText}>SIKAP Admin Team</Text>
              </View>
              <Text style={styles.replyStatusResolved}>Response Available</Text>
            </View>
            <Text style={styles.replyText}>{item.admin_reply}</Text>
          </View>
        ) : (
          <View style={styles.pendingReplyBox}>
            <Ionicons name="hourglass-outline" size={14} color={colors.inkMuted} />
            <Text style={styles.pendingReplyText}>
              In review by SIKAP admin. Responses will appear here.
            </Text>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.expandHint}>
            {isExpanded ? 'Tap to collapse' : 'Tap to expand full details'}
          </Text>
          <Ionicons
            name={isExpanded ? 'chevron-up' : 'chevron-down'}
            size={14}
            color={colors.inkMuted}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Help & Support</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'tickets' && styles.tabBtnActive]}
          onPress={() => setActiveTab('tickets')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="ticket-outline"
            size={16}
            color={activeTab === 'tickets' ? colors.primary : colors.inkMuted}
          />
          <Text style={[styles.tabText, activeTab === 'tickets' && styles.tabTextActive]}>
            My Tickets {tickets.length > 0 ? `(${tickets.length})` : ''}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabBtn, activeTab === 'new' && styles.tabBtnActive]}
          onPress={() => setActiveTab('new')}
          activeOpacity={0.8}
        >
          <Ionicons
            name="add-circle-outline"
            size={16}
            color={activeTab === 'new' ? colors.primary : colors.inkMuted}
          />
          <Text style={[styles.tabText, activeTab === 'new' && styles.tabTextActive]}>
            New Ticket
          </Text>
        </TouchableOpacity>
      </View>

      {/* Body Content */}
      {activeTab === 'tickets' ? (
        <View style={styles.tabContent}>
          {isLoading && tickets.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.loadingText}>Loading your support tickets...</Text>
            </View>
          ) : (
            <FlatList
              data={tickets}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderTicketItem}
              contentContainerStyle={[
                styles.listContent,
                tickets.length === 0 && { flex: 1, justifyContent: 'center' },
              ]}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={isFetching && !isLoading}
                  onRefresh={refetch}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="chatbubbles-outline" size={38} color={colors.primary} />
                  </View>
                  <Text style={styles.emptyTitle}>No Support Tickets Yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Have a question about a job post, verification, or account? Submit a ticket and
                    our admin team will reply directly in-app.
                  </Text>
                  <Button
                    label="Submit a Support Ticket"
                    variant="primary"
                    size="base"
                    onPress={() => setActiveTab('new')}
                    style={{ marginTop: 18 }}
                  />
                </View>
              }
            />
          )}
        </View>
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <FlatList
              data={[{ key: 'form' }]}
              keyExtractor={(item) => item.key}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.formContent,
                { paddingBottom: Math.max(insets.bottom, 24) + 16 },
              ]}
              renderItem={() => (
                <View>
                  <View style={styles.noticeBox}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                    <Text style={styles.noticeText}>
                      Support is handled directly within SIKAP. Admin replies will be visible on the
                      "My Tickets" tab.
                    </Text>
                  </View>

                  <Text style={styles.label}>Subject</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Question about job status, ID upload, or account"
                    placeholderTextColor={colors.inkMuted}
                    value={subject}
                    onChangeText={setSubject}
                    maxLength={100}
                  />

                  <Text style={styles.label}>Issue Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    placeholder="Provide details about what you need help with..."
                    placeholderTextColor={colors.inkMuted}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    maxLength={1000}
                  />
                  <Text style={styles.charCount}>{message.length}/1000 characters</Text>

                  <Button
                    label="Submit Ticket"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    disabled={isSubmitting || !subject.trim() || !message.trim()}
                    onPress={handleCreateTicket}
                    style={{ marginTop: 24 }}
                  />
                </View>
              )}
            />
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}
    </SafeAreaView>
  );
};

export default SupportTicketsScreen;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.inkFaint,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.paperBright,
    marginHorizontal: 16,
    marginTop: 14,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.inkFaint,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    gap: 6,
  },
  tabBtnActive: {
    backgroundColor: colors.peach,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  tabText: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.inkMuted,
  },
  tabTextActive: {
    color: colors.primary,
  },
  tabContent: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    marginTop: 12,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 24,
    gap: 12,
  },
  ticketCard: {
    backgroundColor: colors.paperBright,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    ...shadows.sm,
  },
  ticketCardExpanded: {
    borderColor: colors.primary,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    letterSpacing: 0.2,
  },
  ticketId: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  ticketDate: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
  },
  ticketSubject: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
    marginBottom: 6,
  },
  ticketMessage: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 19,
    marginBottom: 10,
  },
  replyBox: {
    backgroundColor: '#F0FDFA',
    borderRadius: 12,
    padding: 12,
    marginTop: 6,
    borderLeftWidth: 3,
    borderLeftColor: '#0D9488',
  },
  replyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  adminTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  adminTagText: {
    fontFamily: fonts.bodyBold,
    fontSize: 12,
    color: '#0F766E',
  },
  replyStatusResolved: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: '#047857',
  },
  replyText: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.ink,
    lineHeight: 19,
  },
  pendingReplyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pendingReplyText: {
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkMuted,
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.inkFaint,
  },
  expandHint: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
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
    fontFamily: fonts.display,
    fontSize: 18,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  formContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.peach,
    padding: 12,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(232, 93, 117, 0.2)',
  },
  noticeText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.inkSoft,
    lineHeight: 18,
  },
  label: {
    fontFamily: fonts.bodyBold,
    fontSize: 13,
    color: colors.ink,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.paperBright,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
    marginBottom: 16,
  },
  textArea: {
    minHeight: 120,
    paddingTop: 12,
    marginBottom: 4,
  },
  charCount: {
    fontFamily: fonts.body,
    fontSize: 11,
    color: colors.inkMuted,
    textAlign: 'right',
    marginBottom: 8,
  },
});
