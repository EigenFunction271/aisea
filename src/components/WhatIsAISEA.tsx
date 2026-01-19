"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from 'next-intl';

export function WhatIsAISEA() {
  const t = useTranslations('whatIsAISEA');
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
              {t('title')}
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={1}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed mb-6"
            >
              {t('paragraph1')}
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={2}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed mb-6"
            >
              {t('paragraph2')}
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={3}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed mb-6"
            >
              {t('paragraph3')}
            </TimelineContent>

            <TimelineContent
              as="p"
              animationNum={4}
              timelineRef={heroRef as React.RefObject<HTMLElement | null>}
              customVariants={textVariants}
              className="text-white/90 text-lg md:text-xl leading-relaxed"
            >
              {t('paragraph4')}
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
