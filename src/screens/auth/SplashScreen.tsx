import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AuthStackParamList } from '../../navigation/authTypes';
import { colors } from '../../theme/colors';
import { fonts } from '../../theme/typography';

type SplashScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Splash'>;

const SplashScreen: React.FC = () => {
  const navigation = useNavigation<SplashScreenNavigationProp>();
  const [fadeAnim] = useState(new Animated.Value(0));
  const [scaleAnim] = useState(new Animated.Value(0.92));
  const [dotAnimations] = useState([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]);

  useEffect(() => {
    // Smooth entry animation for the brand card
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

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

    // Navigate to onboarding after 1.8 seconds
    const timer = setTimeout(() => {
      navigation.replace('Welcome');
    }, 1800);

    return () => clearTimeout(timer);
  }, [navigation, dotAnimations, fadeAnim, scaleAnim]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Centered Logo Card with Official Emblem & Wordmark */}
      <Animated.View
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.logoCard}>
          <Image
            source={require('../../../assets/logo/03_Secondary_Logov1.png')}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="SIKAP Logo: Local Jobs. Trusted help."
          />
        </View>
      </Animated.View>

      {/* Loading Indicator Dots */}
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.paper,
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
    borderRadius: 28,
    paddingVertical: 24,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(226, 232, 240, 0.85)',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },
  logoImage: {
    width: 210,
    height: 210,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 8,
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
