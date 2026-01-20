"use client";

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export interface SlideData {
  title: string;
  description: string | React.ReactNode;
  image: string;
  bgColor: string;
  textColor: string;
  features?: string[];
}

interface ScrollingFeatureShowcaseProps {
  slidesData: SlideData[];
  buttonText?: string;
  buttonHref?: string;
  showButton?: boolean;
  sectionTitle?: string;
}

// --- Main App Component ---
export function ScrollingFeatureShowcase({
  slidesData,
  buttonText = "Get Started",
  buttonHref = "#get-started",
  showButton = true,
  sectionTitle,
}: ScrollingFeatureShowcaseProps) {
  // State to track the currently active slide index
  const [activeIndex, setActiveIndex] = useState(0);
  // Ref to the main scrollable container
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  // Ref to the sticky content panel
  const stickyPanelRef = useRef<HTMLDivElement>(null);

  // --- Scroll Handler ---
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container || slidesData.length === 0) return;

    const handleScroll = () => {
      const scrollableHeight = container.scrollHeight - window.innerHeight;
      const stepHeight = scrollableHeight / slidesData.length;
      const newActiveIndex = Math.min(
        slidesData.length - 1,
        Math.max(0, Math.floor(container.scrollTop / stepHeight))
      );
      setActiveIndex(newActiveIndex);
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [slidesData.length]);
  
  // Safety check for slidesData
  if (!slidesData || slidesData.length === 0) {
    return null;
  }

  // Ensure activeIndex is within bounds
  const safeActiveIndex = Math.min(Math.max(0, activeIndex), slidesData.length - 1);
  const currentSlide = slidesData[safeActiveIndex];
  
  // Dynamic styles for the background and text color transitions
  const dynamicStyles: React.CSSProperties = {
    backgroundColor: currentSlide?.bgColor || '#000000',
    color: currentSlide?.textColor || '#ffffff',
    transition: 'background-color 0.7s ease, color 0.7s ease',
  };

  // Styles for the grid pattern on the right side
  const gridPatternStyle: React.CSSProperties = {
    '--grid-color': 'rgba(0, 0, 0, 0.12)',
    backgroundImage: `
      linear-gradient(to right, var(--grid-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--grid-color) 1px, transparent 1px)
    `,
    backgroundSize: '3.5rem 3.5rem',
  } as React.CSSProperties;

  return (
    <div 
      ref={scrollContainerRef}
      className="h-screen w-full overflow-y-auto hide-scrollbar"
    >
      <div style={{ height: `${slidesData.length * 100}vh` }}>
        <div ref={stickyPanelRef} className="sticky top-0 h-screen w-full flex flex-col items-center justify-center" style={dynamicStyles}>
          <div className="grid grid-cols-1 md:grid-cols-2 h-full w-full max-w-7xl mx-auto">
            
            {/* Left Column: Text Content, Pagination & Button */}
            <div className="relative flex flex-col justify-center p-8 md:p-16 border-r border-white/10">
              {/* Section Title */}
              {sectionTitle && (
                <div className="absolute top-16 left-16 right-16">
                  <h1 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl md:text-5xl lg:text-6xl font-bold leading-none text-white">
                    {sectionTitle}
                  </h1>
                </div>
              )}
              
              {/* Pagination Bars */}
              <div className={`absolute ${sectionTitle ? 'top-32 md:top-36' : 'top-16'} left-16 flex space-x-2`}>
                {slidesData.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                        const container = scrollContainerRef.current;
                        if(container){
                            const scrollableHeight = container.scrollHeight - window.innerHeight;
                            const stepHeight = scrollableHeight / slidesData.length;
                            container.scrollTo({ top: stepHeight * index, behavior: 'smooth' });
                        }
                    }}
                    className={`h-1 rounded-full transition-all duration-500 ease-in-out ${
                      index === safeActiveIndex ? 'w-12 bg-white/80' : 'w-6 bg-white/20'
                    }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>
              
              <div className="relative h-64 w-full">
                {slidesData.map((slide, index) => (
                  <div
                    key={index}
                    className={`absolute inset-0 transition-all duration-700 ease-in-out ${
                      index === safeActiveIndex
                        ? 'opacity-100 translate-y-0'
                        : 'opacity-0 translate-y-10'
                    }`}
                  >
                    <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-5xl md:text-6xl font-bold tracking-tighter text-white">{slide.title}</h2>
                    {typeof slide.description === 'string' ? (
                      <p className="mt-6 text-lg md:text-xl max-w-md text-white/80">{slide.description}</p>
                    ) : (
                      <div className="mt-6 text-lg md:text-xl max-w-md text-white/80">{slide.description}</div>
                    )}
                    {slide.features && slide.features.length > 0 && (
                      <ul className="mt-6 space-y-3 max-w-md">
                        {slide.features.map((feature, idx) => (
                          <li key={idx} className="flex items-start text-white/80">
                            <span className="mr-3 mt-1">•</span>
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>

              {/* Get Started Button */}
              {showButton && (
                <div className="absolute bottom-16 left-16">
                  <a
                    href={buttonHref}
                    className="px-10 py-4 bg-black text-white font-semibold rounded-full uppercase tracking-wider hover:bg-gray-800 transition-colors"
                  >
                    {buttonText}
                  </a>
                </div>
              )}
            </div>

            {/* Right Column: Image Content with Grid Background */}
            <div className="hidden md:flex items-center justify-center p-8">
              <div className="relative w-[75%] h-[80vh] rounded-2xl overflow-hidden shadow-2xl border-4 border-white/10">
                <div 
                  className="absolute top-0 left-0 w-full h-full transition-transform duration-700 ease-in-out"
                  style={{ transform: `translateY(-${safeActiveIndex * 100}%)` }}
                >
                  {slidesData.map((slide, index) => (
                    <div key={index} className="relative w-full h-full">
                      <Image
                        src={slide.image}
                        alt={slide.title}
                        fill
                        className="object-cover"
                        sizes="75vw"
                        loading={index === 0 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
