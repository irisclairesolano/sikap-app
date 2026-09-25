import { apiClient } from './client';
import { BlockedUserRecord, PaginatedResponse } from '../types';

export const usersApi = {
  blockUser: async (userId: number): Promise<{ message: string; is_blocked: boolean }> => {
    return apiClient<{ message: string; is_blocked: boolean }>(`/user/block/${userId}`, {
      method: 'POST',
    });
  },

  unblockUser: async (userId: number): Promise<{ message: string; is_blocked: boolean }> => {
    return apiClient<{ message: string; is_blocked: boolean }>(`/user/block/${userId}`, {
      method: 'DELETE',
    });
  },

  getBlockedUsers: async (page: number = 1): Promise<PaginatedResponse<BlockedUserRecord>> => {
    return apiClient<PaginatedResponse<BlockedUserRecord>>(`/user/blocked?page=${page}`);
  },
};
