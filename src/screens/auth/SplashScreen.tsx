import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useEffect, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { colors } from '../../theme/colors';

type AuthStackParamList = {
  Splash: undefined;
  Onboarding1: undefined;
};

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
        ])
      );

      Animated.loop(Animated.parallel(animations)).start();
    };

    animateDots();

    // Navigate to onboarding after 2.5 seconds
    const timer = setTimeout(() => {
      navigation.replace('Onboarding1');
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigation, dotAnimations]);

  return (
    <View style={styles.container}>
      {/* Logo Container */}
      <View style={styles.logoContainer}>
        <View style={styles.logoBox}>
          <Text style={styles.logoIcon}>💼</Text>
        </View>
        
        <Text style={styles.appName}>SIKAP</Text>
        <Text style={styles.tagline}>Trabaho para sa Sorsogon</Text>
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

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Sorsogon State University — Bulan Campus
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoBox: {
    width: 58,
    height: 58,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 28,
  },
  appName: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: 1,
    marginTop: 3,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 11,
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 8,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  footer: {
    position: 'absolute',
    bottom: 22,
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 9,
    textAlign: 'center',
  },
});

export default SplashScreen;
