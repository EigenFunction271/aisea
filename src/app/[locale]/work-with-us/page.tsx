"use client";

import { Navbar1 } from "@/components/ui/navbar";
import { Button } from "@/components/ui/button";
import { Mail } from "lucide-react";
import { useTranslations } from 'next-intl';

export default function WorkWithUsPage() {
  const t = useTranslations('workWithUs');
  
  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar1 />
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-5xl md:text-6xl font-bold mb-4 font-[family-name:var(--font-perfectly-nineties)]">
          {t('title')}
        </h1>
        <p className="text-white/90 text-lg leading-relaxed mb-12 font-[family-name:var(--font-geist-mono)]">
          {t('intro')}
        </p>

        <div className="space-y-12 font-[family-name:var(--font-geist-mono)]">
          {/* Tool or Platform Section */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {t('toolPlatform.title')}
            </h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              {t('toolPlatform.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
              {(t.raw('toolPlatform.benefits') as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Company or Operator Section */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {t('companyOperator.title')}
            </h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              {t('companyOperator.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
              {(t.raw('companyOperator.forms') as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          {/* Fund or Ecosystem Partner Section */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {t('fundEcosystem.title')}
            </h2>
            <p className="text-white/90 text-lg leading-relaxed mb-4">
              {t('fundEcosystem.description')}
            </p>
            <ul className="list-disc list-inside space-y-2 text-white/90 text-lg leading-relaxed ml-4">
              {(t.raw('fundEcosystem.includes') as string[]).map((item: string, index: number) => (
                <li key={index}>{item}</li>
              ))}
            </ul>
          </div>

          <hr className="border-white/20 my-12" />

          {/* How we work Section */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {t('howWeWork.title')}
            </h2>
            <p className="text-white/90 text-lg leading-relaxed">
              {t('howWeWork.description')}
            </p>
          </div>

          <hr className="border-white/20 my-12" />

          {/* Get in touch Section */}
          <div>
            <h2 className="text-2xl md:text-3xl font-semibold text-white mb-4">
              {t('getInTouch.title')}
            </h2>
            <p className="text-white/90 text-lg leading-relaxed mb-8">
              {t('getInTouch.description')}
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Button
                asChild
                size="lg"
                className="font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90 font-medium rounded-full"
              >
                <a
                  href={t('getInTouch.contactUrl')}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {t('getInTouch.buttonText')}
                </a>
              </Button>
              <a
                href={t('getInTouch.emailLink')}
                className="inline-flex items-center justify-center text-white/70 hover:text-white transition-colors duration-200"
                aria-label={t('getInTouch.emailLabel')}
                title={t('getInTouch.emailLabel')}
              >
                <Mail className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
