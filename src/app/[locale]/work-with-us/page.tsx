import type { Metadata } from "next";

import WorkWithUsClient from "./page.client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Partner with AI.SEA — Reach 10,000+ Builders in Southeast Asia",
    description:
      "Reach 10,000+ active AI builders across Southeast Asia. Bounties, challenges, pilot builds, and infrastructure partnerships. Trusted by Anthropic, Cursor, ElevenLabs and more.",
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
