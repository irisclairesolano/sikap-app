import { apiClient } from './client';
import { User, WorkerExperience, CharacterReference } from '../types';

export const profileApi = {
  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiClient<any>('/profile');
    return response?.data !== undefined ? response.data : response;
  },

  // Update profile
  updateProfile: async (
    data: Partial<User> & { bio?: string; availability_status?: string; description?: string },
  ): Promise<any> => {
    const response = await apiClient<any>('/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response?.data !== undefined ? response.data : response;
  },

  // Upload avatar
  uploadAvatar: async (imageUri: string): Promise<{ avatar_url: string }> => {
    const formData = new FormData();
    const filename = imageUri.split('/').pop() || 'avatar.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('avatar', {
      uri: imageUri,
      name: filename,
      type,
    } as any);

    const response = await apiClient<any>('/profile/avatar', {
      method: 'POST',
      body: formData,
    });
    return response?.data !== undefined ? response.data : response;
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
    const response = await apiClient<any>('/profile/experiences', {
      method: 'POST',
      body: JSON.stringify(experience),
    });
    return response?.experience !== undefined
      ? response.experience
      : response?.data !== undefined
        ? response.data
        : response;
  },

  // Update work experience
  updateExperience: async (
    experienceId: number,
    experience: Omit<WorkerExperience, 'id'>,
  ): Promise<WorkerExperience> => {
    const response = await apiClient<any>(`/profile/experiences/${experienceId}`, {
      method: 'PUT',
      body: JSON.stringify(experience),
    });
    return response?.experience !== undefined
      ? response.experience
      : response?.data !== undefined
        ? response.data
        : response;
  },

  // Remove work experience
  removeExperience: async (experienceId: number): Promise<void> => {
    await apiClient(`/profile/experiences/${experienceId}`, {
      method: 'DELETE',
    });
  },

  // Add character reference
  addReference: async (reference: Omit<CharacterReference, 'id'>): Promise<CharacterReference> => {
    const response = await apiClient<any>('/profile/references', {
      method: 'POST',
      body: JSON.stringify(reference),
    });
    return response?.reference !== undefined
      ? response.reference
      : response?.data !== undefined
        ? response.data
        : response;
  },

  // Remove character reference
  removeReference: async (referenceId: number): Promise<void> => {
    await apiClient(`/profile/references/${referenceId}`, {
      method: 'DELETE',
    });
  },

  // Onboard new role
  onboardRole: async (
    targetRole: 'worker' | 'employer',
    data: any
  ): Promise<{ message: string; user: User }> => {
    const isFormData = data instanceof FormData;
    
    if (isFormData) {
      data.append('target_role', targetRole);
    }

    const response = await apiClient<any>('/profile/onboard-role', {
      method: 'POST',
      body: isFormData ? data : JSON.stringify({ ...data, target_role: targetRole }),
    });
    return response;
  },
};
