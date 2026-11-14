import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Wordmark } from '../../components/common/Wordmark';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from '../../utils/storage';
import { useLanguage } from '../../contexts/LanguageContext';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const { language, setLanguage } = useLanguage();
  const isTagalog = language === 'tl';

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
            {/* Language Selector */}
            <View style={styles.langSelector}>
              <TouchableOpacity
                style={[styles.langBtn, language === 'en' && styles.langBtnActive]}
                onPress={() => setLanguage('en')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, language === 'en' && styles.langTextActive]}>
                  EN
                </Text>
              </TouchableOpacity>
              <View style={styles.langDivider} />
              <TouchableOpacity
                style={[styles.langBtn, language === 'tl' && styles.langBtnActive]}
                onPress={() => setLanguage('tl')}
                activeOpacity={0.8}
              >
                <Text style={[styles.langText, language === 'tl' && styles.langTextActive]}>
                  TL
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.heroCardWrapper}>
            <View style={styles.ambientGlowPeach} />
            <View style={styles.ambientGlowSky} />
            <View style={styles.heroCard}>
              <Text style={styles.eyebrow}>
                {isTagalog ? 'PARA SA IMPORMAL NA TRABAHO' : 'BUILT FOR INFORMAL WORK'}
              </Text>
              <Text style={styles.title}>
                {isTagalog ? (
                  <>
                    Maghanap ng Trabaho.{'\n'}
                    Ipagpatuloy ang{'\n'}
                    <Text style={styles.titleItalic}>Kabuhayan.</Text>
                  </>
                ) : (
                  <>
                    Find Work.{'\n'}
                    Build Your{'\n'}
                    <Text style={styles.titleItalic}>Kabuhayan.</Text>
                  </>
                )}
              </Text>
              <Text style={styles.lede}>
                {isTagalog
                  ? 'Mapagkakatiwalaang employer. Protektado ang privacy. Libre para sa manggagawa, palagi.'
                  : 'Trusted local employers. Privacy every step. Free for workers, always.'}
              </Text>
            </View>
          </View>

          <View style={styles.valueProps}>
            <View style={styles.valueItem}>
              <Ionicons name="checkmark-circle" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>{isTagalog ? 'Libre' : 'Free'}</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="shield-checkmark" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>{isTagalog ? 'Pribado' : 'Private'}</Text>
            </View>
            <View style={styles.valueItem}>
              <Ionicons name="location" size={14} color={colors.mintDeep} />
              <Text style={styles.valueText}>{isTagalog ? 'Buong Sorsogon' : 'Sorsogon-wide'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Button
            label={isTagalog ? 'Ako ay Manggagawa' : "I'm a Worker"}
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('worker')}
          />
          <View style={{ height: 12 }} />
          <Button
            label={isTagalog ? 'Ako ay Employer' : "I'm an Employer"}
            variant="secondary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('employer')}
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>
              {isTagalog ? 'Mayroon nang account? ' : 'Already have an account? '}
            </Text>
            <Text style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
              {isTagalog ? 'Mag-log in' : 'Log in'}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  langSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    padding: 3,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  langBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  langBtnActive: {
    backgroundColor: colors.primary,
  },
  langText: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  langTextActive: {
    color: '#FFFFFF',
  },
  langDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(226, 232, 240, 0.85)',
    marginHorizontal: 1,
  },
  heroCardWrapper: {
    position: 'relative',
    marginTop: 20,
  },
  ambientGlowPeach: {
    position: 'absolute',
    top: -10,
    right: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 197, 208, 0.20)',
  },
  ambientGlowSky: {
    position: 'absolute',
    bottom: -10,
    left: -10,
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(176, 226, 255, 0.20)',
  },
  heroCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    paddingTop: 24,
    paddingHorizontal: 22,
    paddingBottom: 22,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
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
    lineHeight: 44,
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
