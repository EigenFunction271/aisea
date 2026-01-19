"use client";

import { ScrollingFeatureShowcase, type SlideData } from "@/components/ui/interactive-scrolling-story-component";
import { useTranslations } from 'next-intl';

export function WhatAISeaDoes() {
  const t = useTranslations('whatAISeaDoes');
  
  const aiseaSlidesData: SlideData[] = [
    {
      title: t('slide1.title'),
      description: t('slide1.description'),
      image: "/assets/images_slides/1.png",
      bgColor: "#000000",
      textColor: "#ffffff",
      features: (t.raw('slide1.features') as string[]),
    },
    {
      title: t('slide2.title'),
      description: t('slide2.description'),
      image: "/assets/images_slides/2.png",
      bgColor: "#000000",
      textColor: "#ffffff",
      features: (t.raw('slide2.features') as string[]),
    },
    {
      title: t('slide3.title'),
      description: t('slide3.description'),
      image: "/assets/images_slides/3.png",
      bgColor: "#000000",
      textColor: "#ffffff",
      features: (t.raw('slide3.features') as string[]),
    },
  ];

  return (
    <ScrollingFeatureShowcase
      slidesData={aiseaSlidesData}
      showButton={false}
      sectionTitle={t('title')}
    />
  );
}
