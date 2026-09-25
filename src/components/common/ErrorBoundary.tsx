import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts } from '../../theme';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  onHome?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  handleHome = (): void => {
    this.setState({ hasError: false, error: null });
    if (this.props.onHome) {
      this.props.onHome();
    } else {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { navigationRef } = require('../../../App');
        if (navigationRef?.isReady?.()) {
          navigationRef.reset({
            index: 0,
            routes: [{ name: 'Worker' }],
          });
        }
      } catch {
        // Ignore fallback navigation failure
      }
    }
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container} testID="error-boundary-fallback">
          <View style={styles.iconCircle}>
            <Ionicons name="alert-circle-outline" size={48} color={colors.error} />
          </View>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {this.state.error?.message ||
              'An unexpected error occurred in the application. Please try again or return to the home screen.'}
          </Text>
          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={this.handleReset}
              activeOpacity={0.8}
              testID="error-boundary-try-again"
            >
              <Ionicons name="refresh-outline" size={18} color={colors.white} />
              <Text style={styles.primaryButtonText}>Try Again</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={this.handleHome}
              activeOpacity={0.8}
              testID="error-boundary-return-home"
            >
              <Ionicons name="home-outline" size={18} color={colors.primary} />
              <Text style={styles.secondaryButtonText}>Return to Home</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: colors.paper,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: fonts.bodyBold,
    fontSize: 22,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: colors.inkMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    maxWidth: 320,
  },
  actions: {
    width: '100%',
    maxWidth: 280,
    gap: 12,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  primaryButtonText: {
    color: colors.white,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
  secondaryButton: {
    backgroundColor: colors.paperBright,
    borderWidth: 1.5,
    borderColor: colors.inkFaint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
    gap: 8,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontFamily: fonts.bodyBold,
    fontSize: 15,
  },
});

export default ErrorBoundary;
