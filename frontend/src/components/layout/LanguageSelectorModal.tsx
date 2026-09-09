import React from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { useLanguageStore } from '../../store/useLanguageStore';
import type { Language } from '../../services/i18n';
import { t } from '../../services/i18n';
import { Globe, Check } from 'lucide-react';

export const LanguageSelectorModal: React.FC = () => {
  const { language, isLanguageModalOpen, closeLanguageModal, changeLanguage } = useLanguageStore();

  const languages: { code: Language; name: string; local: string }[] = [
    { code: 'te', name: 'Telugu', local: 'తెలుగు' },
    { code: 'hi', name: 'Hindi', local: 'हिन्दी' },
    { code: 'en', name: 'English', local: 'English' }
  ];

  return (
    <Modal
      isOpen={isLanguageModalOpen}
      onClose={closeLanguageModal}
      title={t('select_language')}
      maxWidth="sm"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 font-medium text-center">
          {t('language_sub')}
        </p>

        <div className="space-y-3 pt-2">
          {languages.map((lang) => {
            const isSelected = language === lang.code;
            return (
              <button
                key={lang.code}
                onClick={() => changeLanguage(lang.code)}
                className={`w-full flex items-center justify-between px-5 py-4 rounded-xl border-2 transition-all cursor-pointer text-left tap-target ${
                  isSelected
                    ? 'border-blue-900 bg-blue-50/70 text-blue-950 font-bold shadow-xs'
                    : 'border-slate-200 bg-white hover:border-slate-300 text-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Globe size={20} className={isSelected ? 'text-blue-900' : 'text-slate-400'} />
                  <div>
                    <p className="text-lg font-bold leading-tight">{lang.local}</p>
                    <p className="text-xs text-slate-500 font-medium">{lang.name}</p>
                  </div>
                </div>
                {isSelected && (
                  <div className="w-7 h-7 rounded-full bg-blue-900 text-white flex items-center justify-center">
                    <Check size={16} />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        <div className="pt-4">
          <Button fullWidth onClick={closeLanguageModal}>
            {t('continue')}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
