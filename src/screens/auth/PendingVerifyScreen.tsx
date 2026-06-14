import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/authTypes';
import { notifyAuthChanged } from '../../store/authEvents';
import { colors, fonts } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

type NavProp = NativeStackNavigationProp<AuthStackParamList, 'PendingVerify'>;

const PendingVerifyScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const insets = useSafeAreaInsets();

  const signOut = async () => {
    await SecureStore.deleteItemAsync('auth_token').catch(() => {});
    notifyAuthChanged();
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      
      {/* App Bar */}
      <View style={styles.appBar}>
        <View style={{ width: 40 }} />
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="help-circle-outline" size={26} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconWrapper}>
          <Ionicons name="hourglass-outline" size={48} color={colors.primaryDark} />
        </View>

        <Text style={styles.title}>
          We're <Text style={styles.titleItalic}>checking</Text>{'\n'}your account.
        </Text>
        
        <Text style={styles.body}>
          Our admin team is reviewing your ID.{'\n'}This usually takes up to <Text style={styles.bodyBold}>48 hours</Text>.
        </Text>

        <View style={styles.infoCard}>
          <View style={styles.infoIconBox}>
            <Ionicons name="mail" size={18} color={colors.primary} />
          </View>
          <Text style={styles.infoText}>
            <Text style={styles.infoTextBold}>We'll email you</Text> as soon as your account is approved.
          </Text>
        </View>

        <View style={styles.footer}>
          <Button 
            label="Need help? Contact us" 
            variant="soft" 
            fullWidth 
            size="lg"
            onPress={() => {}} // Could open a mail client or intercom
          />
          <View style={{ height: 12 }} />
          <Button 
            label="Sign out" 
            variant="ghost" 
            fullWidth 
            size="lg"
            onPress={signOut} 
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
