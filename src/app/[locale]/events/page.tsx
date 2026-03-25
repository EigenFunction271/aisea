import type { Metadata } from "next";

import { getHrefLangAlternates } from "@/lib/seo/hreflang";
import EventsClient from "./page.client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const { canonical, languages } = getHrefLangAlternates({
    locale,
    path: "/events",
  });
  return {
    title: "Events — AI.SEA Builder Meetups & Hackathons",
    description:
      "Browse upcoming and past AI.SEA events across Southeast Asia — hackathons, builder meetups, co-build sessions, and more in KL, Jakarta, Manila, HCMC, Bangkok and beyond.",
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title: "Events — AI.SEA Builder Meetups & Hackathons",
      description:
        "Upcoming and past AI.SEA events across Southeast Asia — hackathons, builder meetups, and co-build sessions.",
    },
    twitter: {
      title: "Events — AI.SEA Builder Meetups & Hackathons",
      description:
        "Upcoming and past AI.SEA events across Southeast Asia — hackathons, builder meetups, and co-build sessions.",
    },
  };
}

export default function EventsPage() {
  return <EventsClient />;
}
