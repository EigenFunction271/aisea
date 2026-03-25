import type { Metadata } from "next";

import EventsClient from "./page.client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Events — AI.SEA Builder Meetups & Hackathons",
    description:
      "Browse upcoming and past AI.SEA events across Southeast Asia — hackathons, builder meetups, co-build sessions, and more in KL, Jakarta, Manila, HCMC, Bangkok and beyond.",
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
