"use client";

import { ScrollingFeatureShowcase, type SlideData } from "@/components/ui/interactive-scrolling-story-component";

const aiseaSlidesData: SlideData[] = [
  {
    title: "Shared infrastructure",
    description: "We pool resources so communities don't have to start from zero:",
    image: "/assets/images_slides/1.jpg",
    bgColor: "#000000",
    textColor: "#ffffff",
    features: [
      "Tool credits & partner access",
      "Event templates & playbooks",
      "Shared comms, branding, and reach",
      "Cross-community speaker & mentor access",
    ],
  },
  {
    title: "Cross-border collaboration",
    description: "AI doesn't stop at borders — neither should builders.",
    image: "/assets/images_slides/2.png",
    bgColor: "#000000",
    textColor: "#ffffff",
    features: [
      "Regional hackathons & sprints",
      "Co-hosted events across countries",
      "Builder matching across communities",
    ],
  },
  {
    title: "Narrative & visibility",
    description: "We help local builders be seen globally:",
    image: "/assets/images_slides/3.JPG",
    bgColor: "#000000",
    textColor: "#ffffff",
    features: [
      "Regional showcases",
      "Media & partner amplification",
      "A shared SEA builder story that compounds over time",
    ],
  },
];

export function WhatAISeaDoes() {
  return (
    <ScrollingFeatureShowcase
      slidesData={aiseaSlidesData}
      showButton={false}
      sectionTitle="What AI.SEA does"
    />
  );
}
