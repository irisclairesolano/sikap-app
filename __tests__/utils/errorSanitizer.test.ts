import { sanitizeErrorMessage } from '../../src/utils/errorSanitizer';

describe('sanitizeErrorMessage', () => {
  it('sanitizes UnknownHostException and hides the backend URL', () => {
    const rawError =
      'TypeError: fetch failed: java.net.UnknownHostException: No address associated with hostname https://sikap-backend-singapore.onrender.com/api/v1/auth/login';
    const result = sanitizeErrorMessage(rawError);
    expect(result).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.',
    );
    expect(result).not.toContain('onrender.com');
    expect(result).not.toContain('https://');
    expect(result).not.toContain('UnknownHostException');
  });

  it('sanitizes Network request failed', () => {
    const rawError = 'TypeError: Network request failed';
    const result = sanitizeErrorMessage(rawError);
    expect(result).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.',
    );
  });

  it('sanitizes Failed to fetch', () => {
    const rawError = 'TypeError: Failed to fetch';
    const result = sanitizeErrorMessage(rawError);
    expect(result).toBe(
      'Unable to connect to the server. Please check your internet connection and try again.',
    );
  });

  it('replaces arbitrary URLs with "the server"', () => {
    const rawError =
      'Connection timed out while contacting https://sikap-backend-singapore.onrender.com/api/v1/jobs';
    const result = sanitizeErrorMessage(rawError);
    expect(result).not.toContain('onrender.com');
    expect(result).not.toContain('https://');
  });

  it('sanitizes HTML server error pages', () => {
    const rawHtml = '<!DOCTYPE html><html><body>502 Bad Gateway</body></html>';
    const result = sanitizeErrorMessage(rawHtml);
    expect(result).toBe(
      'The server is temporarily unavailable. Please try again in a few moments.',
    );
  });

  it('preserves clean user-facing validation errors', () => {
    const validationError = 'The password confirmation does not match.';
    const result = sanitizeErrorMessage(validationError);
    expect(result).toBe('The password confirmation does not match.');
  });
});
