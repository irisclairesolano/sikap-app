import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Message } from '../../types';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../api/client';

interface ActionCardProps {
  message: Message;
  currentUserId: number;
  currentUserRole: 'worker' | 'employer';
  conversationId: number;
  onActionComplete: () => void;
}

const ActionCard: React.FC<ActionCardProps> = ({
  message,
  currentUserRole,
  conversationId,
  onActionComplete,
}) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [priceInput, setPriceInput] = useState('');
  const [showPhone, setShowPhone] = useState(false);

  if (message.message_type !== 'action_card' || !message.card_type) return null;

  const { card_type, card_data, card_resolved } = message;

  if (card_resolved) {
    let title = 'Action';
    if (card_type === 'confirm_hire') title = 'Hire Confirmed';
    if (card_type === 'accept_or_reject') title = 'Offer Responded';
    if (card_type === 'cancel_hire') title = 'Hire Canceled';
    if (card_type === 'mark_complete') title = 'Job Marked Complete';
    if (card_type === 'flag_offline') title = 'Job Flagged Offline';
    if (card_type === 'unlock_request') title = 'Chat Reopened';

    return (
      <View style={styles.resolvedCard}>
        <Text style={styles.resolvedText}>✅ {title} — Done</Text>
      </View>
    );
  }

  if (!card_data) return null;

  const handleAction = async (actionId: string, apiCall: () => Promise<any>) => {
    setLoadingAction(actionId);
    try {
      await apiCall();
      onActionComplete();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Action failed.');
    } finally {
      setLoadingAction(null);
    }
  };

  if (card_type === 'confirm_hire') {
    if (currentUserRole === 'worker') {
      return (
        <View style={styles.neutralCard}>
          <Text style={styles.neutralText}>Waiting for employer to set the final price…</Text>
        </View>
      );
    }
    return (
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="cash-outline" size={20} color={colors.ink} />
            <Text style={styles.title}>Set Final Price & Confirm Hire</Text>
          </View>
          <Text style={styles.subtitle}>{String(card_data.job_title ?? '')}</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter agreed price (₱)"
            placeholderTextColor={colors.inkLight}
            keyboardType="numeric"
            value={priceInput}
            onChangeText={setPriceInput}
          />
          <TouchableOpacity
            style={[styles.primaryButton, { marginTop: 12 }]}
            onPress={() => {
              const price = parseFloat(priceInput);
              if (isNaN(price) || price <= 0) {
                Alert.alert('Invalid Price', 'Please enter a valid price.');
                return;
              }
              handleAction('confirm', () =>
                apiClient(`/applications/${String(card_data.application_id)}/confirm`, {
                  method: 'PATCH',
                  body: JSON.stringify({ final_agreed_price: price }),
                }),
              );
            }}
            disabled={!!loadingAction}
          >
            {loadingAction === 'confirm' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Confirm Hire →</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (card_type === 'accept_or_reject') {
    if (currentUserRole === 'employer') {
      return (
        <View style={styles.neutralCard}>
          <Text style={styles.neutralText}>Waiting for worker's response…</Text>
        </View>
      );
    }
    return (
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="document-text-outline" size={20} color={colors.ink} />
            <Text style={styles.title}>Job Offer</Text>
          </View>
          <Text style={styles.subtitle}>Agreed price: ₱{String(card_data.price ?? '')}</Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.success }]}
              onPress={() =>
                handleAction('accept', () =>
                  apiClient(`/applications/${String(card_data.application_id)}/accept`, {
                    method: 'PATCH',
                  }),
                )
              }
              disabled={!!loadingAction}
            >
              {loadingAction === 'accept' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.actionBtnText}>✓ Accept Offer</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.error }]}
              onPress={() =>
                handleAction('reject', () =>
                  apiClient(`/applications/${String(card_data.application_id)}/reject`, {
                    method: 'PATCH',
                  }),
                )
              }
              disabled={!!loadingAction}
            >
              {loadingAction === 'reject' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.actionBtnText}>✗ Reject Offer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  if (card_type === 'cancel_hire') {
    if (currentUserRole === 'worker') return null;
    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: colors.error }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="close-circle-outline" size={20} color={colors.error} />
            <Text style={styles.title}>Cancel Hire</Text>
          </View>
          <Text style={styles.subtitle}>You can cancel this hire before the worker accepts.</Text>
          <TouchableOpacity
            style={styles.outlineButtonError}
            onPress={() => {
              Alert.alert('Cancel Hire', 'Are you sure?', [
                { text: 'No' },
                {
                  text: 'Yes',
                  style: 'destructive',
                  onPress: () =>
                    handleAction('cancel', () =>
                      apiClient(`/applications/${String(card_data.application_id)}/cancel-hire`, {
                        method: 'PATCH',
                      }),
                    ),
                },
              ]);
            }}
            disabled={!!loadingAction}
          >
            {loadingAction === 'cancel' ? (
              <ActivityIndicator color={colors.error} />
            ) : (
              <Text style={styles.outlineButtonErrorText}>Cancel Hire</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (card_type === 'employer_contact_reveal') {
    if (currentUserRole === 'employer') return null;
    return (
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="call-outline" size={20} color={colors.ink} />
            <Text style={styles.title}>Employer Contact</Text>
          </View>
          <Text style={styles.subtitle}>{String(card_data.employer_name ?? '')}</Text>
          {showPhone ? (
            <Text selectable style={styles.phoneText}>
              {String(card_data.phone ?? '')}
            </Text>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowPhone(true)}>
              <Text style={styles.primaryButtonText}>View Phone Number</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (card_type === 'worker_contact_reveal') {
    if (currentUserRole === 'worker') return null;
    return (
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="call-outline" size={20} color={colors.ink} />
            <Text style={styles.title}>Worker Contact</Text>
          </View>
          <Text style={styles.subtitle}>{String(card_data.worker_name ?? '')}</Text>
          {showPhone ? (
            <Text selectable style={styles.phoneText}>
              {String(card_data.phone ?? '')}
            </Text>
          ) : (
            <TouchableOpacity style={styles.primaryButton} onPress={() => setShowPhone(true)}>
              <Text style={styles.primaryButtonText}>View Phone Number</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  if (card_type === 'mark_complete') {
    if (currentUserRole === 'worker') return null;
    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: colors.success }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="checkmark-circle-outline" size={20} color={colors.success} />
            <Text style={styles.title}>Mark Job as Complete</Text>
          </View>
          <Text style={styles.subtitle}>Tap when the job has been fully completed.</Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.success }]}
            onPress={() => {
              Alert.alert('Mark Complete', 'Is the job done?', [
                { text: 'No' },
                {
                  text: 'Yes',
                  onPress: () =>
                    handleAction('complete', () =>
                      apiClient(`/applications/${String(card_data.application_id)}/mark-complete`, {
                        method: 'PATCH',
                      }).catch(() =>
                        apiClient(`/jobs/${String(card_data.job_id)}/complete`, {
                          method: 'PATCH',
                        }),
                      ),
                    ),
                },
              ]);
            }}
            disabled={!!loadingAction}
          >
            {loadingAction === 'complete' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Mark as Complete ✓</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (card_type === 'flag_offline') {
    if (currentUserRole === 'employer') return null;
    return (
      <View style={styles.card}>
        <View style={[styles.accentBar, { backgroundColor: colors.warning }]} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="flag-outline" size={20} color={colors.warning} />
            <Text style={styles.title}>Flag as Done / Offline</Text>
          </View>
          <Text style={styles.subtitle}>
            Use this if the job is done but the employer hasn't confirmed.
          </Text>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.warning }]}
            onPress={() => {
              Alert.alert('Flag Complete', 'Are you sure?', [
                { text: 'No' },
                {
                  text: 'Yes',
                  onPress: () =>
                    handleAction('flag', () =>
                      apiClient(`/jobs/${String(card_data.job_id)}/flag-offline`, {
                        method: 'POST',
                      }),
                    ),
                },
              ]);
            }}
            disabled={!!loadingAction}
          >
            {loadingAction === 'flag' ? (
              <ActivityIndicator color={colors.white} />
            ) : (
              <Text style={styles.primaryButtonText}>Flag as Complete</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (card_type === 'unlock_request') {
    if (currentUserRole === 'worker') {
      return (
        <View style={styles.neutralCard}>
          <Text style={styles.neutralText}>
            Your request to reopen has been sent. Waiting for employer…
          </Text>
        </View>
      );
    }
    return (
      <View style={styles.card}>
        <View style={styles.accentBar} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Ionicons name="lock-open-outline" size={20} color={colors.ink} />
            <Text style={styles.title}>Chat Reopen Request</Text>
          </View>
          <Text style={styles.subtitle}>
            {String(card_data.worker_name ?? '')} wants to reopen this conversation.
          </Text>
          <View style={styles.rowButtons}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.primary }]}
              onPress={() =>
                handleAction('unlock', () =>
                  apiClient(`/conversations/${conversationId}/unlock`, { method: 'PATCH' }),
                )
              }
              disabled={!!loadingAction}
            >
              {loadingAction === 'unlock' ? (
                <ActivityIndicator color={colors.white} />
              ) : (
                <Text style={styles.actionBtnText}>Unlock Chat</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionBtn,
                { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.inkFaint },
              ]}
              onPress={() => onActionComplete()}
            >
              <Text style={[styles.actionBtnText, { color: colors.ink }]}>Dismiss</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.inkFaint,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  accentBar: {
    width: 4,
    backgroundColor: colors.primary,
  },
  content: {
    padding: 16,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 15,
    color: colors.ink,
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkMuted,
    marginTop: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.inkFaint,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.ink,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  rowButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionBtn: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionBtnText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  outlineButtonError: {
    borderWidth: 1,
    borderColor: colors.error,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  outlineButtonErrorText: {
    color: colors.error,
    fontFamily: fonts.bodyBold,
    fontSize: 14,
  },
  resolvedCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    backgroundColor: colors.paper,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  resolvedText: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.inkMuted,
  },
  neutralCard: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    alignItems: 'center',
  },
  neutralText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
  },
  phoneText: {
    fontFamily: fonts.bodyBold,
    fontSize: 16,
    color: colors.ink,
    marginTop: 12,
    padding: 12,
    backgroundColor: colors.paper,
    borderRadius: 8,
    textAlign: 'center',
  },
});

export default ActionCard;
