import * as SecureStore from '../utils/storage';
import { onlineManager } from '@tanstack/react-query';
import { sanitizeErrorMessage } from '../utils/errorSanitizer';
import { notifyAuthChanged } from '../store/authEvents';

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://sikap-backend-singapore.onrender.com/api/v1';

if (__DEV__) {
  console.log('🔗 API Base URL:', BASE_URL);
}

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

  if (__DEV__) {
    console.log(`🔗 API Request: ${BASE_URL}${endpoint}`, {
      method: options.method || 'GET',
      hasToken: !!token,
    });
  }

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
  } else {
    delete headers['Content-Type'];
    delete headers['content-type'];
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
      console.log(`⏱️ API Timeout: ${endpoint}`);
      throw new Error(
        'The server is taking too long to respond (likely waking up). Please try again.',
      );
    }

    const errorMsg = error?.message || String(error);
    const sanitizedMsg = sanitizeErrorMessage(errorMsg);

    if (sanitizedMsg.includes('Unable to connect to the server') || error?.name === 'TypeError') {
      console.warn(`⚠️ Network connection issue for ${endpoint}:`, errorMsg);
      onlineManager.setOnline(false);
    }

    throw new Error(sanitizedMsg);
  }

  if (!onlineManager.isOnline()) {
    onlineManager.setOnline(true);
  }

  if (__DEV__) {
    console.log(`🔗 API Response: ${endpoint}`, {
      status: res.status,
      ok: res.ok,
    });
  }

  if (res.status === 401) {
    await SecureStore.deleteItemAsync('auth_token');
    await SecureStore.deleteItemAsync('user_profile');
    notifyAuthChanged();
    throw new ApiClientError('UNAUTHORIZED', 401);
  }

  if (!res.ok) {
    let errBody: { message?: string; errors?: Record<string, string[]> } = {};
    let rawText = '';
    const contentType = res.headers.get('content-type') || '';

    try {
      const responseText = await res.text();
      rawText = responseText;

      // Check if it's HTML (common error pages)
      if (responseText.includes('<!DOCTYPE html>') || responseText.includes('<html>')) {
        errBody.message = 'Server returned an error page instead of JSON';
      } else {
        // Try to parse as JSON
        errBody = JSON.parse(responseText);
      }

      if (__DEV__) {
        console.warn('🔍 API Error Details:', {
          status: res.status,
          statusText: res.statusText,
          body: errBody,
          rawText: rawText.substring(0, 500) + (rawText.length > 500 ? '...' : ''),
          contentType: contentType,
        });
      }
    } catch (parseError) {
      if (__DEV__) {
        console.warn('🔍 API Error Details: Could not parse response body', parseError);
      }
      errBody.message = 'Failed to parse server response';
    }

    let displayMessage = 'Something went wrong';
    if (res.status === 422) {
      const validationErrors = errBody.errors || errBody;
      if (
        validationErrors &&
        typeof validationErrors === 'object' &&
        !Array.isArray(validationErrors)
      ) {
        const errorValues = Object.values(validationErrors);
        if (errorValues.length > 0) {
          const firstErrorVal = errorValues[0];
          if (Array.isArray(firstErrorVal) && firstErrorVal[0]) {
            displayMessage = firstErrorVal[0];
          } else if (typeof firstErrorVal === 'string') {
            displayMessage = firstErrorVal;
          }
        }
      }
      if (displayMessage === 'Something went wrong' && errBody.message) {
        displayMessage = errBody.message;
      }
    } else {
      displayMessage =
        res.status >= 500
          ? errBody.message || 'An unexpected server error occurred. Please try again later.'
          : (errBody.message ?? 'Something went wrong');
    }

    const cleanDisplayMessage = sanitizeErrorMessage(displayMessage);
    throw new ApiClientError(cleanDisplayMessage, res.status, errBody.errors, errBody);
  }

  try {
    const data = await res.json();
    return data;
  } catch (parseError) {
    if (__DEV__) {
      console.warn('🔍 API Parse Error:', parseError);
    }
    throw new Error('Failed to parse server response');
  }
}
