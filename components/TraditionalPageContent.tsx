"use client";

import { Suspense, useMemo } from 'react';
import { traditionalWeddingData } from '@/data';
import Countdown from '@/components/Countdown';
import Gallery from '@/components/Gallery';
import AudioPlayer from '@/components/AudioPlayer';
import RsvpSection from '@/components/RsvpSection';
import GuestCheckInPanel from '@/components/GuestCheckInPanel';
import CheckInAdminPanel from '@/components/CheckInAdminPanel';
import { getTranslation } from '@/i18n/translations';

const getLocale = (language: 'en' | 'fr') => {
  if (language === 'fr') return 'fr-FR';
  return 'en-GB';
};

export default function TraditionalPageContent() {
  const language = 'fr';
  const t = (key: string) => getTranslation(language, key);

  const formattedDate = useMemo(() => {
    return new Date(traditionalWeddingData.weddingDate).toLocaleDateString(getLocale(language), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  const formattedTime = useMemo(() => {
    return new Date(traditionalWeddingData.weddingDate).toLocaleTimeString(getLocale(language), {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const motifStyle = {
    backgroundImage:
      'radial-gradient(circle at 15% 18%, rgba(37, 99, 235, 0.22) 0 9%, transparent 9.2%), radial-gradient(circle at 80% 20%, rgba(163, 230, 53, 0.24) 0 8%, transparent 8.2%), radial-gradient(circle at 24% 72%, rgba(250, 204, 21, 0.2) 0 7%, transparent 7.2%), radial-gradient(circle at 76% 76%, rgba(59, 130, 246, 0.24) 0 8%, transparent 8.2%), repeating-linear-gradient(140deg, rgba(59, 130, 246, 0.09) 0 1px, transparent 1px 18px), repeating-linear-gradient(35deg, rgba(163, 230, 53, 0.08) 0 1px, transparent 1px 24px), linear-gradient(135deg, #ffffff 0%, #f4fbff 48%, #fffde8 100%)',
  } as const;

  return (
    <main className="bg-white text-sky-950">
      <section className="relative overflow-hidden border-b border-sky-200/70">
        <div className="absolute inset-0 opacity-95" style={motifStyle} aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-b from-white/50 via-transparent to-[#f6fff0]/80" aria-hidden />

        <div className="relative mx-auto flex min-h-screen max-w-7xl items-center px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid w-full gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="fade-in-up max-w-2xl">
              <p className="inline-flex rounded-full border border-sky-200 bg-white/80 px-4 py-1 text-xs uppercase tracking-[0.3em] text-sky-700 shadow-sm backdrop-blur">
                Save the date · Mariage traditionnel congolais
              </p>
              <p className="mt-4 text-sm font-semibold tracking-wide text-sky-700">
                {t('traditionalSalutationLine')}
              </p>
              <h1 className="mt-6 font-serif text-5xl leading-tight text-sky-950 sm:text-6xl lg:text-7xl">
                Franck & Charly
              </h1>
              <p className="mt-5 max-w-xl text-base leading-8 text-sky-900/85 sm:text-lg">
                {t('traditionalCoutumierBody')}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <a
                  href="#details"
                  className="rounded-full bg-sky-700 px-6 py-3 text-xs uppercase tracking-[0.22em] text-white shadow-lg transition hover:bg-sky-800"
                >
                  Voir les détails
                </a>
                <div className="rounded-full border border-lime-300 bg-white/85 px-5 py-3 text-sm text-sky-900 shadow-sm backdrop-blur">
                  {formattedDate} · {formattedTime} · Kinshasa
                </div>
              </div>
            </div>

            <div className="fade-in-up fade-in-delay-1 lg:justify-self-end">
              <div className="relative mx-auto max-w-xl overflow-hidden rounded-[2rem] border border-white/80 bg-white/65 p-4 shadow-[0_24px_80px_rgba(14,116,144,0.18)] backdrop-blur-md">
                <div className="absolute inset-0 opacity-85" style={motifStyle} aria-hidden />
                <div className="relative rounded-[1.65rem] border border-sky-100/80 bg-white/88 px-8 py-10 text-center shadow-inner">
                  <p className="text-xs uppercase tracking-[0.32em] text-sky-700">Invitation</p>
                  <h2 className="mt-4 font-serif text-4xl text-sky-950 sm:text-5xl">Save the date</h2>
                  <div className="mx-auto mt-6 h-px w-20 bg-gradient-to-r from-transparent via-lime-500 to-transparent" />
                  <p className="mt-6 text-base uppercase tracking-[0.28em] text-lime-700">25 juillet 2026</p>
                  <p className="mt-2 text-sm leading-7 text-sky-900/90">{traditionalWeddingData.venue.name} · Kinshasa</p>
                  <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs uppercase tracking-[0.2em] text-sky-800">
                    <div className="rounded-2xl bg-white py-4 shadow-sm ring-1 ring-sky-100">
                      <span className="block text-2xl font-serif text-sky-950">25</span>
                      Juil.
                    </div>
                    <div className="rounded-2xl bg-lime-50 py-4 shadow-sm ring-1 ring-lime-100">
                      <span className="block text-2xl font-serif text-sky-950">19h00</span>
                      Début
                    </div>
                    <div className="rounded-2xl bg-yellow-50 py-4 shadow-sm ring-1 ring-yellow-100">
                      <span className="block text-2xl font-serif text-sky-950">2026</span>
                      Année
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Suspense fallback={null}>
        <GuestCheckInPanel variant="traditional" />
      </Suspense>
      <Suspense fallback={null}>
        <CheckInAdminPanel variant="traditional" />
      </Suspense>

      <section id="details" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="fade-in-up rounded-[2rem] border border-sky-100 bg-white p-8 shadow-soft backdrop-blur">
          <p className="text-xs uppercase tracking-[0.25em] text-sky-600">{t('untilWeDoIT')}</p>
          <h2 className="mt-3 font-serif text-3xl text-sky-950 sm:text-4xl">{t('countdown')}</h2>
          <p className="mt-4 text-sm leading-7 text-sky-800">
            {t('traditionalCoutumierBody')}
          </p>
          <div className="mt-8">
            <Countdown targetDate={traditionalWeddingData.weddingDate} />
          </div>
        </div>

        <div className="fade-in-up fade-in-delay-2 mt-8 rounded-[1.75rem] border border-sky-100 bg-white p-6 text-sm text-sky-900 shadow-soft backdrop-blur">
          <p>
            <span className="font-semibold text-sky-700">{t('traditionalGenerosityTitle')}:</span> {t('traditionalGenerosityBody')}
          </p>
          <p className="mt-3 text-center font-semibold text-sky-700">{t('traditionalWelcome')}</p>
        </div>
      </section>

      <Gallery images={traditionalWeddingData.gallery} />
      <RsvpSection names={traditionalWeddingData.couple.displayName} variant="traditional" />
      <AudioPlayer src={traditionalWeddingData.audioUrl} />
    </main>
  );
}
