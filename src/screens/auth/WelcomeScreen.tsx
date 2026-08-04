import { SafeAreaView } from 'react-native-safe-area-context';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors, fonts } from '../../theme';
import { Wordmark } from '../../components/common/Wordmark';
import Button from '../../components/common/Button';
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import * as SecureStore from 'expo-secure-store';
import { notifyAuthChanged } from '../../store/authEvents';

type WelcomeScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;

const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation<WelcomeScreenNavigationProp>();
  const queryClient = useQueryClient();

  const navigateToRegister = (role: 'worker' | 'employer') => {
    navigation.navigate('Register', { role });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Wordmark size={28} />
        </View>

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

        <View style={styles.footer}>
          <Button
            label="I'm a Worker"
            variant="primary"
            size="lg"
            fullWidth
            onPress={() => navigateToRegister('worker')}
          />
          <View style={{ height: 14 }} />
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  container: {
    flex: 1,
    paddingHorizontal: 26,
    paddingTop: 16,
    paddingBottom: 28,
  },
  header: {
    alignItems: 'flex-start',
  },
  heroCard: {
    backgroundColor: colors.peach,
    borderRadius: 12,
    paddingTop: 32,
    paddingHorizontal: 24,
    paddingBottom: 28,
    marginTop: 32,
  },
  eyebrow: {
    fontFamily: fonts.bodyBold,
    fontSize: 11,
    color: colors.primaryDark,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  title: {
    fontFamily: fonts.display,
    fontSize: 40,
    color: colors.ink,
    letterSpacing: -1.4,
    lineHeight: 38,
  },
  titleItalic: {
    fontFamily: fonts.displayItalic,
    color: colors.primary,
  },
  lede: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkSoft,
    lineHeight: 22,
    marginTop: 16,
  },
  valueProps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
    marginTop: 18,
  },
  valueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  valueText: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 11,
    color: colors.inkSoft,
  },
  footer: {
    marginTop: 'auto',
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
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
