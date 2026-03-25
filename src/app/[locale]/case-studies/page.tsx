import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";

import { seededCaseStudies } from "@/lib/seo/seeded-case-studies";
import { routing } from "@/i18n/routing";
import { getHrefLangAlternates } from "@/lib/seo/hreflang";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) return {};
  return {
    title: "Case Studies — AI.SEA Partner Results",
    description:
      "How AI.SEA helps AI tooling companies and corporates reach 10,000+ builders in Southeast Asia. Real usage, real numbers.",
    alternates: getHrefLangAlternates({ locale, path: "/case-studies" }),
  };
}

export default async function CaseStudiesIndexPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const localePrefix = locale === "en" ? "" : `/${locale}`;

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <a
          href={`${localePrefix}/work-with-us`}
          className="text-white/70 hover:text-white transition-colors text-sm mb-8 inline-block"
        >
          ← Work with us
        </a>

        <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-perfectly-nineties)] mb-4">
          Case Studies
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-12 font-[family-name:var(--font-geist-mono)] max-w-2xl">
          Real engagements. Real usage. Real numbers.
        </p>

        <div className="flex flex-col gap-8">
          {seededCaseStudies.map((cs) => (
            <a
              key={cs.slug}
              href={`${localePrefix}/case-studies/${cs.slug}`}
              className="group block border border-white/10 bg-white/5 rounded-lg overflow-hidden hover:border-white/20 transition-colors"
            >
              <div className="flex flex-col md:flex-row">
                <div className="relative w-full md:w-48 h-40 md:h-auto flex-shrink-0">
                  <Image
                    src={cs.imageUrl}
                    alt={cs.partner}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6 flex flex-col justify-center gap-3">
                  <div className="text-white/50 text-sm font-[family-name:var(--font-geist-mono)] uppercase tracking-widest">
                    {cs.partner}
                  </div>
                  <h2 className="text-xl md:text-2xl font-semibold leading-snug group-hover:text-white/90 transition-colors">
                    {cs.headline}
                  </h2>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-[family-name:var(--font-perfectly-nineties)]">
                      {cs.stat}
                    </span>
                    <span className="text-white/60 text-sm font-[family-name:var(--font-geist-mono)]">
                      {cs.statLabel}
                    </span>
                  </div>
                  <span className="text-white/50 text-sm font-[family-name:var(--font-geist-mono)] group-hover:text-white/70 transition-colors">
                    Read case study →
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}
