import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { seededCities } from "@/lib/seo/seeded-cities";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const { locale } = params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) return {};

  return {
    title: "Cities — AI.SEA Builder Communities",
    description:
      "Explore AI.SEA builder communities across Southeast Asia, and find a city to co-build with.",
  };
}

export default function CitiesIndexPage({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();
  const localePrefix = locale === "en" ? "" : `/${locale}`;

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-perfectly-nineties)] mb-6">
          Cities
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-10 font-[family-name:var(--font-geist-mono)]">
          Explore AI.SEA builder communities across Southeast Asia.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {seededCities.map((city) => (
            <a
              key={city.slug}
              href={`${localePrefix}/cities/${city.slug}`}
              className="block border border-white/10 bg-white/5 rounded-lg p-5 hover:border-white/20 transition-colors"
            >
              <div className="text-xl font-semibold mb-1">{city.name}</div>
              <div className="text-white/70 text-sm mb-3">{city.country}</div>
              <div className="text-white/85 text-sm leading-relaxed">{city.summary}</div>
            </a>
          ))}
        </div>
      </div>
    </main>
  );
}

