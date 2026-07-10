"use client";

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import RsvpModal from '@/components/RsvpModal';
import type { GuestLogVariant } from '@/utils/guestLog';

type RsvpSectionProps = {
  names: string;
  variant?: GuestLogVariant;
};

export default function RsvpSection({ names, variant = 'religious' }: RsvpSectionProps) {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const isTraditional = variant === 'traditional';

  const sectionClasses = isTraditional
    ? 'rounded-3xl border border-sky-100 bg-gradient-to-r from-white to-lime-50 p-10 shadow-soft'
    : 'rounded-3xl border border-[#d4af37]/40 bg-gradient-to-r from-black/70 to-[#1a1a1a] p-10 shadow-soft';
  const eyebrowClasses = isTraditional ? 'text-sky-600' : 'text-[#d4af37]';
  const titleClasses = isTraditional ? 'text-sky-950' : 'text-[#f8e7b5]';
  const bodyClasses = isTraditional ? 'text-sky-800' : 'text-[#e9d8a6]';
  const buttonClasses = isTraditional
    ? 'rounded-full border border-sky-600 bg-sky-600 px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-sky-700'
    : 'rounded-full border border-[#d4af37] bg-[#d4af37] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#e3c35a]';

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-4 text-center sm:px-6 lg:px-8">
      <div className={`fade-in-up ${sectionClasses}`}>
        <p className={`text-xs uppercase tracking-[0.22em] ${eyebrowClasses}`}>{t('willYouJoinUs')}</p>
        <h2 className={`mt-3 font-serif text-3xl sm:text-4xl ${titleClasses}`}>{t('rsvp')}</h2>
        <p className={`mx-auto mt-3 max-w-2xl text-sm leading-relaxed ${bodyClasses}`}>
          {t('yourPresence')} {names}.
        </p>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className={`mt-7 ${buttonClasses}`}
        >
          {t('openRsvp')}
        </button>
      </div>

      <RsvpModal isOpen={isOpen} onClose={() => setIsOpen(false)} coupleName={names} variant={variant} />
    </section>
  );
}
