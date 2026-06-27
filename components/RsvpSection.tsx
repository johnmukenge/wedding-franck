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

  return (
    <section className="mx-auto max-w-6xl px-4 pb-24 pt-4 text-center sm:px-6 lg:px-8">
      <div className="fade-in-up rounded-3xl border border-[#d4af37]/40 bg-gradient-to-r from-black/70 to-[#1a1a1a] p-10 shadow-soft">
        <p className="text-xs uppercase tracking-[0.22em] text-[#d4af37]">{t('willYouJoinUs')}</p>
        <h2 className="mt-3 font-serif text-3xl text-[#f8e7b5] sm:text-4xl">{t('rsvp')}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-[#e9d8a6]">
          {t('yourPresence')} {names}.
        </p>

        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="mt-7 rounded-full border border-[#d4af37] bg-[#d4af37] px-7 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black transition hover:bg-[#e3c35a]"
        >
          {t('openRsvp')}
        </button>
      </div>

      <RsvpModal isOpen={isOpen} onClose={() => setIsOpen(false)} coupleName={names} variant={variant} />
    </section>
  );
}
