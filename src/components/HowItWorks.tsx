"use client";
import { TimelineContent } from "@/components/ui/timeline-animation";
import { useRef, useMemo } from "react";
import { useTranslations } from 'next-intl';

export function HowItWorks() {
  const t = useTranslations('howItWorks');
  const heroRef = useRef<HTMLDivElement>(null);
  
  // Memoize animation variants to avoid recreation on every render
  const revealVariants = useMemo(() => ({
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
  }), []);
  
  const textVariants = useMemo(() => ({
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
  }), []);

  // Memoize cards data to avoid recreation on every render
  const cards = useMemo(() => [
    {
      title: t('card1.title'),
      description: t('card1.description'),
    },
    {
      title: t('card2.title'),
      description: t('card2.description'),
    },
    {
      title: t('card3.title'),
      description: t('card3.description'),
    },
  ], [t]);

  return (
    <section className="py-32 px-4 bg-black min-h-[120vh]">
      <div className="max-w-6xl mx-auto" ref={heroRef}>
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
          className="text-white/90 text-lg md:text-xl leading-relaxed mb-12 max-w-3xl"
        >
          {t('intro')}
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
