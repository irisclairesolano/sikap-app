import { apiClient } from './client';
import { 
  AuthResponse, 
  LoginRequest, 
  RegisterRequest, 
  ApiResponse 
} from '../types';

export const authApi = {
  // Login user
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient<ApiResponse<AuthResponse>>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    return response.data;
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient<ApiResponse<AuthResponse>>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    return response.data;
  },

  // Verify OTP
  verifyOtp: async (userId: number, otp: string): Promise<void> => {
    await apiClient('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, otp }),
    });
  },

  // Resend OTP
  resendOtp: async (userId: number): Promise<void> => {
    await apiClient('/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId }),
    });
  },

  // Upload ID verification
  uploadId: async (idPhoto: FormData): Promise<void> => {
    await apiClient('/auth/upload-id', {
      method: 'POST',
      body: idPhoto,
      headers: {}, // Let browser set Content-Type for FormData
    });
  },

  // Logout (client-side only - remove token)
  logout: async (): Promise<void> => {
    // Note: Backend doesn't have logout endpoint, just remove token client-side
    // This will be handled in the auth store/hooks
  },
};
