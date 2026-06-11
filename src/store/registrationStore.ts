import { RegisterRequest } from '../types';

// Simple in-memory store to retain registration draft across screen navigation
export const registrationDraftStore: { data: Partial<RegisterRequest> | null } = {
  data: null
};
