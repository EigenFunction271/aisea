"use client";

import { useTranslations } from 'next-intl';

import { BlurFade } from "@/components/ui/blur-fade";
import { Button } from "@/components/ui/button";
import { TextShimmer } from "@/components/ui/text-shimmer";
import { Calendar } from "lucide-react";
import Image from "next/image";
import { WhatIsAISEA } from "@/components/WhatIsAISEA";
import { WhatAISeaDoes } from "@/components/WhatAISeaDoes";
import { HowItWorks } from "@/components/HowItWorks";
import { LogoScrollingBar } from "@/components/LogoScrollingBar";
import { CityScrollingBar } from "@/components/CityScrollingBar";
import { Navbar1 } from "@/components/ui/navbar";
import dynamic from 'next/dynamic';
import { Link } from '@/i18n/routing';

const WorldMap = dynamic(
  () => import('@/components/ui/map').then(mod => ({ default: mod.WorldMap })),
  {
    ssr: false,
    loading: () => <div className="w-full h-[400px] bg-black/20 animate-pulse rounded-lg" />
  }
);

// Lazy load shader background to reduce initial bundle size
const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground').then(mod => ({ default: mod.ShaderBackground })),
  {
    ssr: false,
    loading: () => <div className="bg-black absolute inset-0 -z-10 w-full h-full pointer-events-none" aria-hidden />
  }
);

const LUMA_REGISTER_URL = "https://luma.com/ai-sea-week";
const DISCORD_URL = "https://discord.gg/aKsgdBrG";
const INSTAGRAM_URL = "https://www.instagram.com/aisea.builders/";
const LINKEDIN_URL = "https://www.linkedin.com/company/ai-sea-week/";
const X_TWITTER_URL = "https://x.com/AI__SEA";
const YOUTUBE_URL = "https://www.youtube.com/@AISEABUILDERS";
const CALENDAR_URL = "https://luma.com/ai-sea?k=c";

export default function Home() {
  const t = useTranslations();
  return (
    <div className="w-full min-h-screen">
      {/* Navbar */}
      <Navbar1 />
      
      {/* Hero Section */}
      <section className="fixed inset-0 w-screen h-screen bg-black z-10 pointer-events-none">
        <ShaderBackground />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 px-4 pointer-events-auto z-10">
          <BlurFade delay={0} duration={0.8} yOffset={20}>
            <TextShimmer
              as="h1"
              className="font-[family-name:var(--font-perfectly-nineties)] text-7xl sm:text-8xl md:text-9xl lg:text-[10rem] font-bold leading-none [--base-color:#e4e4e7] [--bg:linear-gradient(90deg,#0000_calc(50%-var(--spread)),#60a5fa,#a78bfa,#f472b6,#fbbf24,#ffffff,#0000_calc(50%+var(--spread)))]"
              duration={1}
              spread={20}
              once
              delay={1.75}
            >
              {t('hero.title')}
            </TextShimmer>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="font-[family-name:var(--font-geist-mono)] text-white/80 text-sm sm:text-base leading-relaxed max-w-md mx-auto">
              {t('hero.description')}
            </p>
          </BlurFade>

          <BlurFade delay={0.5}>
            <div className="flex items-center justify-center gap-4 mt-2 relative z-20">
              <Button
                asChild
                size="lg"
                className="font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90 font-medium rounded-full text-sm md:text-base"
              >
                <a
                  href={DISCORD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('hero.joinUs')}
                </a>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="font-[family-name:var(--font-geist-mono)] bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-medium rounded-full text-sm md:text-base"
              >
                <Link href="/work-with-us">
                  {t('hero.workWithUs')}
                </Link>
              </Button>
            </div>
          </BlurFade>

          <BlurFade delay={0.6}>
            <div className="flex items-center justify-center gap-4 mt-6 relative z-20">
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 relative z-20"
                aria-label="Join Discord"
              >
                <Image
                  src="/assets/icons/Discord-Symbol-Blurple.svg"
                  alt="Discord"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                />
              </a>
              <a
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 relative z-20"
                aria-label="Follow on Instagram"
              >
                <Image
                  src="/assets/icons/Instagram_logo.svg"
                  alt="Instagram"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                />
              </a>
              <a
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 relative z-20"
                aria-label="Follow on LinkedIn"
              >
                <Image
                  src="/assets/icons/LinkedIn_logo.svg"
                  alt="LinkedIn"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                />
              </a>
              <a
                href={X_TWITTER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 relative z-20"
                aria-label="Follow on X"
              >
                <Image
                  src="/assets/icons/X_Twitter_logo.svg"
                  alt="X (Twitter)"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                />
              </a>
              <a
                href={YOUTUBE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 relative z-20"
                aria-label="Subscribe on YouTube"
              >
                <Image
                  src="/assets/icons/YouTube_logo.svg"
                  alt="YouTube"
                  width={32}
                  height={32}
                  className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8"
                />
              </a>
              <a
                href={CALENDAR_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200 relative z-20"
                aria-label="View Calendar"
              >
                <Calendar className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </a>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Spacer to allow scrolling past hero */}
      <div className="relative z-0 h-screen pointer-events-none" />

      {/* What is AI.SEA Section */}
      <section className="relative z-20">
        <WhatIsAISEA />
      </section>

      {/* Who we've worked with Section */}
      <div className="relative z-20 bg-black">
        <LogoScrollingBar scrollSpeed={1.0} direction="right" showTitle={true} />
      </div>

      {/* See All Past Events and Work With Us Buttons */}
      <div className="relative z-20 flex justify-center gap-4 py-8 bg-black">
        <Button
          asChild
          variant="outline"
          className="font-[family-name:var(--font-geist-mono)] bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-medium rounded-full"
        >
          <a
            href="https://luma.com/ai-sea?k=c&period=past"
            target="_blank"
            rel="noopener noreferrer"
          >
            {t('seeAllPastEvents')}
          </a>
        </Button>
        <Button
          asChild
          variant="outline"
          className="font-[family-name:var(--font-geist-mono)] bg-transparent border-white/20 text-white hover:bg-white/10 hover:border-white/40 font-medium rounded-full"
        >
          <Link href="/work-with-us">
            {t('nav.workWithUs')}
          </Link>
        </Button>
      </div>

      {/* What AI.SEA Does Section */}
      <section className="relative z-20">
        <WhatAISeaDoes />
      </section>

      {/* How it Works Section */}
      <section className="relative z-20">
        <HowItWorks />
      </section>

      {/* Global Network Section */}
      <section className="relative z-20 py-32 px-4 bg-black">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-semibold text-white mb-4 font-[family-name:var(--font-perfectly-nineties)]">
              {t('globalNetwork.title')}
            </h2>
            <p className="text-lg md:text-xl text-white/80 font-[family-name:var(--font-geist-mono)]">
              {t('globalNetwork.subheading')}
            </p>
          </div>
          <div className="w-full">
            <WorldMap
              dots={[
                {
                  start: { lat: 3.1390, lng: 101.6869, label: undefined },
                  end: { lat: -6.2088, lng: 106.8456, label: undefined },
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: undefined },
                  end: { lat: -6.1783, lng: 106.6319, label: undefined }, // Tangerang
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: undefined },
                  end: { lat: -8.6705, lng: 115.2126, label: undefined },
                },
                {
                  start: { lat: 3.1390, lng: 101.6869, label: undefined },
                  end: { lat: 10.8231, lng: 106.6297, label: undefined },
                },
                {
                  start: { lat: 10.8231, lng: 106.6297, label: undefined },
                  end: { lat: 16.0544, lng: 108.2022, label: undefined }, // Da Nang
                },
                {
                  start: { lat: 10.8231, lng: 106.6297, label: undefined },
                  end: { lat: 21.0285, lng: 105.8542, label: undefined },
                },
                {
                  start: { lat: 3.1390, lng: 101.6869, label: undefined },
                  end: { lat: 35.6762, lng: 139.6503, label: undefined },
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: undefined },
                  end: { lat: -27.4698, lng: 153.0251, label: undefined },
                },
                {
                  start: { lat: 3.1390, lng: 101.6869, label: undefined },
                  end: { lat: 19.0760, lng: 72.8777, label: undefined }, // Mumbai
                },
                {
                  start: { lat: 3.1390, lng: 101.6869, label: undefined },
                  end: { lat: 6.9271, lng: 79.8612, label: undefined }, // Colombo
                },
              ]}
              lineColor="#0ea5e9"
              showLabels={false}
              loop={true}
              animationDuration={2}
            />
          </div>
          {/* City Scrolling Bar */}
          <CityScrollingBar
            cities={[
              { name: "Kuala Lumpur", flag: "/assets/flags/malaysia.png" },
              { name: "Jakarta", flag: "/assets/flags/indonesia.png" },
              { name: "Tangerang", flag: "/assets/flags/indonesia.png" },
              { name: "Bali", flag: "/assets/flags/indonesia.png" },
              { name: "Ho Chi Minh", flag: "/assets/flags/vietnam.png" },
              { name: "Da Nang", flag: "/assets/flags/vietnam.png" },
              { name: "Ha Noi", flag: "/assets/flags/vietnam.png" },
              { name: "Tokyo", flag: "/assets/flags/japan.png" },
              { name: "Brisbane", flag: "/assets/flags/australia.png" },
              { name: "Mumbai", flag: "/assets/flags/india.png" },
              { name: "Colombo", flag: "/assets/flags/sri_lanka.png" },
            ]}
            scrollSpeed={0.5}
            direction="right"
          />
        </div>
      </section>

      {/* Start a Chapter Section */}
      <section className="relative z-20 py-32 px-4 bg-black">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-semibold text-white mb-6 font-[family-name:var(--font-perfectly-nineties)]">
            {t('startChapter.title')}
          </h2>
          <p className="text-lg md:text-xl text-white/80 mb-8 font-[family-name:var(--font-geist-mono)]">
            {t('startChapter.description')}
          </p>
          <Button
            asChild
            size="lg"
            className="font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90 font-medium rounded-full"
          >
            <a
              href="https://airtable.com/appBgmnpu1bJljnxX/pagZqdhFlJmDRLpHT/form"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('startChapter.applyHere')}
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
