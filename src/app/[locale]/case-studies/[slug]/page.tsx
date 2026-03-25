import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import {
  seededCaseStudies,
  type SeededCaseStudy,
} from "@/lib/seo/seeded-case-studies";
import { routing } from "@/i18n/routing";
import { getHrefLangAlternates } from "@/lib/seo/hreflang";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    seededCaseStudies.map((cs) => ({ locale, slug: cs.slug }))
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const cs = seededCaseStudies.find((c) => c.slug === slug);
  if (!cs) return {};
  return {
    title: `${cs.partner} × AI.SEA — ${cs.headline}`,
    description: cs.summary,
    alternates: getHrefLangAlternates({
      locale,
      path: `/case-studies/${slug}`,
    }),
  };
}

function CaseStudyJsonLd({ cs }: { cs: SeededCaseStudy }) {
  const data = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: cs.headline,
    description: cs.summary,
    image: `https://aisea.builders${cs.imageUrl}`,
    author: {
      "@type": "Organization",
      name: "AI.SEA",
      url: "https://aisea.builders",
    },
    publisher: {
      "@type": "Organization",
      name: "AI.SEA",
      url: "https://aisea.builders",
    },
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

export default async function CaseStudyDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const cs = seededCaseStudies.find((c) => c.slug === slug);
  if (!cs) notFound();

  const localePrefix = locale === "en" ? "" : `/${locale}`;

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <CaseStudyJsonLd cs={cs} />
      <div className="max-w-3xl mx-auto px-4 py-16">
        <a
          href={`${localePrefix}/case-studies`}
          className="text-white/70 hover:text-white transition-colors text-sm mb-8 inline-block font-[family-name:var(--font-geist-mono)]"
        >
          ← All case studies
        </a>

        <div className="space-y-2 mb-8">
          <p className="text-white/50 text-sm font-[family-name:var(--font-geist-mono)] uppercase tracking-widest">
            {cs.partner}
          </p>
          <h1 className="text-4xl md:text-5xl font-bold font-[family-name:var(--font-perfectly-nineties)] leading-tight">
            {cs.headline}
          </h1>
        </div>

        <div className="relative w-full aspect-[16/9] rounded-lg overflow-hidden mb-10">
          <Image src={cs.imageUrl} alt={cs.partner} fill className="object-cover" priority />
        </div>

        <div className="border border-white/10 bg-white/5 rounded-lg p-6 mb-10 flex items-baseline gap-3">
          <span className="text-5xl font-bold font-[family-name:var(--font-perfectly-nineties)]">
            {cs.stat}
          </span>
          <span className="text-white/60 font-[family-name:var(--font-geist-mono)]">
            {cs.statLabel}
          </span>
        </div>

        <div className="space-y-5 mb-10">
          {cs.paragraphs.map((p, i) => (
            <p
              key={i}
              className="text-white/90 text-base md:text-lg leading-relaxed font-[family-name:var(--font-geist-mono)]"
            >
              {p}
            </p>
          ))}
        </div>

        <div className="border-t border-white/20 pt-8">
          <p className="text-white font-semibold text-base md:text-lg mb-2 font-[family-name:var(--font-geist-mono)]">
            Result
          </p>
          <p className="text-white/90 text-base md:text-lg leading-relaxed font-[family-name:var(--font-geist-mono)]">
            {cs.outcome}
          </p>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <p className="text-white/70 font-[family-name:var(--font-geist-mono)] text-sm">
            Want results like this?
          </p>
          <a
            href="https://airtable.com/appBgmnpu1bJljnxX/pagPGkKttUQAM4nGV/form"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center bg-white text-black hover:bg-white/90 font-medium rounded-full text-sm px-6 py-2.5 font-[family-name:var(--font-geist-mono)] transition-colors"
          >
            Work with us
          </a>
        </div>
      </div>
    </main>
  );
}
