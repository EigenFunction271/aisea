import type { Metadata } from "next";

import { getHrefLangAlternates } from "@/lib/seo/hreflang";
import ResidencyClient from "./page.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { canonical, languages } = getHrefLangAlternates({
    locale,
    path: "/residency",
  });
  return {
    title: "AI.SEA Residency — 3-Month Builder Program in Southeast Asia",
    description:
      "The AI.SEA Residency is a 3-month selective program for exceptional builders in Southeast Asia. No pitches, no demo days — just serious builders doing serious work.",
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: "AI.SEA Residency — 3-Month Builder Program in Southeast Asia",
      description:
        "A 3-month selective program for exceptional builders in Southeast Asia. No pitches, no demo days — just serious builders doing serious work.",
    },
    twitter: {
      title: "AI.SEA Residency — 3-Month Builder Program in Southeast Asia",
      description:
        "A 3-month selective program for exceptional builders in Southeast Asia. No pitches, no demo days — just serious builders doing serious work.",
    },
  };
}

export default function ResidencyPage() {
  return <ResidencyClient />;
}
