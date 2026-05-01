import { apiClient } from './client';
import { 
  User, 
  ApiResponse,
  WorkerExperience,
  CharacterReference
} from '../types';

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient<ApiResponse<User>>('/profile');
    return response.data;
  },

  // Update profile
  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient<ApiResponse<User>>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  // Add skills to profile
  addSkills: async (skillIds: number[]): Promise<void> => {
    await apiClient('/profile/skills', {
      method: 'POST',
      body: JSON.stringify({ skill_ids: skillIds }),
    });
  },

  // Add work experience
  addExperience: async (experience: Omit<WorkerExperience, 'id'>): Promise<WorkerExperience> => {
    const response = await apiClient<ApiResponse<WorkerExperience>>('/profile/experiences', {
      method: 'POST',
      body: JSON.stringify(experience),
    });
    return response.data;
  },

  // Remove work experience
  removeExperience: async (experienceId: number): Promise<void> => {
    await apiClient(`/profile/experiences/${experienceId}`, {
      method: 'DELETE',
    });
  },

  // Add character reference
  addReference: async (reference: Omit<CharacterReference, 'id'>): Promise<CharacterReference> => {
    const response = await apiClient<ApiResponse<CharacterReference>>('/profile/references', {
      method: 'POST',
      body: JSON.stringify(reference),
    });
    return response.data;
  },

  // Remove character reference
  removeReference: async (referenceId: number): Promise<void> => {
    await apiClient(`/profile/references/${referenceId}`, {
      method: 'DELETE',
    });
  },
};
