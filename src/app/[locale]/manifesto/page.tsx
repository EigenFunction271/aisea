import type { Metadata } from "next";

import { getHrefLangAlternates } from "@/lib/seo/hreflang";
import ManifestoClient from "./page.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { canonical, languages } = getHrefLangAlternates({
    locale,
    path: "/manifesto",
  });
  return {
    title: "Manifesto — AI.SEA Builder Community",
    description:
      "Read the AI.SEA manifesto: why Southeast Asia's grassroots builder movement exists, how it runs, and what it stands for.",
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: "Manifesto — AI.SEA Builder Community",
      description:
        "Why Southeast Asia's grassroots builder movement exists, how it runs, and what it stands for.",
    },
    twitter: {
      title: "Manifesto — AI.SEA Builder Community",
      description:
        "Why Southeast Asia's grassroots builder movement exists, how it runs, and what it stands for.",
    },
  };
}

export default function ManifestoPage() {
  return <ManifestoClient />;
}
