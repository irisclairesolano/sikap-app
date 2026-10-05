import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supportApi, CreateSupportTicketPayload } from '../api/support';

export function useMySupportTickets() {
  return useQuery({
    queryKey: ['support-tickets'],
    queryFn: () => supportApi.getMyTickets().then((res) => res.data),
    refetchInterval: 15_000,
    staleTime: 5_000,
  });
}

export function useCreateSupportTicket() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupportTicketPayload) => supportApi.createTicket(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
    },
  });
}
