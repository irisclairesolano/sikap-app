/**
 * Comprehensive error message sanitizer and formatter for SIKAP.
 *
 * Guarantees that:
 * 1. Technical backend slugs (e.g. "active_job", "pending_applications", "invalid_credentials")
 *    are translated into informative, user-friendly, and professional messages.
 * 2. Database exceptions (Postgres/Supabase constraint violations, SQLSTATE errors)
 *    are converted into helpful user-facing guidance.
 * 3. Infrastructure URLs (Render, Supabase), IP addresses, and low-level runtime stack exceptions
 *    are never displayed to end users in alerts, toasts, or banners.
 */

const SENSITIVE_URL_PATTERNS = [
  /https?:\/\/[^\s]+/gi, // Any http/https URL
  /[a-zA-Z0-9-]+\.onrender\.com[^\s]*/gi, // Any Render backend subdomain
  /[a-zA-Z0-9-]+\.supabase\.co[^\s]*/gi, // Supabase endpoint
  /\/api\/v[0-9]+[^\s]*/gi, // API path like /api/v1/...
];

const NETWORK_ERROR_PATTERNS = [
  'unknownhostexception',
  'no address associated with host',
  'network request failed',
  'failed to fetch',
  'network error',
  'connectexception',
  'sockettimeoutexception',
  'sslhandshakeexception',
  'certpathvalidatorexception',
  'econnrefused',
  'etimedout',
  'enotfound',
  'typeerror: network request failed',
  'abort error',
  'aborterror',
];

/**
 * Exact dictionary mapping for backend error codes, reason slugs, and common status tags.
 */
const KNOWN_ERROR_CODES: Record<string, string> = {
  // Account Deletion & Active Status
  active_job:
    'You cannot delete your account while you have active job postings or ongoing work. Please conclude or cancel all active jobs first.',
  active_jobs:
    'You cannot delete your account while you have active job postings or ongoing work. Please conclude or cancel all active jobs first.',
  has_active_jobs:
    'You cannot delete your account while you have active job postings or ongoing work. Please conclude or cancel all active jobs first.',
  cannot_delete_active_job:
    'You cannot delete your account while you have active job postings or ongoing work. Please conclude or cancel all active jobs first.',
  cannot_delete_active_jobs:
    'You cannot delete your account while you have active job postings or ongoing work. Please conclude or cancel all active jobs first.',
  has_active_job_posts:
    'You have active job postings. Please close or cancel your job posts before deleting your account.',
  active_application:
    'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.',
  active_applications:
    'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.',
  has_active_applications:
    'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.',
  pending_application:
    'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.',
  pending_applications:
    'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.',
  cannot_delete_pending_application:
    'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.',
  active_hire:
    'You have active hiring contracts or accepted workers. Please complete or finalize them before deleting your account.',
  active_hires:
    'You have active hiring contracts or accepted workers. Please complete or finalize them before deleting your account.',
  active_contract:
    'You have active contracts or ongoing work in progress. Please complete them first.',
  active_contracts:
    'You have active contracts or ongoing work in progress. Please complete them first.',
  has_active_hires:
    'You have active hiring contracts or accepted workers. Please complete or finalize them first.',
  unresolved_reports:
    'Your account has unresolved reports or support inquiries currently under review.',
  pending_reports:
    'Your account has unresolved reports or support inquiries currently under review.',
  has_pending_reports:
    'Your account has unresolved reports or support inquiries currently under review.',
  cannot_delete_account:
    'You cannot delete your account at this time. Please ensure you have no active jobs, pending applications, or ongoing hires.',

  // Authentication & Credentials
  unauthorized: 'Your session has expired. Please log in again to continue.',
  unauthenticated: 'Your session has expired. Please log in again to continue.',
  not_authenticated: 'Your session has expired. Please log in again to continue.',
  invalid_token: 'Your security token is invalid or has expired. Please sign in again.',
  token_expired: 'Your session has expired. Please log in again.',
  jwt_expired: 'Your session has expired. Please log in again.',
  session_expired: 'Your session has expired. Please log in again.',
  forbidden: 'You do not have permission to perform this action.',
  access_denied: 'You do not have permission to perform this action.',
  insufficient_permissions: 'You do not have permission to perform this action.',
  not_authorized: 'You do not have permission to perform this action.',
  invalid_credentials: 'The email or password you entered is incorrect. Please try again.',
  bad_credentials: 'The email or password you entered is incorrect. Please try again.',
  wrong_password: 'The current password you entered is incorrect. Please try again.',
  invalid_password: 'The password provided does not meet the security requirements.',
  user_not_found: 'No account was found with the provided details.',
  account_not_found: 'No account was found with the provided details.',
  email_already_exists:
    'This email address is already registered. Please sign in or use another email.',
  email_taken: 'This email address is already registered. Please sign in or use another email.',
  duplicate_email: 'This email address is already registered. Please sign in or use another email.',
  email_in_use: 'This email address is already registered. Please sign in or use another email.',
  phone_already_exists:
    'This phone number is already registered. Please use a different phone number.',
  phone_taken: 'This phone number is already registered. Please use a different phone number.',
  duplicate_phone: 'This phone number is already registered. Please use a different phone number.',
  phone_in_use: 'This phone number is already registered. Please use a different phone number.',
  invalid_otp: 'The verification code entered is invalid. Please double-check and try again.',
  otp_invalid: 'The verification code entered is invalid. Please double-check and try again.',
  otp_expired: 'The verification code has expired. Please request a new code.',
  code_expired: 'The verification code has expired. Please request a new code.',
  invalid_verification_code:
    'The verification code is invalid or has expired. Please request a new code.',
  max_attempts_reached:
    'Too many verification attempts. Please wait a few minutes before trying again.',
  too_many_otp_requests:
    'Too many verification requests. Please wait a moment before trying again.',

  // Jobs, Applications & Reviews
  already_applied: 'You have already submitted an application for this job posting.',
  application_exists: 'You have already submitted an application for this job posting.',
  duplicate_application: 'You have already submitted an application for this job posting.',
  job_closed: 'This job listing is no longer open for applications.',
  job_cancelled: 'This job posting has been cancelled by the employer.',
  job_deleted: 'This job posting is no longer available.',
  job_not_found: 'The requested job posting could not be found.',
  job_unavailable: 'This job posting is currently unavailable.',
  already_reviewed: 'You have already submitted a review for this transaction.',
  review_exists: 'You have already submitted a review for this transaction.',
  duplicate_review: 'You have already submitted a review for this transaction.',
  cannot_hire: 'This position cannot be filled at this time.',
  job_filled: 'This job position has already been filled.',
  position_filled: 'This job position has already been filled.',
  application_not_found: 'This job application is no longer active or could not be found.',
  application_cancelled: 'This job application has been cancelled.',

  // Profile & Verification
  profile_incomplete: 'Please complete your required profile details before continuing.',
  incomplete_profile: 'Please complete your required profile details before continuing.',
  missing_profile: 'Please complete your profile details before continuing.',
  id_verification_pending:
    'Your identity verification is currently under review by our administrators.',
  verification_pending: 'Your identity verification is currently under review.',
  id_verification_rejected:
    'Your identity verification was not approved. Please submit valid ID documents.',
  verification_rejected:
    'Your identity verification was not approved. Please submit valid ID documents.',
  account_suspended: 'This account has been temporarily suspended. Please contact support.',
  account_banned: 'This account has been restricted. Please contact support.',
  account_blocked: 'This account has been restricted. Please contact support.',
  user_blocked: 'This user account is currently blocked.',

  // Uploads & Files
  file_too_large: 'The selected file is too large. Please choose a file under 5MB.',
  payload_too_large: 'The uploaded file exceeds the allowable size limit.',
  file_size_exceeded: 'The selected file is too large. Please choose a file under 5MB.',
  invalid_file_type:
    'This file format is not supported. Please choose a valid JPG, PNG, or PDF file.',
  unsupported_file_type:
    'This file format is not supported. Please choose a valid JPG, PNG, or PDF file.',
  invalid_mime_type:
    'This file format is not supported. Please choose a valid JPG, PNG, or PDF file.',
  upload_failed: 'Failed to upload the file. Please check your internet connection and try again.',

  // Generic System / Rate Limit
  too_many_requests: 'Too many requests. Please wait a moment before trying again.',
  rate_limit_exceeded: 'Too many requests. Please wait a moment before trying again.',
  rate_limited: 'Too many requests. Please wait a moment before trying again.',
  throttled: 'Too many requests. Please wait a moment before trying again.',
  internal_server_error: 'An unexpected server error occurred. Please try again later.',
  database_error: 'A database error occurred. Please try again later.',
  server_error: 'An unexpected server error occurred. Please try again later.',
  db_error: 'A database error occurred. Please try again later.',
  sql_error: 'A database error occurred. Please try again later.',
  query_error: 'A database error occurred. Please try again later.',
  record_not_found: 'The requested record could not be found.',
  not_found: 'The requested information could not be found.',
  resource_not_found: 'The requested item could not be found.',
  entity_not_found: 'The requested item could not be found.',
  validation_error: 'Please check your input details and try again.',
};

/**
 * Partial / substring checks to catch backend sentences containing technical tags
 */
function checkSubstringPatterns(lower: string): string | null {
  if (
    lower.includes('active_job') ||
    lower.includes('active_jobs') ||
    lower.includes('has_active_jobs')
  ) {
    return 'You cannot delete your account while you have active job postings or ongoing work. Please conclude or cancel all active jobs first.';
  }
  if (
    lower.includes('pending_application') ||
    lower.includes('pending_applications') ||
    lower.includes('active_application') ||
    lower.includes('active_applications')
  ) {
    return 'You cannot delete your account while you have pending job applications. Please withdraw or conclude them first.';
  }
  if (
    lower.includes('active_hire') ||
    lower.includes('active_hires') ||
    lower.includes('active_contract') ||
    lower.includes('active_contracts')
  ) {
    return 'You have active hiring contracts or accepted workers. Please complete or finalize them first.';
  }
  if (lower.includes('duplicate key') || lower.includes('unique constraint')) {
    if (lower.includes('email')) {
      return 'This email address is already registered. Please sign in or use another email.';
    }
    if (lower.includes('phone')) {
      return 'This phone number is already registered. Please use a different phone number.';
    }
    return 'A record with this information already exists. Please verify your details.';
  }
  if (lower.includes('foreign key constraint') || lower.includes('violates foreign key')) {
    return 'This action cannot be completed because related items or active records depend on it.';
  }
  if (lower.includes('not-null constraint') || lower.includes('violates not-null')) {
    return 'Please fill in all required fields before proceeding.';
  }
  if (
    lower.includes('sqlstate') ||
    lower.includes('postgresql') ||
    lower.includes('pgrst') ||
    lower.includes('syntax error at or near') ||
    lower.includes('relation "') ||
    lower.includes('column "')
  ) {
    return 'A server error occurred while processing your request. Please try again later.';
  }
  return null;
}

/**
 * Converts a raw slug or snake_case code (e.g. "cannot_proceed_now") into a readable sentence.
 */
function formatSlugToSentence(slug: string): string {
  const clean = slug.replace(/[_-]+/g, ' ').replace(/\s+/g, ' ').trim();

  if (!clean) return 'An unexpected error occurred. Please try again.';
  const capitalized = clean.charAt(0).toUpperCase() + clean.slice(1);
  return `${capitalized}. Please try again or contact support if the issue persists.`;
}

/**
 * Main sanitizer function to ensure all user alerts are informative, generic, and friendly.
 */
export function sanitizeErrorMessage(rawInput: unknown): string {
  if (rawInput === null || rawInput === undefined) {
    return 'An unexpected error occurred. Please try again.';
  }

  let message =
    typeof rawInput === 'string' ? rawInput : (rawInput as any)?.message || String(rawInput);

  if (typeof message !== 'string') {
    message = String(message);
  }

  const trimmed = message.trim();
  if (!trimmed) {
    return 'An unexpected error occurred. Please try again.';
  }

  // Exact code / slug match
  const normalizedKey = trimmed.toLowerCase().replace(/[\s.-]+/g, '_');
  if (KNOWN_ERROR_CODES[normalizedKey]) {
    return KNOWN_ERROR_CODES[normalizedKey];
  }
  if (KNOWN_ERROR_CODES[trimmed.toLowerCase()]) {
    return KNOWN_ERROR_CODES[trimmed.toLowerCase()];
  }

  const lower = trimmed.toLowerCase();

  // 1. If it's a network, DNS, or offline connectivity failure
  for (const pattern of NETWORK_ERROR_PATTERNS) {
    if (lower.includes(pattern)) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
  }

  // 2. If it contains raw HTML (e.g. Render 502/503 HTML error pages)
  if (
    trimmed.includes('<!DOCTYPE') ||
    trimmed.includes('<html') ||
    lower.includes('server returned an error page')
  ) {
    return 'The server is temporarily unavailable (waking up). Please try again in a few moments.';
  }

  // 3. Check for substring patterns (database constraints, active_jobs in sentence, etc.)
  const substringMatch = checkSubstringPatterns(lower);
  if (substringMatch) {
    return substringMatch;
  }

  // 4. If it is a pure slug / snake_case / kebab-case string without spaces (e.g. "cannot_delete_item")
  if (/^[a-zA-Z0-9]+([_-][a-zA-Z0-9]+)+$/.test(trimmed)) {
    return formatSlugToSentence(trimmed);
  }

  // 5. Strip any URLs or backend links from the text
  let sanitized = trimmed;
  for (const regex of SENSITIVE_URL_PATTERNS) {
    sanitized = sanitized.replace(regex, 'the server');
  }

  // Clean up any double spaces or odd grammar left by replacement
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // If the sanitization wiped out the entire message or left it nonsensical
  if (!sanitized || sanitized === 'the server' || sanitized.length < 3) {
    return 'Unable to complete your request. Please try again.';
  }

  return sanitized;
}

/**
 * Sanitizes titles so that technical codes in alert titles are also formatted cleanly.
 */
export function sanitizeErrorTitle(rawTitle: unknown, defaultTitle = 'Notification'): string {
  if (!rawTitle || typeof rawTitle !== 'string' || !rawTitle.trim()) {
    return defaultTitle;
  }
  const trimmed = rawTitle.trim();
  const lowerKey = trimmed.toLowerCase().replace(/[\s.-]+/g, '_');

  if (lowerKey === 'active_job' || lowerKey === 'active_jobs') {
    return 'Active Jobs In Progress';
  }
  if (lowerKey === 'pending_application' || lowerKey === 'pending_applications') {
    return 'Pending Applications';
  }
  if (/^[a-zA-Z0-9]+([_-][a-zA-Z0-9]+)+$/.test(trimmed)) {
    const formatted = trimmed.replace(/[_-]+/g, ' ').trim();
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  }
  return trimmed;
}
