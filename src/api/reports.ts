import { apiClient } from './client';
import { appendFileToFormData } from '../utils/formData';

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
  if (normalized === 'application') {
    return REPORTABLE_TYPES.APPLICATION;
  }
  return REPORTABLE_TYPES.USER;
}

export interface SubmitReportPayload {
  reportable_type: ReportableType;
  reportable_id: number;
  type: ReportReasonType;
  description: string;
  screenshots?: string[];
}

export const reportsApi = {
  submitReport: async (payload: SubmitReportPayload) => {
    if (payload.screenshots && payload.screenshots.length > 0) {
      const formData = new FormData();
      formData.append('reportable_type', payload.reportable_type);
      formData.append('reportable_id', String(payload.reportable_id));
      formData.append('type', payload.type);
      formData.append('description', payload.description);

      for (let i = 0; i < payload.screenshots.length; i++) {
        await appendFileToFormData(
          formData,
          `screenshots[${i}]`,
          payload.screenshots[i],
          `screenshot_${i + 1}.jpg`,
        );
      }

      return apiClient<{ message: string; report_id?: number }>('/reports', {
        method: 'POST',
        body: formData,
      });
    }

    return apiClient<{ message: string; report_id?: number }>('/reports', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
