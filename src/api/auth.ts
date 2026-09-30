import { LaravelLoginResponse, LaravelOtpResponse, LoginRequest, RegisterRequest } from '../types';
import { apiClient } from './client';

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LaravelLoginResponse> => {
    try {
      const response = await apiClient<LaravelLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });

      // Return the exact backend response: { token, token_type, user }
      if (response && response.user) {
        return response;
      }

      throw new Error('Invalid login response format');
    } catch (error) {
      if (__DEV__) console.warn('API Login Error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<{ message: string }> => {
    try {
      const response = await apiClient<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      // Return the exact backend response: { message: string }
      if (response.message) {
        return response;
      }

      throw new Error('Unexpected registration response format');
    } catch (error) {
      if (__DEV__) console.warn('API Register Error:', error);
      throw error;
    }
  },

  verifyOtp: async (
    userId: number,
    otp: string,
    email?: string,
  ): Promise<{ message: string; user_id: number }> => {
    try {
      // Backend expects email instead of user_id
      const requestBody = email ? { email, otp } : { user_id: userId, otp };

      const response = await apiClient<LaravelOtpResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });

      // Return the exact backend response: { message: string, user_id: number }
      if (response && response.user_id) {
        return response;
      }

      throw new Error('Invalid OTP response: user_id is required');
    } catch (error) {
      if (__DEV__) console.warn('API Verify OTP Error:', error);
      throw error;
    }
  },

  // Resend OTP
  resendOtp: async (userId: number, email?: string): Promise<void> => {
    try {
      // Backend expects email instead of user_id
      const requestBody = email ? { email } : { user_id: userId };

      await apiClient('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
    } catch (error) {
      if (__DEV__) console.warn('API Resend OTP Error:', error);
      throw error;
    }
  },

  updateEmail: async (currentEmail: string, newEmail: string): Promise<void> => {
    try {
      await apiClient('/auth/email', {
        method: 'PATCH',
        body: JSON.stringify({ current_email: currentEmail, new_email: newEmail }),
      });
    } catch (error) {
      if (__DEV__) console.warn('API Update Email Error:', error);
      throw error;
    }
  },

  uploadId: async (idPhoto: FormData): Promise<void> => {
    try {
      await apiClient('/auth/upload-id', {
        method: 'POST',
        body: idPhoto,
      });
    } catch (error) {
      if (__DEV__) console.warn('API Upload ID Error:', error);
      throw error;
    }
  },

  // Check registration status for an email
  checkStatus: async (email: string): Promise<{ status: string; user?: any }> => {
    return apiClient<{ status: string; user?: any }>('/auth/status', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // Switch role between worker and employer
  switchRole: async (): Promise<{ new_role: string; needs_onboarding: boolean; user: any }> => {
    return apiClient<{ new_role: string; needs_onboarding: boolean; user: any }>(
      '/auth/switch-role',
      {
        method: 'POST',
      },
    );
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  verifyResetOtp: async (
    email: string,
    otp: string,
  ): Promise<{ message: string; reset_token: string }> => {
    return apiClient<{ message: string; reset_token: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
    });
  },

  resetPassword: async (
    resetToken: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        reset_token: resetToken,
        password: password,
        password_confirmation: passwordConfirmation,
      }),
    });
  },

  getDeleteAccountStatus: async (): Promise<{
    can_delete: boolean;
    has_warning: boolean;
    reason: string | null;
    warning: string | null;
  }> => {
    return apiClient<{
      can_delete: boolean;
      has_warning: boolean;
      reason: string | null;
      warning: string | null;
    }>('/auth/account/precheck', {
      method: 'GET',
    });
  },

  deleteAccount: async (reason?: string): Promise<{ message: string }> => {
    return apiClient<{ message: string }>('/auth/account', {
      method: 'DELETE',
      body: JSON.stringify({ reason: reason || 'User self-deleted account' }),
    });
  },
};
