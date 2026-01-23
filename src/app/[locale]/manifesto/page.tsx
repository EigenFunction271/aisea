"use client";

import { Navbar1 } from "@/components/ui/navbar";
import { useTranslations } from 'next-intl';
import Image from 'next/image';

const DISCORD_URL = "https://discord.gg/aKsgdBrG";

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
        <div className="border border-white/10 rounded-2xl bg-white/5 p-6 mb-12">
          <p className="font-[family-name:var(--font-geist-mono)] text-white/70 text-sm uppercase tracking-wide mb-4">
            On this page
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-[family-name:var(--font-geist-mono)]">
            {[
              { label: "Independence", href: "#independence" },
              { label: "What is AI.SEA", href: "#what-is-aisea" },
              { label: "Authority", href: "#authority" },
              { label: "Autonomy", href: "#autonomy" },
              { label: "Value Flow", href: "#value-flow" },
              { label: "Cross-Border", href: "#cross-border" },
              { label: "Continuity", href: "#continuity" },
              { label: "Accountability", href: "#accountability" },
              { label: "Contribution", href: "#contribution" },
              { label: "Commitment", href: "#commitment" },
            ].map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="rounded-full border border-white/20 px-4 py-2 text-white/80 hover:text-white hover:border-white/40 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>
        </div>

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

          <h2 id="independence" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.independence.title')}</h2>

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

          <h2 id="what-is-aisea" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.whatAISEA.title')}</h2>

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

          <h2 id="authority" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.authority.title')}</h2>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.authority.paragraph1')}
          </p>

          <p className="text-white/90 text-lg leading-relaxed">
            {t('sections.authority.paragraph2')}
          </p>

          <hr className="border-white/20 my-12" />

          <h2 id="autonomy" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.autonomy.title')}</h2>

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

          <h2 id="value-flow" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.valueFlow.title')}</h2>

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

          <h2 id="cross-border" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.crossBorder.title')}</h2>

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

          <h2 id="continuity" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.continuity.title')}</h2>

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

          <h2 id="accountability" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.accountability.title')}</h2>

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

          <h2 id="contribution" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.contribution.title')}</h2>

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

          <h2 id="commitment" className="text-3xl md:text-4xl font-semibold text-white mt-12 mb-6">{t('sections.commitment.title')}</h2>

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

        {/* Discord Link Section */}
        <div className="mt-16 pt-12 border-t border-white/20 flex flex-col items-center gap-4">
          <p className="text-white/70 text-sm font-[family-name:var(--font-geist-mono)]">
            Join the movement
          </p>
          <a
            href={DISCORD_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-3 text-white/80 hover:text-white transition-colors duration-200 group"
            aria-label="Join Discord"
          >
            <Image
              src="/assets/icons/Discord-Symbol-Blurple.svg"
              alt="Discord"
              width={40}
              height={40}
              className="w-10 h-10 group-hover:opacity-90 transition-opacity"
            />
            <span className="font-[family-name:var(--font-geist-mono)] text-lg">
              Join us on Discord
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}
