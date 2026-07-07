import { apiClient } from './client';

export interface AdminVerification {
  id: number;
  name: string;
  email: string;
  document_url: string;
  registration_status: string;
  created_at: string;
}

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  is_suspended: boolean;
  registration_status: string;
  created_at: string;
}

export const adminApi = {
  getVerifications: async () => {
    return apiClient<AdminVerification[]>('/admin/verifications');
  },

  verifyUser: async (id: number, status: 'approved' | 'rejected') => {
    return apiClient<{ message: string }>(`/admin/users/${id}/verify`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  getUsers: async () => {
    // Note: the backend returns paginated data for /admin/users, so we define the generic appropriately
    return apiClient<{ data: AdminUser[] }>('/admin/users');
  },

  suspendUser: async (id: number, is_suspended: boolean) => {
    return apiClient<{ message: string }>(`/admin/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ is_suspended }),
    });
  },

  deleteUser: async (id: number) => {
    return apiClient<{ message: string }>(`/admin/users/${id}`, {
      method: 'DELETE',
    });
  },
};
