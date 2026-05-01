import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation } from '@tanstack/react-query';
import { authApi } from '../../api/auth';
import { LoginRequest } from '../../types';
import { colors } from '../../theme/colors';

type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<string>('');

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      console.log('Login successful:', data);
      // Navigation will be handled by RootNavigator auth check
      Alert.alert('Success', 'Login successful!');
    },
    onError: (error: any) => {
      console.error('Login error:', error);
      setErrors(error.message || 'Login failed');
    },
  });

  const handleLogin = () => {
    setErrors('');
    
    // Basic validation
    if (!email || !password) {
      setErrors('Please fill in all fields');
      return;
    }

    const credentials: LoginRequest = {
      email,
      password,
    };

    loginMutation.mutate(credentials);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to your account</Text>

        {errors ? <Text style={styles.errorText}>{errors}</Text> : null}

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email</Text>
            <Text style={styles.input}>{email || 'Enter email'}</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <Text style={styles.input}>{password ? '•'.repeat(password.length) : 'Enter password'}</Text>
          </View>
        </View>

        <TouchableOpacity 
          style={[styles.button, loginMutation.isPending && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loginMutation.isPending}
        >
          <Text style={styles.buttonText}>
            {loginMutation.isPending ? 'Signing in...' : 'Sign In'}
          </Text>
        </TouchableOpacity>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.linkText}>Don't have an account? Sign Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')}>
            <Text style={styles.linkText}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  errorText: {
    color: colors.error,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 16,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  input: {
    fontSize: 16,
    color: colors.textPrimary,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonDisabled: {
    backgroundColor: colors.border,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    gap: 8,
  },
  linkText: {
    color: colors.primary,
    fontSize: 14,
    textAlign: 'center',
  },
});

export default LoginScreen;
