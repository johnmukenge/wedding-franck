'use client';

import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/i18n/translations';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  const languages: { code: Language; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'fr', label: 'Français' },
  ];

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => setLanguage(lang.code)}
          className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
            language === lang.code
              ? 'border border-[#d4af37] bg-[#d4af37] text-black'
              : 'border border-[#d4af37]/40 bg-black/55 text-[#d4af37] backdrop-blur hover:bg-black/75'
          }`}
        >
          {lang.label}
        </button>
      ))}
    </div>
  );
}
