import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { getItemAsync, getItemSync, setItemAsync, deleteItemAsync } from '../utils/storage';
import { subscribeAuthChanged } from '../store/authEvents';
import { en, TranslationKey } from '../locales/en';
import { tl } from '../locales/tl';

export type Language = 'en' | 'tl';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
}

export const STORAGE_KEY = 'sikap_app_language';

export const getLanguageStorageKey = (userId?: number | string | null): string =>
  userId !== undefined && userId !== null && String(userId).trim() !== ''
    ? `${STORAGE_KEY}_user_${String(userId).trim()}`
    : STORAGE_KEY;

const parseUserIdFromProfile = (profileStr: string | null): string | null => {
  if (!profileStr) return null;
  try {
    const parsed = JSON.parse(profileStr);
    if (
      parsed &&
      parsed.id !== undefined &&
      parsed.id !== null &&
      String(parsed.id).trim() !== ''
    ) {
      return String(parsed.id).trim();
    }
  } catch {
    // Ignore malformed profile JSON
  }
  return null;
};

const resolveStoredUserIdAsync = async (): Promise<string | null> => {
  try {
    const profileStr = await getItemAsync('user_profile');
    return parseUserIdFromProfile(profileStr);
  } catch {
    return null;
  }
};

const getInitialLanguageSync = (): Language => {
  try {
    const userId = parseUserIdFromProfile(getItemSync('user_profile'));
    if (userId) {
      const userSaved = getItemSync(getLanguageStorageKey(userId));
      return userSaved === 'tl' || userSaved === 'en' ? userSaved : 'en';
    }
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
  const activeUserIdRef = useRef<string | null>(
    parseUserIdFromProfile(getItemSync('user_profile')),
  );

  const applyLanguageState = useCallback((nextLang: Language) => {
    currentActiveLanguage = nextLang;
    setLanguageState(nextLang);
  }, []);

  const syncLanguageWithAuth = useCallback(
    async (isAuthEvent: boolean) => {
      try {
        const userId = await resolveStoredUserIdAsync();
        const prevUserId = activeUserIdRef.current;
        activeUserIdRef.current = userId;

        if (userId) {
          const savedForUser = await getItemAsync(getLanguageStorageKey(userId));
          const resolvedLang: Language =
            savedForUser === 'en' || savedForUser === 'tl' ? savedForUser : 'en';
          applyLanguageState(resolvedLang);
          return;
        }

        // No authenticated user: if logging out or auth state changed, reset to English
        if (isAuthEvent || prevUserId !== null) {
          applyLanguageState('en');
          await deleteItemAsync(STORAGE_KEY);
          return;
        }

        // Initial unauthenticated load
        const savedGlobal = await getItemAsync(STORAGE_KEY);
        const resolvedGlobal: Language =
          savedGlobal === 'en' || savedGlobal === 'tl' ? savedGlobal : 'en';
        applyLanguageState(resolvedGlobal);
      } catch (e) {
        console.warn('Failed to load saved language preference:', e);
      }
    },
    [applyLanguageState],
  );

  useEffect(() => {
    syncLanguageWithAuth(false);
    const unsubscribe = subscribeAuthChanged(() => {
      syncLanguageWithAuth(true);
    });
    return unsubscribe;
  }, [syncLanguageWithAuth]);

  const setLanguage = useCallback(
    async (newLang: Language) => {
      applyLanguageState(newLang);
      try {
        const userId = await resolveStoredUserIdAsync();
        activeUserIdRef.current = userId;
        const targetKey = getLanguageStorageKey(userId);
        await setItemAsync(targetKey, newLang);
        if (userId) {
          // Ensure a logged-in account's preference does not leak into the global unauthenticated key
          await deleteItemAsync(STORAGE_KEY);
        }
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
