import React, { createContext, useContext, useState, useEffect } from 'react';
import { getItemAsync, setItemAsync } from '../utils/storage';
import { en, TranslationKey } from '../locales/en';
import { tl } from '../locales/tl';

export type Language = 'en' | 'tl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

const STORAGE_KEY = 'sikap_app_language';

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

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('en');

  useEffect(() => {
    const loadSavedLanguage = async () => {
      try {
        const saved = await getItemAsync(STORAGE_KEY);
        if (saved === 'en' || saved === 'tl') {
          setLanguageState(saved);
        }
      } catch (e) {
        console.warn('Failed to load saved language preference:', e);
      }
    };
    loadSavedLanguage();
  }, []);

  const setLanguage = async (newLang: Language) => {
    setLanguageState(newLang);
    try {
      await setItemAsync(STORAGE_KEY, newLang);
    } catch (e) {
      console.warn('Failed to save language preference:', e);
    }
  };

  const t = (key: TranslationKey, params?: Record<string, string | number>): string => {
    const raw = translations[language]?.[key] || translations.en[key] || (key as string);
    return interpolate(raw, params);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
