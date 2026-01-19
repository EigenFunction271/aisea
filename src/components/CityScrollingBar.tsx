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

  // Memoize set width calculation
  const setWidth = useMemo(() => {
    const itemWidth = 200; // Width per city item (flag + text)
    const baseGap = 32;
    return (itemWidth + baseGap) * cities.length;
  }, [cities.length]);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let position = 0;
    const speed = direction === "right" ? -scrollSpeed : scrollSpeed;

    const animate = () => {
      position += speed;
      
      if (direction === "left") {
        if (position >= setWidth) {
          position = position % setWidth;
        }
      } else if (direction === "right") {
        if (position <= -setWidth) {
          position = position % setWidth;
        }
      }
      
      scrollContainer.style.transform = `translateX(${position}px)`;
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scrollSpeed, direction, setWidth]);

  // Duplicate cities for seamless infinite scroll
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
