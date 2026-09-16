import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Wordmark } from '../../components/common/Wordmark';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from '../../utils/storage';
import { notifyAuthChanged } from '../../store/authEvents';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const queryClient = useQueryClient();

  React.useEffect(() => {
    // Proactively clear any stale user profile cache when landing on welcome
    SecureStore.deleteItemAsync('user_profile').catch(() => {});
  }, []);

  const navigateToRegister = (role: 'worker' | 'employer') => {
    navigation.navigate('Register', { role });
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom', 'left', 'right']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topSection}>
          <View style={styles.header}>
            <Wordmark size={28} />
          </View>

          <View style={styles.heroCardWrapper}>
            <View style={styles.ambientGlowPeach} />
            <View style={styles.ambientGlowSky} />
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>BUILT FOR INFORMAL WORK</Text>
              <Text style={styles.title}>
                Find Work.{'\n'}
                Build Your{'\n'}
                <Text style={styles.titleItalic}>Kabuhayan.</Text>
              </Text>
              <Text style={styles.lede}>
                Trusted local employers. Privacy every step. Free for workers, always.
              </Text>
            </View>
          </View>

          <View style={styles.valueProps}>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>Free</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="shield-checkmark" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>Private</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="location" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>Sorsogon-wide</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label="I'm a Worker"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('worker')}
          />
          <View style={{ height: 12 }} />
          <Button
            label="I'm an Employer"
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('employer')}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Already have an account? </Text>
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              Log in
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  topSection: {
    flexShrink: 0,
  },
  header: {
    alignItems: 'flex-start',
  },
  heroCardWrapper: {
    position: 'relative',
    marginTop: 20,
  },
  ambientGlowPeach: {
    position: 'absolute',
    top: -12,
    right: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 197, 208, 0.40)',
  },
  ambientGlowSky: {
    position: 'absolute',
    bottom: -12,
    left: -10,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(176, 226, 255, 0.35)',
  },
  heroCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.90)',
    borderRadius: 22,
    borderWidth: 0.5,
    borderColor: 'rgba(255, 255, 255, 0.40)',
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 3,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 36,
    color: colors.ink,
    letterSpacing: -1.2,
    lineHeight: 36,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  lede: {
    fontFamily: fonts.body,
    fontSize: 13,
    color: colors.inkSoft,
    lineHeight: 20,
    marginTop: 12,
  },
  valueProps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginTop: 18,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
  },
  valueText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  footer: {
    marginTop: 24,
    paddingTop: 4,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 18,
  },
  loginText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
  },
  loginLink: {
    fontFamily: fonts.bodyBold,
    fontSize: 14,
    color: colors.primary,
  },
});

export default WelcomeScreen;
