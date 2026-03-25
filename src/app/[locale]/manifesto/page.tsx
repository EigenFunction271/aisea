import type { Metadata } from "next";

import ManifestoClient from "./page.client";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Manifesto — AI.SEA Builder Community",
    description:
      "Read the AI.SEA manifesto: why Southeast Asia's grassroots builder movement exists, how it runs, and what it stands for.",
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
