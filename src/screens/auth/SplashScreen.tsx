import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { Wordmark } from '../../components/common/Wordmark';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const [dotAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  useEffect(() => {
    // Animate loading dots
    const animateDots = () => {
      const animations = dotAnimations.map((anim, index) =>
        Animated.sequence([
          Animated.delay(index * 200),
          Animated.timing(anim, {
            toValue: 0.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
      );

      Animated.loop(Animated.parallel(animations)).start();
    };

    animateDots();

    // Navigate to onboarding after 1.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigation, dotAnimations]);

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoCard}>
          <Wordmark size={64} />
          <Text style={styles.subtitle}>Find local work.</Text>
        </View>
      </View>

      {/* Loading Dots */}
      <View style={styles.dotsContainer}>
        {dotAnimations.map((anim, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                opacity: anim,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.peach,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  logoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.70)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  subtitle: {
    fontFamily: fonts.bodySemiBold,
    fontSize: 13,
    color: colors.primaryDark,
    marginTop: 14,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 6,
    position: 'absolute',
    bottom: 64,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});

export default SplashScreen;
