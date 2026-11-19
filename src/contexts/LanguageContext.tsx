import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { getItemAsync, getItemSync, setItemAsync } from '../utils/storage';
import { en, TranslationKey } from '../locales/en';
import { tl } from '../locales/tl';

export type Language = 'en' | 'tl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const STORAGE_KEY = 'sikap_app_language';

export const getLanguageStorageKey = (_userId?: number | string | null): string => STORAGE_KEY;

const getInitialLanguageSync = (): Language => {
  try {
    const saved = getItemSync(STORAGE_KEY);
    if (saved === 'en' || saved === 'tl') {
      return saved;
    }
  } catch {
    // Ignore sync read errors
  }
  return 'en';
};

const translations: Record<Language, Record<TranslationKey, string>> = {
  en,
  tl,
};

const interpolate = (template: string, params?: Record<string, string | number>): string => {
  if (!params) return template;
  let result = template;
  for (const [key, val] of Object.entries(params)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), String(val));
  }
  return result;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: async () => {},
  t: (key: TranslationKey, params?: Record<string, string | number>) =>
    interpolate(en[key] || (key as string), params),
});

let currentActiveLanguage: Language = 'en';

export const getActiveLanguage = (): Language => currentActiveLanguage;

export const translateForLanguage = (
  lang: Language,
  key: TranslationKey,
  params?: Record<string, string | number>,
): string => {
  const raw = translations[lang]?.[key] || translations.en[key] || (key as string);
  return interpolate(raw, params);
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const initial = getInitialLanguageSync();
    currentActiveLanguage = initial;
    return initial;
  });

  const applyLanguageState = useCallback((nextLang: Language) => {
    currentActiveLanguage = nextLang;
    setLanguageState(nextLang);
  }, []);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const saved = await getItemAsync(STORAGE_KEY);
        if (isMounted && (saved === 'en' || saved === 'tl')) {
          applyLanguageState(saved);
        }
      } catch (e) {
        console.warn('Failed to load saved language preference:', e);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [applyLanguageState]);

  const setLanguage = useCallback(
    async (newLang: Language) => {
      applyLanguageState(newLang);
      try {
        await setItemAsync(STORAGE_KEY, newLang);
      } catch (e) {
        console.warn('Failed to save language preference:', e);
      }
    },
    [applyLanguageState],
  );

  const t = useCallback(
    (key: TranslationKey, params?: Record<string, string | number>): string => {
      return translateForLanguage(language, key, params);
    },
    [language],
  );

  const contextValue = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <LanguageContext.Provider value={contextValue}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => useContext(LanguageContext);
