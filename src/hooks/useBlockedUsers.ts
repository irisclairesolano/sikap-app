import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { BlockedUserRecord, PaginatedResponse } from '../types';

export function useBlockedUsers(page: number = 1) {
  return useQuery<PaginatedResponse<BlockedUserRecord>, Error>({
    queryKey: ['blockedUsers', page],
    queryFn: () => usersApi.getBlockedUsers(page),
  });
}

export function useBlockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => usersApi.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
  });
}

export function useUnblockUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => usersApi.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversation'] });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['blockedUsers'] });
    },
  });
}
