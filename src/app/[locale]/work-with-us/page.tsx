import type { Metadata } from "next";

import { getHrefLangAlternates } from "@/lib/seo/hreflang";
import WorkWithUsClient from "./page.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { canonical, languages } = getHrefLangAlternates({
    locale,
    path: "/work-with-us",
  });
  return {
    title: "Partner with AI.SEA — Reach 10,000+ Builders in Southeast Asia",
    description:
      "Reach 10,000+ active AI builders across Southeast Asia. Bounties, challenges, pilot builds, and infrastructure partnerships. Trusted by Anthropic, Cursor, ElevenLabs and more.",
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: "Partner with AI.SEA — Reach 10,000+ Builders in Southeast Asia",
      description:
        "Reach 10,000+ active AI builders across Southeast Asia. Bounties, challenges, pilot builds, and infrastructure partnerships.",
    },
    twitter: {
      title: "Partner with AI.SEA — Reach 10,000+ Builders in Southeast Asia",
      description:
        "Reach 10,000+ active AI builders across Southeast Asia. Bounties, challenges, pilot builds, and infrastructure partnerships.",
    },
  };
}

export default function WorkWithUsPage() {
  return <WorkWithUsClient />;
}
