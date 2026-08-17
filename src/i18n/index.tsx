import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Lang, translations } from './translations';

const STORAGE_KEY = 'ayala_lang';

type TParams = Record<string, string | number>;

type I18nValue = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, params?: TParams) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: 'ru',
  setLang: () => {},
  t: (key) => key,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('ru');

  // Восстанавливаем выбранный язык при запуске.
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((v) => {
      if (v === 'ru' || v === 'kk') setLangState(v);
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(STORAGE_KEY, l).catch(() => {});
  }, []);

  const t = useCallback(
    (key: string, params?: TParams) => {
      let str = translations[lang][key] ?? translations.ru[key] ?? key;
      if (params) {
        for (const k of Object.keys(params)) {
          str = str.replace(`{${k}}`, String(params[k]));
        }
      }
      return str;
    },
    [lang],
  );

  return <I18nContext.Provider value={{ lang, setLang, t }}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
