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
import { usePushNotifications } from '../hooks/usePushNotifications';
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

  // 4. ID Upload gating for Workers (Workers must upload government ID before working)
  if (
    user.role === 'worker' &&
    !isVerified &&
    (status === 'pending_id_upload' || (!status && !user.document_url))
  ) {
    return (
      <AuthNavigator
        key={`pending-${user.id}-${status}`}
        initialRouteName="IDUpload"
        initialParams={{ userId: user.id, role: user.role }}
      />
    );
  }
  if (user.role === 'worker' && !isVerified && !status && user.document_url) {
    return (
      <AuthNavigator
        key={`pending-${user.id}-${status}`}
        initialRouteName="PendingVerify"
        initialParams={undefined}
      />
    );
  }

  const workerSkills = user.worker_profile?.skills || (user as any).workerProfile?.skills || [];
  const hasEmployerProf =
    user.has_employer_profile || !!user.employer_profile || !!(user as any).employerProfile;
  const hasWorkerProf =
    (user.has_worker_profile || !!user.worker_profile || !!(user as any).workerProfile) &&
    workerSkills.length > 0;

  const needsOnboarding =
    (user.role === 'worker' && !hasWorkerProf) || (user.role === 'employer' && !hasEmployerProf);

  return (
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
  );
};

export default RootNavigator;
