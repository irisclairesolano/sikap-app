export const RegistrationStatus = {
  PENDING_EMAIL_VERIFICATION: 'pending_email_verification',
  PENDING_ID_UPLOAD: 'pending_id_upload',
  PENDING_REVIEW: 'pending_review',
  APPROVED: 'approved',
  REJECTED: 'rejected',
} as const;

export type RegistrationStatus = typeof RegistrationStatus[keyof typeof RegistrationStatus];
