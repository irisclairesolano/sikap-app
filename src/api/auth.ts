import { LaravelLoginResponse, LaravelOtpResponse, LoginRequest, RegisterRequest } from '../types';
import { apiClient } from './client';

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<LaravelLoginResponse> => {
    console.log('🔍 API Login Request:', credentials);
    try {
      const response = await apiClient<LaravelLoginResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
      });
      console.log('🔍 API Login Response:', response);

      // Return the exact backend response: { token, token_type, user }
      if (response && response.user) {
        console.log('🔍 Login successful:', response.user);
        return response;
      }

      throw new Error('Invalid login response format');
    } catch (error) {
      console.log('🔍 API Login Error:', error);
      throw error;
    }
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<{ message: string }> => {
    console.log('🔍 API Register Request:', userData);
    try {
      const response = await apiClient<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData),
      });
      console.log('🔍 API Register Response:', response);

      // Return the exact backend response: { message: string }
      if (response.message) {
        console.log('🔍 Registration initiated:', response.message);
        return response;
      }

      throw new Error('Unexpected registration response format');
    } catch (error) {
      console.log('🔍 API Register Error:', error);
      throw error;
    }
  },

  verifyOtp: async (
    userId: number,
    otp: string,
    email?: string,
  ): Promise<{ message: string; user_id: number }> => {
    console.log('🔍 API Verify OTP Request:', { userId, otp, email });
    try {
      // Backend expects email instead of user_id
      const requestBody = email ? { email, otp } : { user_id: userId, otp };
      console.log('🔍 Request Body:', requestBody);

      const response = await apiClient<LaravelOtpResponse>('/auth/verify-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      console.log('🔍 API Verify OTP Response:', response);

      // Return the exact backend response: { message: string, user_id: number }
      if (response && response.user_id) {
        console.log('🔍 OTP verification successful:', {
          user_id: response.user_id,
          message: response.message,
        });
        return response;
      }

      throw new Error('Invalid OTP response: user_id is required');
    } catch (error) {
      console.log('🔍 API Verify OTP Error:', error);
      throw error;
    }
  },

  // Resend OTP
  resendOtp: async (userId: number, email?: string): Promise<void> => {
    console.log('🔍 API Resend OTP Request:', { userId, email });
    try {
      // Backend expects email instead of user_id
      const requestBody = email ? { email } : { user_id: userId };
      console.log('🔍 Resend OTP Request Body:', requestBody);

      const response = await apiClient('/auth/resend-otp', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      });
      console.log('🔍 API Resend OTP Response:', response);
    } catch (error) {
      console.log('🔍 API Resend OTP Error:', error);
      throw error;
    }
  },

  updateEmail: async (currentEmail: string, newEmail: string): Promise<void> => {
    console.log('🔍 API Update Email Request:', { currentEmail, newEmail });
    try {
      const response = await apiClient('/auth/email', {
        method: 'PATCH',
        body: JSON.stringify({ current_email: currentEmail, new_email: newEmail }),
      });
      console.log('🔍 API Update Email Response:', response);
    } catch (error) {
      console.log('🔍 API Update Email Error:', error);
      throw error;
    }
  },

  uploadId: async (idPhoto: FormData): Promise<void> => {
    console.log('🔍 API Upload ID Request:', idPhoto);
    try {
      const response = await apiClient('/auth/upload-id', {
        method: 'POST',
        body: idPhoto,
      });
      console.log('🔍 API Upload ID Response:', response);
    } catch (error) {
      console.log('🔍 API Upload ID Error:', error);
      throw error;
    }
  },

  // Check registration status for an email
  checkStatus: async (email: string): Promise<{ status: string; user?: any }> => {
    console.log('🔍 API Check Status Request:', email);
    const response = await apiClient<{ status: string; user?: any }>('/auth/status', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    console.log('🔍 API Check Status Response:', response);
    return response;
  },

  // Switch role between worker and employer
  switchRole: async (): Promise<{ new_role: string; needs_onboarding: boolean; user: any }> => {
    console.log('🔍 API Switch Role Request');
    const response = await apiClient<{ new_role: string; needs_onboarding: boolean; user: any }>(
      '/auth/switch-role',
      {
        method: 'POST',
      },
    );
    console.log('🔍 API Switch Role Response:', response);
    return response;
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    console.log('🔍 API Forgot Password Request:', email);
    const response = await apiClient<{ message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
    console.log('🔍 API Forgot Password Response:', response);
    return response;
  },

  verifyResetOtp: async (
    email: string,
    otp: string,
  ): Promise<{ message: string; reset_token: string }> => {
    console.log('🔍 API Verify Reset OTP Request:', { email, otp });
    const response = await apiClient<{ message: string; reset_token: string }>(
      '/auth/verify-reset-otp',
      {
        method: 'POST',
        body: JSON.stringify({ email, otp }),
      },
    );
    console.log('🔍 API Verify Reset OTP Response:', response);
    return response;
  },

  resetPassword: async (
    resetToken: string,
    password: string,
    passwordConfirmation: string,
  ): Promise<{ message: string }> => {
    console.log('🔍 API Reset Password Request');
    const response = await apiClient<{ message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({
        reset_token: resetToken,
        password: password,
        password_confirmation: passwordConfirmation,
      }),
    });
    console.log('🔍 API Reset Password Response:', response);
    return response;
  },
};
