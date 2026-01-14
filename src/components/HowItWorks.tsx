"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { useRef } from "react";

export function HowItWorks() {
  const heroRef = useRef<HTMLDivElement>(null);
  const revealVariants = {
    visible: (i: number) => ({
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.2,
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      y: 40,
      opacity: 0,
    },
  };
  const textVariants = {
    visible: (i: number) => ({
      filter: "blur(0px)",
      opacity: 1,
      transition: {
        delay: i * 0.15,
        duration: 0.7,
      },
    }),
    hidden: {
      filter: "blur(10px)",
      opacity: 0,
    },
  };

  const cards = [
    {
      title: "Shared Formats",
      description: "Hackathons, co-build sessions, sprints, and challenges follow common formats. This keeps the bar clear and lets builders move between cities and communities without friction.",
    },
    {
      title: "Build in public",
      description: "Projects and progress is shared across communities. Ideas can be tested without judgement, feedback can be obtained, and partners can be found across multiple countries.",
    },
    {
      title: "Serious Tools & Partners",
      description: "Builders get access to real tooling, credits, and support from teams actually shipping AI.",
    },
  ];

  return (
    <section className="py-32 px-4 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto" ref={heroRef}>
        <TimelineContent
          as="h2"
          animationNum={0}
          timelineRef={heroRef as React.RefObject<HTMLElement | null>}
          customVariants={revealVariants}
          className="sm:text-4xl text-2xl md:text-5xl !leading-[110%] font-semibold text-white mb-8"
        >
          How it works
        </TimelineContent>

        <TimelineContent
          as="p"
          animationNum={1}
          timelineRef={heroRef as React.RefObject<HTMLElement | null>}
          customVariants={textVariants}
          className="text-white/90 text-lg md:text-xl leading-relaxed mb-12 max-w-3xl"
        >
          AI.SEA is made up of local builder groups across Southeast Asia. Sessions are run on the ground by people who build, not event managers. While local communities run sessions, AI.SEA connects them regionally.
        </TimelineContent>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {cards.map((card, index) => (
            <TimelineContent
              key={card.title}
              as="div"
              animationNum={index + 2}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors bg-white/5"
            >
              <h3 className="text-xl font-semibold text-white mb-3">{card.title}</h3>
              <p className="text-white/80 leading-relaxed">{card.description}</p>
            </TimelineContent>
          ))}
        </div>
      </div>
    </section>
  );
}
