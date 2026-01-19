"use client";

import { useRef, useEffect, useMemo } from "react";
import Image from "next/image";

interface City {
  name: string;
  flag: string;
}

interface CityScrollingBarProps {
  cities: City[];
  scrollSpeed?: number;
  direction?: "left" | "right";
}

export function CityScrollingBar({ 
  cities,
  scrollSpeed = 0.5, // Slower than logo bar
  direction = "left"
}: CityScrollingBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Memoize set width calculation to avoid recalculation
  // Following the same pattern as LogoScrollingBar
  const setWidth = useMemo(() => {
    const itemWidth = 150; // Approximate width per city item (flag + text + padding)
    const baseGap = 32; // gap-8 = 2rem = 32px
    return (itemWidth + baseGap) * cities.length;
  }, [cities.length]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let position = 0;
    // For left scroll: positive translateX moves container right, content appears to scroll left
    // For right scroll: negative translateX moves container left, content appears to scroll right
    const speed = direction === "right" ? -scrollSpeed : scrollSpeed;

    const animate = () => {
      position += speed;
      
      // Seamlessly loop - reset position when it completes one set
      // Since we have duplicate cities, resetting creates infinite scroll illusion
      if (direction === "left") {
        // Left scroll: position increases (positive)
        // Reset by subtracting setWidth when >= setWidth
        // This creates seamless loop because duplicate cities are identical
        if (position >= setWidth) {
          position = position % setWidth;
        }
      } else if (direction === "right") {
        // Right scroll: position decreases (negative)
        // Reset by adding setWidth when <= -setWidth
        // This creates seamless loop because duplicate cities are identical
        if (position <= -setWidth) {
          position = position % setWidth;
        }
      }
      
      // Direct DOM manipulation to avoid React re-renders on every frame
      // This significantly improves performance by bypassing React's reconciliation
      scrollContainer.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scrollSpeed, direction, setWidth]);

  // Memoize duplicated cities to avoid recreation on every render
  // Duplicate cities many times to ensure seamless infinite scroll
  // Need enough duplicates to cover viewport width + extra for seamless looping
  const duplicatedCities = useMemo(
    () => [...cities, ...cities, ...cities, ...cities, ...cities, ...cities],
    [cities]
  );

  return (
    <div className="relative w-full bg-black/50 backdrop-blur-sm border-t border-white/10 py-4">
      <div className="relative overflow-hidden w-full">
        <div
          ref={scrollRef}
          className="flex gap-8 items-center"
          style={{
            willChange: "transform",
            width: "max-content",
          }}
        >
          {duplicatedCities.map((city, index) => (
            <div
              key={`${city.name}-${index}`}
              className="flex shrink-0 items-center gap-3 px-4"
            >
              <div className="relative w-6 h-6 flex-shrink-0">
                <Image
                  src={city.flag}
                  alt={`${city.name} flag`}
                  fill
                  className="object-contain rounded-sm"
                  sizes="24px"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                />
              </div>
              <span className="text-white/80 text-sm font-medium font-[family-name:var(--font-geist-mono)] whitespace-nowrap">
                {city.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
