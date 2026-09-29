import { apiClient } from './client';

export type ReportableType = 'user' | 'job_post' | 'application';
export type ReportReasonType = 'harassment' | 'fake_account' | 'inappropriate_job' | 'other';

export const REPORTABLE_TYPES = {
  USER: 'user' as const,
  JOB_POST: 'job_post' as const,
  APPLICATION: 'application' as const,
};

export function normalizeReportableType(rawType?: string | null): ReportableType {
  const normalized = (rawType || '').toLowerCase().trim();
  if (normalized === 'job' || normalized === 'job_post' || normalized === 'jobpost') {
    return REPORTABLE_TYPES.JOB_POST;
  }
  if (normalized === 'application' || normalized === 'applicant') {
    return REPORTABLE_TYPES.APPLICATION;
  }
  return REPORTABLE_TYPES.USER;
}

export interface SubmitReportPayload {
  reportable_type: ReportableType;
  reportable_id: number;
  type: ReportReasonType;
  description: string;
}

export const reportsApi = {
  submitReport: async (payload: SubmitReportPayload) => {
    return apiClient<{ message: string; report_id?: number }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
