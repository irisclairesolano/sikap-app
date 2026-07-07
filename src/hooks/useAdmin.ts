import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi, AdminVerification, AdminUser } from '../api/admin';

export const useVerifications = () => {
  return useQuery<AdminVerification[], Error>({
    queryKey: ['admin', 'verifications'],
    queryFn: adminApi.getVerifications,
  });
};

export const useVerifyUser = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, { id: number; status: 'approved' | 'rejected' }>({
    mutationFn: ({ id, status }) => adminApi.verifyUser(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'verifications'] });
    },
  });
};

export const useUsers = () => {
  return useQuery<{ data: AdminUser[] }, Error>({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.getUsers,
  });
};

export const useSuspendUser = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, { id: number; is_suspended: boolean }>({
    mutationFn: ({ id, is_suspended }) => adminApi.suspendUser(id, is_suspended),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation<{ message: string }, Error, number>({
    mutationFn: (id) => adminApi.deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
};
