import type { Metadata } from "next";

import { getHrefLangAlternates } from "@/lib/seo/hreflang";
import LocaleHomeClient from "./page.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  // Keep this stable across locales until we wire translated meta strings.
  const { locale } = await params;
  const { canonical, languages } = getHrefLangAlternates({ locale, path: "" });
  return {
    title: "AI.SEA — Southeast Asia's Largest AI Builder Community",
    description:
      "AI.SEA is Southeast Asia's largest grassroots AI builder network — 10,000+ builders across KL, Jakarta, Manila, HCMC, Bangkok and beyond. Join us.",
    alternates: {
      canonical,
      languages,
    },
  };
}

export default function LocaleHomePage() {
  return <LocaleHomeClient />;
}
