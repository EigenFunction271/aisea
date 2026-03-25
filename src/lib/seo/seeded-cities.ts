export type SeededCity = {
  slug: string;
  name: string;
  country: string;
  summary: string;
  exampleNextMeetup: {
    title: string;
    when: string;
  };
  exampleCommunityPartners: string[];
};

// Seeded templates (placeholders) for indexable city pages.
// Supabase-backed data will replace this later.
export const seededCities: SeededCity[] = [
  {
    slug: "kuala-lumpur",
    name: "Kuala Lumpur",
    country: "Malaysia",
    summary:
      "A fast-growing AI builder community in Kuala Lumpur — focused on practical, open co-building sessions and builder-to-builder matching across teams.",
    exampleNextMeetup: { title: "AI Builder Co-Session", when: "Next month (TBD)" },
    exampleCommunityPartners: ["Local builder groups", "AI tools & educators"],
  },
  {
    slug: "jakarta",
    name: "Jakarta",
    country: "Indonesia",
    summary:
      "Jakarta’s builder community runs hands-on sessions for shipping real AI systems. Expect workshops, short sprints, and collaborations across neighborhoods.",
    exampleNextMeetup: { title: "Rapid Build Jam", when: "Next month (TBD)" },
    exampleCommunityPartners: ["Local meetups", "Partner studios"],
  },
  {
    slug: "ho-chi-minh-city",
    name: "Ho Chi Minh City",
    country: "Vietnam",
    summary:
      "Ho Chi Minh City is where builders share practical patterns, test ideas in public, and ship under real constraints with regional feedback loops.",
    exampleNextMeetup: { title: "Builders Review Night", when: "Next month (TBD)" },
    exampleCommunityPartners: ["Community operators", "Mentors"],
  },
  {
    slug: "manila",
    name: "Manila",
    country: "Philippines",
    summary:
      "Manila’s AI builder community helps early teams get from idea to prototype — with repeatable templates for co-builds and mentorship-led feedback.",
    exampleNextMeetup: { title: "Prototype Sprint", when: "Next month (TBD)" },
    exampleCommunityPartners: ["Co-build facilitators", "Regional partners"],
  },
  {
    slug: "singapore",
    name: "Singapore",
    country: "Singapore",
    summary:
      "Singapore builders coordinate across the region to share shipping playbooks, strengthen collaboration, and support practical AI adoption efforts.",
    exampleNextMeetup: { title: "AI Systems Playbook Session", when: "Next month (TBD)" },
    exampleCommunityPartners: ["Partners & operators", "Builder collectives"],
  },
  {
    slug: "bangkok",
    name: "Bangkok",
    country: "Thailand",
    summary:
      "Bangkok’s builder community emphasizes open practice: short sprints, feedback loops, and collaborations that turn ideas into real builds.",
    exampleNextMeetup: { title: "Builders Co-Design Sprint", when: "Next month (TBD)" },
    exampleCommunityPartners: ["Community leaders", "Tooling partners"],
  },
];

