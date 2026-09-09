import { create } from 'zustand';

export type SupportedLanguage = 'en' | 'te' | 'hi';

interface LanguageState {
  language: SupportedLanguage;
  currentLang: SupportedLanguage;
  isLanguageModalOpen: boolean;
  setLanguage: (lang: SupportedLanguage) => void;
  changeLanguage: (lang: SupportedLanguage) => void;
  openLanguageModal: () => void;
  closeLanguageModal: () => void;
}

export const useLanguageStore = create<LanguageState>((set) => {
  const savedLang = (localStorage.getItem('mandimithra_lang') as SupportedLanguage) || 'en';

  return {
    language: savedLang,
    currentLang: savedLang,
    isLanguageModalOpen: false,
    setLanguage: (lang: SupportedLanguage) => {
      localStorage.setItem('mandimithra_lang', lang);
      set({ language: lang, currentLang: lang });
    },
    changeLanguage: (lang: SupportedLanguage) => {
      localStorage.setItem('mandimithra_lang', lang);
      set({ language: lang, currentLang: lang, isLanguageModalOpen: false });
    },
    openLanguageModal: () => set({ isLanguageModalOpen: true }),
    closeLanguageModal: () => set({ isLanguageModalOpen: false })
  };
});
