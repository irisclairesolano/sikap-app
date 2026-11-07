/**
 * ============================================================================
 * MODULE: RootNavigator (src/navigation/RootNavigator.tsx)
 * ============================================================================
 *
 * (a) Screen / Module Role in the SIKAP Mobile App:
 *     Acts as the top-level security gatekeeper and role-based router for the
 *     entire mobile application. Before any Worker or Employer screen can mount,
 *     RootNavigator evaluates authentication state, account suspension status,
 *     6-digit email OTP verification, government ID document approval, and
 *     role-profile onboarding completion.
 *
 * (b) Key State & Hooks Used:
 *     - `useAuthCheck()`: Hydrates and validates the current user session from
 *       Expo SecureStore and the `/profile` API endpoint.
 *     - `usePushNotifications()`: Registers the device's Expo Push Token and
 *       manages foreground notification listeners.
 *     - `useRealtimeUserEvents(user?.id)`: Establishes a persistent Pusher
 *       WebSocket subscription (`private-user.{id}`) at the root level so admin
 *       verification approvals, chat messages, and reputation updates reflect
 *       live without requiring an app restart.
 *     - `activeBanner`: Local state driving the global in-app toast banner
 *       overlay when real-time notifications arrive in the foreground.
 *
 * (c) UI <-> React Query <-> Pusher WebSockets <-> Laravel REST API Data Flow:
 *     1. On app launch, `useAuthCheck()` reads the cached JWT token and fetches
 *        the latest user profile from the Laravel REST API (`GET /api/v1/profile`).
 *     2. Once authenticated, `usePushNotifications()` obtains an Expo Push Token
 *        and syncs it to Laravel (`PUT /api/v1/profile` with `expo_push_token`).
 *     3. `useRealtimeUserEvents` listens to Laravel broadcasts via Pusher. When
 *        an administrator approves or rejects an ID on the web dashboard, the
 *        `user.verification.updated` WebSocket event mutates the React Query
 *        `['profile']` cache and triggers `notifyAuthChanged()`, automatically
 *        advancing the user from `PendingVerify` into `RoleOnboarding` or their
 *        main role navigator (`WorkerNavigator` / `EmployerNavigator`).
 * ============================================================================
 */
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import {
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthCheck } from '../hooks/useAuthCheck';
import { useAuth } from '../hooks/useAuth';
import {
  usePushNotifications,
  subscribeToInAppBanner,
  InAppBannerPayload,
} from '../hooks/usePushNotifications';
import { profileApi } from '../api/profile';
import AuthNavigator from './AuthNavigator';
import { AuthStackParamList } from './authTypes';
import EmployerNavigator from './EmployerNavigator';
import WorkerNavigator from './WorkerNavigator';
import RoleOnboardingScreen from '../screens/common/RoleOnboardingScreen';
import { colors, fonts } from '../theme';
import { getGuestInitialRoute } from '../store/authEvents';

export type RootStackParamList = {
  Auth: undefined;
  Worker: undefined;
  Employer: undefined;
  RoleOnboarding: { targetRole: 'worker' | 'employer' };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Fallback screen blocking Administrator accounts from using the mobile client.
 * Enforces separation of concerns: Admins manage platform moderation exclusively
 * through the SIKAP Web Admin Dashboard.
 */
const AdminFallback: React.FC = () => {
  const { logout } = useAuth();
  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
        backgroundColor: colors.paper,
      }}
    >
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 24,
          color: colors.ink,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Admin Access
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 16,
          color: colors.inkSoft,
          textAlign: 'center',
          marginBottom: 24,
        }}
      >
        Administrators must use the desktop web dashboard.
      </Text>
      <TouchableOpacity
        onPress={logout}
        style={{
          backgroundColor: colors.ink,
          paddingHorizontal: 24,
          paddingVertical: 12,
          borderRadius: 100,
        }}
      >
        <Text style={{ color: colors.white, fontFamily: fonts.bodyBold }}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const SuspendedFallback: React.FC = () => {
  const { logout } = useAuth();
  const [showAppealModal, setShowAppealModal] = React.useState(false);
  const [appealMessage, setAppealMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [appealSent, setAppealSent] = React.useState(false);

  const handleSendAppeal = async () => {
    if (!appealMessage.trim()) return;
    try {
      setIsSubmitting(true);
      const { apiClient } = await import('../api/client');
      await apiClient('/support', {
        method: 'POST',
        body: JSON.stringify({
          subject: 'Appeal Account Suspension',
          message: appealMessage.trim(),
        }),
      });
      setAppealSent(true);
      setAppealMessage('');
    } catch {
      // Ignore or let user retry
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
        backgroundColor: colors.paper,
      }}
    >
      <View
        style={{
          width: 80,
          height: 80,
          backgroundColor: colors.status.rejected.bg,
          borderRadius: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: 24,
          borderWidth: 2,
          borderColor: colors.error,
        }}
      >
        <Ionicons name="lock-closed" size={40} color={colors.error} />
      </View>
      <Text
        style={{
          fontFamily: fonts.display,
          fontSize: 26,
          color: colors.ink,
          marginBottom: 12,
          textAlign: 'center',
        }}
      >
        Account Suspended
      </Text>
      <Text
        style={{
          fontFamily: fonts.body,
          fontSize: 15,
          color: colors.inkSoft,
          textAlign: 'center',
          lineHeight: 22,
          marginBottom: 32,
        }}
      >
        Your SIKAP account has been suspended for violating our platform community guidelines and
        policies. You cannot view, post, or apply to any job opportunities.
      </Text>

      <TouchableOpacity
        onPress={() => setShowAppealModal(true)}
        activeOpacity={0.8}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          backgroundColor: colors.paperBright,
          borderWidth: 1.5,
          borderColor: colors.primary,
          paddingHorizontal: 24,
          paddingVertical: 14,
          borderRadius: 100,
          marginBottom: 14,
          width: '100%',
          justifyContent: 'center',
        }}
      >
        <Ionicons name="chatbubbles-outline" size={18} color={colors.primary} />
        <Text style={{ color: colors.primary, fontFamily: fonts.bodyBold, fontSize: 15 }}>
          File an Appeal / Contact Support
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={logout}
        activeOpacity={0.8}
        style={{
          backgroundColor: colors.error,
          paddingHorizontal: 32,
          paddingVertical: 14,
          borderRadius: 100,
          width: '100%',
          alignItems: 'center',
          shadowColor: colors.error,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.2,
          shadowRadius: 8,
          elevation: 4,
        }}
      >
        <Text style={{ color: colors.white, fontFamily: fonts.bodyBold, fontSize: 15 }}>
          Log Out
        </Text>
      </TouchableOpacity>

      {/* Appeal Support Modal */}
      <Modal
        visible={showAppealModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAppealModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.5)',
            justifyContent: 'flex-end',
          }}
        >
          <View
            style={{
              backgroundColor: colors.paperBright,
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              padding: 24,
              paddingBottom: 36,
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 16,
              }}
            >
              <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.ink }}>
                Appeal Suspension
              </Text>
              <TouchableOpacity onPress={() => setShowAppealModal(false)}>
                <Ionicons name="close" size={24} color={colors.inkMuted} />
              </TouchableOpacity>
            </View>

            {appealSent ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <Ionicons name="checkmark-circle" size={48} color="#15803D" />
                <Text
                  style={{
                    fontFamily: fonts.bodyBold,
                    fontSize: 16,
                    color: colors.ink,
                    marginTop: 12,
                  }}
                >
                  Appeal Submitted
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: colors.inkSoft,
                    textAlign: 'center',
                    marginTop: 6,
                    lineHeight: 18,
                  }}
                >
                  Your appeal has been received. Our admin team will review your account history and
                  resolve the ticket.
                </Text>
                <TouchableOpacity
                  onPress={() => setShowAppealModal(false)}
                  style={{
                    marginTop: 20,
                    backgroundColor: colors.primary,
                    paddingHorizontal: 24,
                    paddingVertical: 12,
                    borderRadius: 12,
                  }}
                >
                  <Text style={{ fontFamily: fonts.bodyBold, color: '#fff', fontSize: 14 }}>
                    Close
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                <Text
                  style={{
                    fontFamily: fonts.body,
                    fontSize: 13,
                    color: colors.inkSoft,
                    marginBottom: 14,
                    lineHeight: 18,
                  }}
                >
                  Please provide details explaining why you believe your account suspension was a
                  mistake or request a manual review from administrators.
                </Text>

                <TextInput
                  style={{
                    backgroundColor: colors.paper,
                    borderWidth: 1,
                    borderColor: colors.inkFaint,
                    borderRadius: 12,
                    padding: 14,
                    fontFamily: fonts.body,
                    fontSize: 14,
                    color: colors.ink,
                    minHeight: 120,
                    textAlignVertical: 'top',
                    marginBottom: 18,
                  }}
                  placeholder="Explain your situation in detail..."
                  placeholderTextColor={colors.inkMuted}
                  value={appealMessage}
                  onChangeText={setAppealMessage}
                  multiline
                  numberOfLines={5}
                />

                <TouchableOpacity
                  onPress={handleSendAppeal}
                  disabled={isSubmitting || !appealMessage.trim()}
                  activeOpacity={0.8}
                  style={{
                    backgroundColor:
                      isSubmitting || !appealMessage.trim() ? colors.inkFaint : colors.primary,
                    paddingVertical: 14,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {isSubmitting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={{ fontFamily: fonts.bodyBold, color: '#fff', fontSize: 15 }}>
                      Submit Appeal
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const RootNavigator: React.FC = () => {
  const { user, isLoading, isVerified } = useAuthCheck();
  const { expoPushToken } = usePushNotifications();
  const [activeBanner, setActiveBanner] = React.useState<InAppBannerPayload | null>(null);

  // Subscribe to real-time events at the root level for immediate cache invalidation & live approval
  const { useRealtimeUserEvents } = require('../services/realtime');
  useRealtimeUserEvents(user?.id);

  React.useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeToInAppBanner((payload) => {
      setActiveBanner(payload);
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        setActiveBanner(null);
      }, 4500);
    });
    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);

  React.useEffect(() => {
    if (user && expoPushToken) {
      profileApi.updateProfile({ expo_push_token: expoPushToken.data }).catch((err) => {
        console.error('Failed to update push token:', err);
      });
    }
  }, [user?.id, expoPushToken?.data]);

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.paper,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text
          style={{
            marginTop: 16,
            fontFamily: fonts.bodySemiBold,
            fontSize: 14,
            color: colors.inkMuted,
            letterSpacing: 0.5,
          }}
        >
          Loading SIKAP...
        </Text>
      </View>
    );
  }

  // ==========================================================================
  // MULTI-STAGE AUTHENTICATION & IDENTITY VERIFICATION GATING PIPELINE
  // ==========================================================================
  // Enforces platform trust & safety before granting access to job feeds:
  //   Stage A: Unauthenticated guests -> AuthNavigator (Login / Register)
  //   Stage B: Role & Moderation Guards -> AdminFallback / SuspendedFallback
  //   Stage C: 6-Digit Email OTP Verification -> OTPVerify screen
  //   Stage D: Government ID Upload & Admin KYC Review -> IDUpload / PendingVerify
  //   Stage E: Role Profile Onboarding -> RoleOnboardingScreen (Skills / Business info)
  // ==========================================================================

  if (!user) {
    const guestRoute = getGuestInitialRoute();
    return <AuthNavigator key={`guest-${guestRoute}`} initialRouteName={guestRoute} />;
  }

  if (user.role === 'admin') {
    return <AdminFallback />;
  }

  if (user.is_suspended) {
    return <SuspendedFallback />;
  }

  // 1. Email verification gating (All users must verify 6-digit OTP first)
  const status = user.registration_status;
  if (status === 'pending_email_verification') {
    return (
      <AuthNavigator
        key={`pending-otp-${user.id}`}
        initialRouteName="OTPVerify"
        initialParams={{ userId: user.id, email: user.email, role: user.role || 'worker' }}
      />
    );
  }

  // 2. Rejection gating (Workers & Employers whose application was rejected)
  const isRejected = status === 'rejected' || user.verification_status === 'rejected';
  if (isRejected) {
    return <AuthNavigator key={`rejected-${user.id}`} initialRouteName="PendingVerify" />;
  }

  // 3. Pending Verification Review gating (Workers & Employers who submitted documents awaiting admin approval)
  if (status === 'pending_review') {
    return (
      <AuthNavigator
        key={`pending-review-${user.id}`}
        initialRouteName="PendingVerify"
        initialParams={undefined}
      />
    );
  }

  // 4. ID Upload gating for both Workers & Employers (Both must upload government ID before access)
  if (
    !isVerified &&
    (status === 'pending_id_upload' ||
      (!status && !user.document_url) ||
      (user.verification_status === 'pending' && !user.document_url))
  ) {
    return (
      <AuthNavigator
        key={`pending-id-${user.id}-${status}`}
        initialRouteName="IDUpload"
        initialParams={{ userId: user.id, role: user.role }}
      />
    );
  }
  if (!isVerified && !status && user.document_url) {
    return (
      <AuthNavigator
        key={`pending-verify-${user.id}-${status}`}
        initialRouteName="PendingVerify"
        initialParams={undefined}
      />
    );
  }

  // 5. Role-Specific Profile Completeness Check:
  //    Verified workers must have at least one skill tag configured, and
  //    verified employers must have an initialized employer profile record.
  const workerSkills = user.worker_profile?.skills || (user as any).workerProfile?.skills || [];
  const hasEmployerProf =
    user.has_employer_profile || !!user.employer_profile || !!(user as any).employerProfile;
  const hasWorkerProf =
    (user.has_worker_profile || !!user.worker_profile || !!(user as any).workerProfile) &&
    workerSkills.length > 0;

  const needsOnboarding =
    (user.role === 'worker' && !hasWorkerProf) || (user.role === 'employer' && !hasEmployerProf);

  return (
    <View style={{ flex: 1 }}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {needsOnboarding ? (
          <Stack.Screen
            name="RoleOnboarding"
            component={RoleOnboardingScreen}
            initialParams={{ targetRole: user.role }}
          />
        ) : user.role === 'worker' ? (
          <Stack.Screen name="Worker" component={WorkerNavigator} />
        ) : user.role === 'employer' ? (
          <Stack.Screen name="Employer" component={EmployerNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>

      {/* Global Foreground In-App Notification Banner Overlay */}

      {activeBanner && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => setActiveBanner(null)}
          style={{
            position: 'absolute',
            top: Platform.OS === 'ios' ? 54 : 38,
            left: 16,
            right: 16,
            backgroundColor: '#FFFFFF',
            borderRadius: 14,
            paddingVertical: 12,
            paddingHorizontal: 14,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            borderWidth: 1,
            borderColor: '#E2E8F0',
            borderLeftWidth: 4,
            borderLeftColor: colors.primary,
            shadowColor: '#0F172A',
            shadowOffset: { width: 0, height: 6 },
            shadowOpacity: 0.14,
            shadowRadius: 12,
            elevation: 10,
            zIndex: 9999,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: colors.peach,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Ionicons name="notifications" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              numberOfLines={1}
              style={{
                fontFamily: fonts.bodyBold,
                fontSize: 13,
                color: colors.ink,
              }}
            >
              {activeBanner.title}
            </Text>
            <Text
              numberOfLines={2}
              style={{
                fontFamily: fonts.body,
                fontSize: 12,
                color: colors.inkMuted,
                marginTop: 2,
                lineHeight: 16,
              }}
            >
              {activeBanner.body}
            </Text>
          </View>
          <Ionicons name="close" size={18} color={colors.inkSoft} />
        </TouchableOpacity>
      )}
    </View>
  );
};

export default RootNavigator;
