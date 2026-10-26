import { apiClient } from './client';

export interface TranslationResponse {
  original: string;
  translated: string;
  target_lang: string;
}

/**
 * Translates dynamic user-generated content (e.g. job description, title, or message).
 * Caches in backend automatically.
 */
export async function translateContent(
  text: string,
  targetLang: 'tl' | 'en' = 'tl',
): Promise<string> {
  const clean = text?.trim();
  if (!clean) return text;

  try {
    const res = await apiClient<TranslationResponse>('/translate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: clean,
        target_lang: targetLang,
      }),
    });

    return res?.translated || text;
  } catch (error) {
    console.warn('Translation request failed, defaulting to original:', error);
    return text;
  }
}
