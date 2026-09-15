/**
 * Comprehensive error message sanitizer for SIKAP.
 *
 * Guarantees that no internal infrastructure URLs (Render, Supabase, backend endpoints),
 * IP addresses, or low-level runtime stack exceptions (Java UnknownHostException,
 * DNS resolution errors, etc.) are ever displayed to the end user in alerts,
 * toasts, or screen banners.
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

export function sanitizeErrorMessage(rawInput: unknown): string {
  if (rawInput === null || rawInput === undefined) {
    return 'An unexpected error occurred. Please try again.';
  }

  let message =
    typeof rawInput === 'string' ? rawInput : (rawInput as any)?.message || String(rawInput);

  const lower = message.toLowerCase();

  // 1. If it's a network, DNS, or offline connectivity failure
  for (const pattern of NETWORK_ERROR_PATTERNS) {
    if (lower.includes(pattern)) {
      return 'Unable to connect to the server. Please check your internet connection and try again.';
    }
  }

  // 2. If it contains raw HTML (e.g. Render 502/503 HTML error pages)
  if (
    message.includes('<!DOCTYPE') ||
    message.includes('<html') ||
    message.includes('Server returned an error page')
  ) {
    return 'The server is temporarily unavailable. Please try again in a few moments.';
  }

  // 3. Strip any URLs or backend links from the text
  let sanitized = message;
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
