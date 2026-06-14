import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

const HomeScreen: React.FC = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <Text style={styles.title}>Welcome to SIKAP!</Text>
      <Text style={styles.subtitle}>You're all set and approved ✅</Text>
      <Text style={styles.description}>
        Your account has been approved successfully. You can now access all features of the app.
      </Text>
      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>✅ Completed:</Text>
        <Text style={styles.feature}>• Registration</Text>
        <Text style={styles.feature}>• Email Verification</Text>
        <Text style={styles.feature}>• ID Upload & Auto-Approval</Text>
        <Text style={styles.feature}>• Account Status: Approved</Text>
      </View>
      <View style={styles.featureBox}>
        <Text style={styles.featureTitle}>🎯 Next:</Text>
        <Text style={styles.feature}>• Worker Home Feed (Coming Soon)</Text>
        <Text style={styles.feature}>• Job Search (Coming Soon)</Text>
        <Text style={styles.feature}>• Application System (Coming Soon)</Text>
      </View>
      <View style={styles.statusBox}>
        <Text style={styles.statusText}>🎉 You're ready to start using SIKAP!</Text>
        <Text style={styles.statusSubtext}>Backend auto-approval is enabled for testing.</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.ink,
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: colors.primary,
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: colors.inkSoft,
    lineHeight: 24,
    marginBottom: 32,
  },
  featureBox: {
    backgroundColor: colors.primaryTint,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 8,
  },
  feature: {
    fontSize: 14,
    color: colors.inkSoft,
    marginBottom: 4,
  },
  statusBox: {
    backgroundColor: colors.success,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  statusSubtext: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
  testingBox: {
    backgroundColor: colors.warning,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  testingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  testingText: {
    fontSize: 14,
    color: colors.white,
    textAlign: 'center',
  },
});

export default HomeScreen;
