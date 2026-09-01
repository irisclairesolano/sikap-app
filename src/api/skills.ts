import { apiClient } from './client';

export interface Skill {
  id: number;
  name: string;
  category?: string;
}

export const skillsApi = {
  getSkills: async (): Promise<Skill[]> => {
    // Skills API returns an array directly, not wrapped in an object like some endpoints
    const response = await apiClient<Skill[]>('/skills');
    return response as any; // apiClient currently resolves to the object directly if no data wrapper
  },
  createSkill: async (name: string): Promise<Skill> => {
    const response = await apiClient<Skill>('/skills', {
      method: 'POST',
      body: JSON.stringify({ name, category: 'Other' }),
    });
    return response as any;
  },
};
