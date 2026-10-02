import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { LanguageCode, translations, SUPPORTED_LANGUAGES } from './translations';

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  supportedLanguages: typeof SUPPORTED_LANGUAGES;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectInitialLanguage(): LanguageCode {
  try {
    const saved = localStorage.getItem('certstudy_language');
    if (saved && ['en', 'pt', 'es', 'it'].includes(saved)) {
      return saved as LanguageCode;
    }
    const navLang = navigator.language.slice(0, 2).toLowerCase();
    if (navLang === 'pt') return 'pt';
    if (navLang === 'es') return 'es';
    if (navLang === 'it') return 'it';
  } catch (e) {
    // ignore
  }
  return 'en';
}

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<LanguageCode>(detectInitialLanguage);

  const setLanguage = (lang: LanguageCode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('certstudy_language', lang);
    } catch (e) {
      // ignore
    }
  };

  const t = useMemo(() => {
    return (key: string, params?: Record<string, string | number>): string => {
      const currentLangTable = translations[language] || {};
      const fallbackTable = translations.en || {};

      let alias = '';
      if (key.startsWith('common.')) {
        alias = 'app.' + key.slice(7);
      } else if (key.startsWith('app.')) {
        alias = 'common.' + key.slice(4);
      }

      let text = currentLangTable[key] || 
                 (alias && currentLangTable[alias]) || 
                 fallbackTable[key] || 
                 (alias && fallbackTable[alias]) || 
                 key;

      if (params) {
        Object.entries(params).forEach(([paramKey, paramVal]) => {
          text = text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(paramVal));
        });
      }

      return text;
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}
