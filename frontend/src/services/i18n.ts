import en from '../locales/en.json';
import te from '../locales/te.json';
import hi from '../locales/hi.json';

export type Language = 'en' | 'te' | 'hi';

const translations: Record<Language, Record<string, string>> = {
  en,
  te,
  hi
};

let currentLanguage: Language = (localStorage.getItem('mandimithra_lang') as Language) || (localStorage.getItem('agriflow_lang') as Language) || 'en';
const listeners = new Set<() => void>();

export const getLanguage = (): Language => currentLanguage;

export const setLanguage = (lang: Language) => {
  currentLanguage = lang;
  localStorage.setItem('mandimithra_lang', lang);
  listeners.forEach(fn => fn());
};

export const t = (key: string, params?: Record<string, string | number>): string => {
  let val = translations[currentLanguage]?.[key] || translations['en']?.[key] || key;
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      val = val.replace(new RegExp(`{\\s*${k}\\s*}`, 'g'), String(v));
    });
  }
  return val;
};

export const subscribeLanguage = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
