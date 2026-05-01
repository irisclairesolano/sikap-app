import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';

type AuthStackParamList = {
  Onboarding2: undefined;
  Onboarding3: undefined;
};

type Onboarding2ScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Onboarding2'>;

const Onboarding2Screen: React.FC = () => {
  const navigation = useNavigation<Onboarding2ScreenNavigationProp>();
  const insets = useSafeAreaInsets();

  const handleNext = () => {
    navigation.replace('Onboarding3');
  };

  const handleSkip = () => {
    navigation.replace('RoleSelect');
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.skipButton, { top: Math.max(insets.top, 8) }]}
        onPress={handleSkip}
      >
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={styles.middle}>
        <View style={styles.centerBlock}>
          <View style={styles.iconSection}>
            <View style={styles.iconContainer}>
              <Text style={styles.icon}>🪪</Text>
            </View>
            <View style={styles.progressDots}>
              <View style={styles.dot} />
              <View style={[styles.dot, styles.activeDot]} />
              <View style={styles.dot} />
            </View>
          </View>
          <View style={styles.textContent}>
            <Text style={styles.title}>Build Your Profile</Text>
            <Text style={styles.description}>
              Add your skills, work history, and get verified to stand out to employers.
            </Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 18) }]}>
        <TouchableOpacity style={styles.nextButton} onPress={handleNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  skipButton: {
    position: 'absolute',
    right: 0,
    zIndex: 2,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  middle: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 18,
  },
  centerBlock: {
    alignItems: 'center',
    width: '100%',
    gap: 24,
  },
  iconSection: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    backgroundColor: colors.primaryLight,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 40,
  },
  progressDots: {
    flexDirection: 'row',
    gap: 4,
  },
  dot: {
    width: 9,
    height: 5,
    backgroundColor: colors.border,
    borderRadius: 3,
  },
  activeDot: {
    backgroundColor: colors.primary,
    width: 32,
  },
  textContent: {
    gap: 8,
    width: '100%',
    alignItems: 'center',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 11,
    color: colors.textSecondary,
    lineHeight: 16.5, // 1.5 * 11
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  nextButton: {
    height: 42,
    backgroundColor: colors.primary,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextButtonText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'DM Sans',
  },
});

export default Onboarding2Screen;
