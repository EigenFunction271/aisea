"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { useRef } from "react";
import Image from "next/image";

export function WhatIsAISEA() {
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
  return (
    <section className="py-32 px-4 bg-black min-h-screen">
      <div className="max-w-6xl mx-auto" ref={heroRef}>
        <div className="flex flex-col lg:flex-row items-start gap-8">
          {/* Content */}
          <div className="flex-1">
            <TimelineContent
              as="h2"
              animationNum={0}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={revealVariants}
              className="sm:text-4xl text-2xl md:text-5xl !leading-[110%] font-semibold text-white mb-8"
            >
              What is AI.SEA
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={1}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed mb-6"
            >
              AI.SEA is a builder network for people actually shipping AI in Southeast Asia.
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={2}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed mb-6"
            >
              It's a coalition of local communities, operators, and engineers focused on one thing: building and deploying real AI systems under real constraints.
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={3}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed mb-6"
            >
              We bring together builders from across SEA to co-build, test ideas in the open, and learn by doing. That includes hackathons, co-build sessions, sprints, and collaborations with serious tools and teams.
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={4}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed"
            >
              AI.SEA exists because we need shared infrastructure, tighter feedback loops, and a way for capable builders to find each other and move faster, together.
            </TimelineContent>
          </div>

          {/* Image */}
          <div className="flex-1 hidden lg:block">
            <TimelineContent
              as="div"
              animationNum={5}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="relative w-full h-full min-h-[400px]"
            >
              <Image
                src="/assets/images_general/collage.png"
                alt="AI.SEA Collage"
                fill
                className="object-contain rounded-lg"
              />
            </TimelineContent>
          </div>
        </div>
      </div>
    </section>
  );
}
