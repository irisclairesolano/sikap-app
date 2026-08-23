import * as SecureStore from '../utils/storage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL;

console.log('🔗 API Base URL:', BASE_URL);

export class ApiClientError extends Error {
  readonly status: number;
  readonly errors?: Record<string, string[]>;
  readonly metadata?: Record<string, any>;

  constructor(
    message: string,
    status: number,
    errors?: Record<string, string[]>,
    metadata?: Record<string, any>,
  ) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.errors = errors;
    this.metadata = metadata;
  }
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = await SecureStore.getItemAsync('auth_token');
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  console.log(`🔗 API Request: ${BASE_URL}${endpoint}`, {
    method: options.method || 'GET',
    hasToken: !!token,
  });

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(typeof options.headers === 'object' &&
    options.headers !== null &&
    !Array.isArray(options.headers)
      ? (options.headers as Record<string, string>)
      : {}),
  };

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Add a 60 second timeout for Render cold starts
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 60000);

  let res: Response;
  try {
    res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal as any,
    });
    clearTimeout(timeoutId);
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.log(`dY"- API Timeout: ${endpoint}`);
      throw new Error(
        'The server is taking too long to respond (likely waking up). Please try again.',
      );
    }
    throw error;
  }

  console.log(`dY"- API Response: ${endpoint}`, {
    status: res.status,
    ok: res.ok,
  });

  if (res.status === 401) {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_profile');
    throw new ApiClientError('UNAUTHORIZED', 401);
  }

  if (!res.ok) {
    let errBody: { message?: string; errors?: Record<string, string[]> } = {};
    let rawText = '';
    let contentType = res.headers.get('content-type') || '';

    console.log('🔍 HTTP Response Details:', {
      status: res.status,
      statusText: res.statusText,
      contentType: contentType,
      headers: Object.fromEntries(res.headers.entries()),
    });

    try {
      const responseText = await res.text();
      rawText = responseText;
      console.log('🔍 Raw Response Text:', responseText);

      // Check if it's HTML (common error pages)
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
        console.log('🔍 Response is HTML - likely an error page');
        errBody.message = 'Server returned an error page instead of JSON';
      } else {
        // Try to parse as JSON
        errBody = JSON.parse(responseText);
        console.log('🔍 Parsed JSON Response:', errBody);
      }

      console.log('🔍 API Error Details:', {
        status: res.status,
        statusText: res.statusText,
        body: errBody,
        rawText: rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''),
        contentType: contentType,
      });
    } catch (parseError) {
      console.log('🔍 API Error Details: Could not parse response body');
      console.log('🔍 Parse Error:', parseError);
      console.log(
        '🔍 Raw Response Text:',
        rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''),
      );
      errBody.message = 'Failed to parse server response';
    }
    const displayMessage =
      res.status >= 500
        ? 'An unexpected server error occurred. Please try again later.'
        : (errBody.message ?? 'Something went wrong');

    throw new ApiClientError(displayMessage, res.status, errBody.errors, errBody);
  }

  // Log successful response before parsing
  console.log('🔍 API Success Response:', {
    status: res.status,
    statusText: res.statusText,
    headers: Object.fromEntries(res.headers.entries()),
  });

  try {
    const data = await res.json();
    console.log('🔍 API Parsed Response:', data);
    return data;
  } catch (parseError) {
    console.log('🔍 API Parse Error:', parseError);
    console.log('🔍 Raw Response Text:', await res.text());
    throw new Error('Failed to parse server response');
  }
}
