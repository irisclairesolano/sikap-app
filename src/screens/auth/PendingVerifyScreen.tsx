import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, AppState, Linking } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/authTypes';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';
import { useAuthCheck } from '../../hooks/useAuthCheck';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'PendingVerify'>;

const PendingVerifyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const appState = useRef(AppState.currentState);
  const { user } = useAuthCheck();
  const isRejected = user?.registration_status === 'rejected';

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        handleRefresh();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Adding a small delay just to show the spinner briefly
    await new Promise((resolve) => setTimeout(resolve, 500));
    notifyAuthChanged();
    setIsRefreshing(false);
  };

  const signOut = async () => {
    await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    notifyAuthChanged();
  };

  const handleContactUs = () => {
    navigation.navigate('ContactSupport');
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={{ width: 40 }} />
        <TouchableOpacity style={styles.iconBtn} onPress={handleContactUs}>
          <Ionicons name="help-circle-outline" size={26} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View
          style={[styles.iconWrapper, isRejected && { backgroundColor: colors.status.rejected.bg }]}
        >
          <Ionicons
            name={isRejected ? 'alert-circle' : 'hourglass-outline'}
            size={54}
            color={isRejected ? colors.status.rejected.text : colors.primaryDark}
          />
        </View>

        <Text style={styles.title}>
          {isRejected ? (
            <>
              Your ID was{'\n'}
              <Text
                style={[
                  styles.titleItalic,
                  { color: colors.status.rejected.text, fontSize: 30, textTransform: 'lowercase' },
                ]}
              >
                rejected
              </Text>
            </>
          ) : (
            <>
              We're <Text style={styles.titleItalic}>checking</Text>
              {'\n'}your account.
            </>
          )}
        </Text>

        <Text style={styles.body}>
          {isRejected ? (
            user?.rejection_reason ? (
              `Unfortunately, your ID was rejected: ${user.rejection_reason}. Please register again to resubmit clearer photos.`
            ) : (
              'Unfortunately, we could not verify your government ID. This usually happens if the photo was blurry, too dark, or did not match the required ID type. Please register again to resubmit clearer photos.'
            )
          ) : (
            <>
              Our admin team is reviewing your ID.{'\n'}This usually takes up to{' '}
              <Text style={styles.bodyBold}>48 hours</Text>.
            </>
          )}
        </Text>

        {!isRejected && (
          <View style={styles.infoCard}>
            <View style={styles.infoIconBox}>
              <Ionicons name="mail" size={18} color={colors.primary} />
            </View>
            <Text style={styles.infoText}>
              <Text style={styles.infoTextBold}>We'll email you</Text> as soon as your account is
              approved.
            </Text>
          </View>
        )}

        <View style={styles.footer}>
          {!isRejected && (
            <>
              <Button
                label={isRefreshing ? 'Checking...' : 'Refresh Status'}
                variant="primary"
                fullWidth
                size="lg"
                onPress={handleRefresh}
                disabled={isRefreshing}
              />
              <View style={{ height: 12 }} />
            </>
          )}
          <Button
            label={isRejected ? 'Register Again' : 'Sign out'}
            variant={isRejected ? 'primary' : 'soft'}
            fullWidth
            size="lg"
            onPress={signOut}
          />
          <View style={{ height: 12 }} />
          <Button
            label="Need help? Contact us"
            variant="ghost"
            fullWidth
            size="lg"
            onPress={handleContactUs}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 28,
    paddingBottom: 28,
    alignItems: 'center',
  },
  iconWrapper: {
    width: 96,
    height: 96,
    backgroundColor: colors.butter,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 24,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 30,
    lineHeight: 30,
    fontWeight: '800',
    color: colors.ink,
    letterSpacing: -0.75,
    textAlign: 'center',
    marginBottom: 12,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.inkMuted,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 24,
  },
  bodyBold: {
    fontFamily: fonts.bodyBold,
    color: colors.ink,
  },
  infoCard: {
    backgroundColor: colors.peach,
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  infoIconBox: {
    width: 36,
    height: 36,
    backgroundColor: colors.white,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  infoText: {
    flex: 1,
    fontFamily: fonts.body,
    fontSize: 12,
    color: colors.ink,
    lineHeight: 18,
  },
  infoTextBold: {
    fontFamily: fonts.bodyBold,
  },
  footer: {
    marginTop: 'auto',
    width: '100%',
    paddingTop: 24,
  },
});

export default PendingVerifyScreen;
