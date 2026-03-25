"use client";

import { Navbar1 } from "@/components/ui/navbar";
import { useTranslations } from 'next-intl';

export default function EventsPage() {
  const t = useTranslations('events');
  
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar1 />
      <article className="max-w-6xl mx-auto px-4 py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-8 font-[family-name:var(--font-perfectly-nineties)]">
          {t('title')}
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-12 font-[family-name:var(--font-geist-mono)]">
          {t('description')}
        </p>
        
        <div className="space-y-8 mb-12">
          <div className="border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">{t('aiseaWeek.title')}</h2>
            <p className="text-white/70 mb-4">{t('aiseaWeek.dates')}</p>
            <p className="text-white/80 mb-4">
              {t('aiseaWeek.description')}
            </p>
            <a
              href="https://luma.com/ai-sea-week"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-white text-black rounded-full hover:bg-white/90 transition-colors font-medium"
            >
              {t('aiseaWeek.registerNow')}
            </a>
          </div>

          <div className="border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors">
            <h2 className="text-2xl font-semibold mb-2">{t('pastEvents.title')}</h2>
            <p className="text-white/70 mb-4">{t('pastEvents.description')}</p>
            <a
              href="https://luma.com/ai-sea?k=c&period=past"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block px-6 py-3 bg-transparent border border-white/20 text-white rounded-full hover:bg-white/10 hover:border-white/40 transition-colors font-medium"
            >
              {t('pastEvents.seeAll')}
            </a>
          </div>
        </div>

        {/* Luma Calendar Embed */}
        <div className="w-full">
          <iframe
            src="https://luma.com/embed/calendar/cal-DqBTiRhIzzmBhcU/events"
            width="100%"
            height="800"
            frameBorder="0"
            className="border border-white/20 rounded-lg"
            style={{ minHeight: '450px' }}
            allowFullScreen
            aria-hidden="false"
            tabIndex={0}
            title="AI.SEA Events Calendar"
          />
        </div>
      </article>
    </main>
  );
}
