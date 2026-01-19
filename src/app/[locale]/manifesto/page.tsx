"use client";

import { Navbar1 } from "@/components/ui/navbar";
import { useTranslations } from 'next-intl';

export default function ManifestoPage() {
  const t = useTranslations('manifesto');
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar1 />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 font-[family-name:var(--font-perfectly-nineties)]">
          {t('title')}
        </h1>
        <p className="text-xl md:text-2xl font-semibold mb-12 text-white/90 font-[family-name:var(--font-geist-mono)]">
          {t('subtitle')}
        </p>

        <div className="prose prose-invert prose-lg max-w-none space-y-8 font-[family-name:var(--font-geist-mono)]">
          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph3')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph4')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph5')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph6')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('intro.paragraph7')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.independence.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.independence.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.independence.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.independence.paragraph3')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.independence.paragraph4')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.whatAISEA.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.whatAISEA.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.whatAISEA.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.whatAISEA.paragraph3')}
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
            {(t.raw('sections.whatAISEA.list') as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-white/90 text-lg leading-relaxed mt-6">
            {t('sections.whatAISEA.paragraph4')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.authority.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.authority.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.authority.paragraph2')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.autonomy.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.autonomy.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.autonomy.paragraph2')}
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
            {(t.raw('sections.autonomy.list') as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-white/90 text-lg leading-relaxed mt-6">
            {t('sections.autonomy.paragraph3')}
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
            {(t.raw('sections.autonomy.reasons') as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-white/90 text-lg leading-relaxed mt-6">
            {t('sections.autonomy.paragraph4')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.valueFlow.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.valueFlow.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.valueFlow.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.valueFlow.paragraph3')}
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
            {(t.raw('sections.valueFlow.list') as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-white/90 text-lg leading-relaxed mt-6">
            {t('sections.valueFlow.paragraph4')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.crossBorder.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.crossBorder.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.crossBorder.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.crossBorder.paragraph3')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.crossBorder.paragraph4')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.crossBorder.paragraph5')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.continuity.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.continuity.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.continuity.paragraph2')}
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
            {(t.raw('sections.continuity.list') as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-white/90 text-lg leading-relaxed mt-6">
            {t('sections.continuity.paragraph3')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.accountability.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.accountability.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.accountability.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.accountability.paragraph3')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.accountability.paragraph4')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.accountability.paragraph5')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.contribution.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.contribution.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.contribution.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.contribution.paragraph3')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.contribution.paragraph4')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.contribution.paragraph5')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.commitment.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.commitment.paragraph1')}
          </p>

          <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
            {(t.raw('sections.commitment.list') as string[]).map((item: string, index: number) => (
              <li key={index}>{item}</li>
            ))}
          </ul>

          <p className="text-white/90 text-lg leading-relaxed mt-6">
            {t('sections.commitment.paragraph2')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.commitment.paragraph3')}
          </p>
        </div>
      </div>
    </div>
  );
}
