"use client";

import { useTranslations } from 'next-intl';
import type { Metadata } from 'next';

import { BlurFade } from "@/components/ui/blur-fade";

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://aisea.builders';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const url = locale === 'en' ? `${baseUrl}/residency` : `${baseUrl}/${locale}/residency`;
  
  return {
    title: 'AI.SEA Residency | AISEA',
    description: 'Join the AI.SEA Residency program for builders who already ship. A focused environment for building at full capacity with no distractions.',
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: 'AI.SEA Residency | AISEA',
      description: 'Join the AI.SEA Residency program for builders who already ship.',
      url,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title: 'AI.SEA Residency | AISEA',
      description: 'Join the AI.SEA Residency program for builders who already ship.',
    },
  };
}
import { Navbar1 } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import {
  Stepper,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperNav,
  StepperPanel,
  StepperSeparator,
  StepperTrigger,
} from "@/components/ui/stepper";
import dynamic from 'next/dynamic';
import Image from "next/image";

// Lazy load shader background to reduce initial bundle size
const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground').then(mod => ({ default: mod.ShaderBackground })),
  {
    ssr: false,
    loading: () => <div className="bg-black absolute inset-0 -z-10 w-full h-full pointer-events-none" aria-hidden />
  }
);

// Helper function to parse markdown-style bold (**text**) and render as bold
function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <span key={index}>{part}</span>;
  });
}


export default function ResidencyPage() {
  const t = useTranslations('residency');
  
  return (
    <div className="w-full min-h-screen">
      {/* Navbar */}
      <Navbar1 />
      
      {/* Hero Section */}
      <section className="fixed inset-0 w-screen h-screen bg-black z-10 pointer-events-none">
        <ShaderBackground />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center space-y-4 px-4 pointer-events-auto z-10">
          <BlurFade delay={0} duration={0.8} yOffset={20}>
            <h1 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-none text-white">
              {t('hero.title')}
            </h1>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="font-[family-name:var(--font-geist-mono)] text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              {t('hero.subheading')}
            </p>
          </BlurFade>
        </div>
      </section>

      {/* Spacer to allow scrolling past hero */}
      <div className="relative z-0 h-screen pointer-events-none" />

      {/* Three Months Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-12">
            <div className="flex-1 space-y-6 order-2 lg:order-1">
              <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
                {t('threeMonths.title')}
              </h2>
              <div className="space-y-6 font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
                <p>{t('threeMonths.paragraph1')}</p>
                <p>{t('threeMonths.paragraph2')}</p>
                <p>{t('threeMonths.paragraph3')}</p>
                <p>{t('threeMonths.paragraph4')}</p>
              </div>
            </div>
            <div className="flex-1 w-full lg:w-auto order-1 lg:order-2">
              <div className="relative w-full aspect-[4/3] lg:max-w-md rounded-lg overflow-hidden">
                <Image
                  src="/assets/images_general/res1.png"
                  alt="AI.SEA Residency"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who It's For Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-8">
            {t('whoItsFor.title')}
          </h2>
          <div className="space-y-6 font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
            <p>{t('whoItsFor.intro')}</p>
            <p>{t('whoItsFor.ifYou')}</p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              {(t.raw('whoItsFor.bullets') as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p>{parseBoldText(t('whoItsFor.lookingFor'))}</p>
          </div>
        </div>
      </section>

      {/* Who It's Not For Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-8">
            {t('whoItsNotFor.title')}
          </h2>
          <div className="space-y-6 font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
            <p>{t('whoItsNotFor.intro')}</p>
            <ul className="list-disc list-inside space-y-3 ml-4">
              {(t.raw('whoItsNotFor.bullets') as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
            <p>{t('whoItsNotFor.conclusion')}</p>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-12 text-center">
            {t('howItWorks.title')}
          </h2>
          <Stepper defaultValue={1} className="space-y-8">
            <StepperNav>
              {[1, 2, 3, 4, 5].map((step) => (
                <StepperItem key={step} step={step}>
                  <StepperTrigger>
                    <StepperIndicator className="data-[state=completed]:bg-yellow-500 data-[state=completed]:text-black data-[state=active]:bg-yellow-500 data-[state=active]:text-black data-[state=inactive]:bg-white/20 data-[state=inactive]:text-white/60 border-white/20">
                      {step}
                    </StepperIndicator>
                  </StepperTrigger>
                  {5 > step && <StepperSeparator className="group-data-[state=completed]/step:bg-yellow-500 group-data-[state=active]/step:bg-yellow-500/50" />}
                </StepperItem>
              ))}
            </StepperNav>

            <StepperPanel className="text-center">
              {[1, 2, 3, 4, 5].map((step) => (
                <StepperContent key={step} value={step}>
                  <div className="max-w-3xl mx-auto">
                    <h3 className="font-[family-name:var(--font-perfectly-nineties)] text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4">
                      {t(`howItWorks.step${step}.title`)}
                    </h3>
                    <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
                      {t(`howItWorks.step${step}.description`)}
                    </p>
                  </div>
                </StepperContent>
              ))}
            </StepperPanel>
          </Stepper>
        </div>
      </section>

      {/* Apply Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center">
            <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-8">
              {t('apply.title')}
            </h2>
            <Button
              asChild
              size="lg"
              className="font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90 font-medium rounded-full text-sm md:text-base mt-6"
            >
              <a
                href="https://airtable.com/appBgmnpu1bJljnxX/pagEZn6n60tDty3lP/form"
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('apply.button')}
              </a>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
