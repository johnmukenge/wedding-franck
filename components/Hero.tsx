"use client";

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';

type HeroProps = {
  names: string;
  dateText: string;
  locationText: string;
  heroImage: string;
};

export default function Hero({ names, dateText, locationText, heroImage }: HeroProps) {
  const { t } = useLanguage();
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const onScroll = () => setOffsetY(window.scrollY * 0.15);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <section className="relative min-h-screen overflow-hidden">
      <div
        className="absolute inset-0 will-change-transform"
        style={{ transform: `translateY(${offsetY}px)` }}
      >
        <div
          className="h-[110%] w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
          aria-hidden
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/65 to-black/85" />
      <div
        className="absolute inset-0 opacity-35"
        style={{
          backgroundImage:
            'radial-gradient(circle at 20% 20%, rgba(212,175,55,0.28) 0 2px, transparent 3px), radial-gradient(circle at 78% 25%, rgba(212,175,55,0.24) 0 2px, transparent 3px), radial-gradient(circle at 30% 80%, rgba(212,175,55,0.2) 0 2px, transparent 3px)',
          backgroundSize: '240px 240px',
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-4 text-center sm:px-6 lg:px-8">
        <p className="fade-in-up rounded-full border border-[#d4af37]/50 bg-black/40 px-4 py-1 text-xs uppercase tracking-[0.28em] text-[#d4af37]">
          {t('weddingInvitation')}
        </p>
        <h1 className="fade-in-up fade-in-delay-1 mt-4 font-serif text-5xl text-[#f6e7b0] drop-shadow-[0_2px_10px_rgba(0,0,0,0.65)] sm:text-6xl lg:text-7xl">
          {names}
        </h1>
        <p className="fade-in-up fade-in-delay-2 mt-4 text-sm tracking-[0.18em] text-[#f5e7c0] sm:text-base">
          {dateText} · {locationText}
        </p>

        <a
          href="#details"
          className="fade-in-up fade-in-delay-3 mt-10 rounded-full border border-[#d4af37] bg-[#d4af37] px-6 py-3 text-xs uppercase tracking-[0.22em] text-black transition hover:bg-[#e3c35a]"
        >
          {t('discoverDetails')}
        </a>
      </div>
    </section>
  );
}
