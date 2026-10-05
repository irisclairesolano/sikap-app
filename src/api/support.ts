import { apiClient } from './client';
import { SupportTicket } from '../types';

export interface CreateSupportTicketPayload {
  subject: string;
  message: string;
}

export const supportApi = {
  createTicket: async (payload: CreateSupportTicketPayload) => {
    return apiClient<{ message: string; ticket: SupportTicket }>('/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getMyTickets: async () => {
    return apiClient<{ data: SupportTicket[] }>('/support/my-tickets');
  },
};
