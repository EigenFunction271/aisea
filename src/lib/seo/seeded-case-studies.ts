export type SeededCaseStudy = {
  slug: string;
  partner: string;
  headline: string;
  stat: string;
  statLabel: string;
  summary: string;
  outcome: string;
  paragraphs: string[];
  imageUrl: string;
  persona: "ai-tooling" | "corporate";
};

// Seeded content for /case-studies and /case-studies/[slug].
// Supabase-backed data can replace this later.
export const seededCaseStudies: SeededCaseStudy[] = [
  {
    slug: "cursor-anthropic",
    partner: "Cursor × Anthropic",
    headline: "~700 senior builders onboarded in Southeast Asia in one day",
    stat: "2,000",
    statLabel: "signups",
    summary:
      "AI.SEA ran one of Malaysia's largest AI hackathons with Cursor and Anthropic. 2,000 signups, ~1,000 in-person, ~70% senior developers and technical founders — all using both tools to build and ship working projects under time pressure.",
    outcome:
      "Public demonstration of how Cursor and Anthropic accelerated development speed, improved iteration quality, and enabled teams to ship more ambitious products within tight timelines.",
    paragraphs: [
      "AI.SEA partnered with Cursor, Anthropic, and ecosystem partners to run one of Malaysia's largest AI hackathons.",
      "The event drew over 2,000 signups, with approximately 1,000 builders attending in person within a single day. Around 70% of participants were senior developers, founders, or technical leads — closely matching the ideal user profile for both Cursor and Anthropic.",
      "Participants actively used Cursor and Anthropic tools throughout the hackathon to build and ship working projects under time pressure. This created immediate hands-on onboarding, not passive exposure.",
      "The top 15 teams received recognition from local VCs and ecosystem partners including AWS.",
    ],
    imageUrl: "/assets/images_slides/cam.avif",
    persona: "ai-tooling",
  },
  {
    slug: "elevenlabs",
    partner: "ElevenLabs",
    headline: "New product feature validated through 150+ builders in 2 hours",
    stat: "150+",
    statLabel: "builders in 2 hrs",
    summary:
      "AI.SEA ran a focused 2-hour sprint with 150+ builders to showcase a new ElevenLabs feature. Every participant had to touch the feature directly. Within two hours, ElevenLabs had hands-on adoption data, clear friction points, and organic public demos.",
    outcome:
      "Within two hours, ElevenLabs achieved hands-on adoption, clear qualitative feedback, and broad public visibility for the new feature — without running a traditional launch campaign.",
    paragraphs: [
      "AI.SEA partnered with ElevenLabs to run a focused 2-hour hackathon designed to showcase a new feature of its voice AI platform.",
      "150+ builders participated in a single, tightly scoped challenge: re-dub an existing short video using ElevenLabs. The constraint forced every participant to touch the feature directly, not just watch a demo.",
      "The competition format encouraged memes and humour, lowering the barrier to participation while still requiring real product usage. Participants were required to publicly demo their outputs on YouTube, creating organic distribution beyond the event itself.",
    ],
    imageUrl: "/assets/images_slides/sas.png",
    persona: "ai-tooling",
  },
  {
    slug: "lovable",
    partner: "Lovable",
    headline: "200+ non-coders reached through targeted hackathon",
    stat: "200+",
    statLabel: "non-coder builders",
    summary:
      "AI.SEA partnered with Lovable to run a hackathon reaching builders outside their usual technical audience — 200+ non-coders including 40–50+ year old business owners and operators already running real businesses.",
    outcome:
      "Strong product lock-in. Participants continued using Lovable beyond the event because it directly replaced slower, more expensive workflows they were already paying for.",
    paragraphs: [
      "AI.SEA partnered with Lovable to run a targeted hackathon designed to reach builders outside their usual technical audience.",
      "Instead of engineers, the event attracted 200+ non-coders, including 40–50+ year old business owners, operators, and solo founders. Many participants were already running real businesses and were actively looking for tools to ship faster without engineering teams.",
      "During the hackathon, Lovable became the primary tool participants used to build landing pages, prototypes, and internal tools for their existing businesses. This was not experimentation for fun — it was applied usage under real commercial constraints.",
    ],
    imageUrl: "/assets/images_slides/bfg.avif",
    persona: "ai-tooling",
  },
];
