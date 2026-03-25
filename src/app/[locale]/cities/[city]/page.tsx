import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { seededCities } from "@/lib/seo/seeded-cities";
import { routing } from "@/i18n/routing";

export function generateStaticParams() {
  return routing.locales.flatMap((locale) =>
    seededCities.map((city) => ({ locale, city: city.slug })),
  );
}

export async function generateMetadata({
  params,
}: {
  params: { locale: string; city: string };
}): Promise<Metadata> {
  const { locale, city } = params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) return {};

  const found = seededCities.find((c) => c.slug === city);
  if (!found) return {};

  return {
    title: `${found.name} — AI.SEA Builder Community`,
    description: found.summary,
  };
}

export default function CityPage({ params }: { params: { locale: string; city: string } }) {
  const { locale, city } = params;
  const isValidLocale = (loc: string): loc is (typeof routing.locales)[number] =>
    routing.locales.includes(loc as (typeof routing.locales)[number]);
  if (!isValidLocale(locale)) notFound();

  const found = seededCities.find((c) => c.slug === city);
  if (!found) notFound();

  const localePrefix = locale === "en" ? "" : `/${locale}`;

  return (
    <main className="w-full min-h-screen bg-black text-white">
      <div className="max-w-5xl mx-auto px-4 py-16">
        <a
          href={`${localePrefix}/cities`}
          className="text-white/70 hover:text-white transition-colors text-sm mb-8 inline-block"
        >
          Back to cities
        </a>

        <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-perfectly-nineties)] mb-6">
          {found.name}
        </h1>
        <p className="text-lg md:text-xl text-white/80 mb-10 font-[family-name:var(--font-geist-mono)]">
          {found.country}
        </p>

        <section className="border border-white/10 bg-white/5 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-3">Community summary</h2>
          <p className="text-white/85 leading-relaxed">{found.summary}</p>
        </section>

        <section className="border border-white/10 bg-white/5 rounded-lg p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-3">Next meetup (example)</h2>
          <p className="text-white/85 leading-relaxed">
            <span className="font-semibold text-white">{found.exampleNextMeetup.title}</span>
            <span className="text-white/70"> — {found.exampleNextMeetup.when}</span>
          </p>
        </section>

        <section className="border border-white/10 bg-white/5 rounded-lg p-6">
          <h2 className="text-2xl font-semibold mb-3">Community partners (example)</h2>
          <ul className="list-disc pl-6 text-white/85 space-y-1">
            {found.exampleCommunityPartners.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}

