import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { useAuth } from '../features/auth/AuthContext';
import { DEFAULT_LANGUAGE_CODE, codeToLabel, labelToCode, translations } from './translations';

const I18N_STORAGE_KEY = 'blackreel-language-code';

const I18nContext = createContext(null);

const getByPath = (obj, path) =>
  String(path || '')
    .split('.')
    .reduce((acc, key) => (acc && typeof acc === 'object' ? acc[key] : undefined), obj);

const readStoredLanguageCode = () => {
  try {
    const code = localStorage.getItem(I18N_STORAGE_KEY);
    return code || DEFAULT_LANGUAGE_CODE;
  } catch {
    return DEFAULT_LANGUAGE_CODE;
  }
};

export const I18nProvider = ({ children }) => {
  const { user } = useAuth();
  const [languageCode, setLanguageCode] = useState(readStoredLanguageCode);

  const userLanguageCode = labelToCode(user?.preferences?.language || '');

  useEffect(() => {
    if (!user?.preferences?.language) {
      return;
    }

    setLanguageCode(userLanguageCode);
  }, [userLanguageCode, user?.preferences?.language]);

  useEffect(() => {
    try {
      localStorage.setItem(I18N_STORAGE_KEY, languageCode);
    } catch {
      // Ignore storage failures; runtime switching still works.
    }

    document.documentElement.lang = languageCode;
  }, [languageCode]);

  const value = useMemo(() => {
    const dict = translations[languageCode] || translations[DEFAULT_LANGUAGE_CODE];

    return {
      languageCode,
      languageLabel: codeToLabel(languageCode),
      setLanguageCode,
      setLanguageLabel: (label) => setLanguageCode(labelToCode(label)),
      t: (key, fallback = key) => getByPath(dict, key) ?? fallback,
    };
  }, [languageCode]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export const useI18n = () => {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }

  return context;
};
