"use client";

import { useRef, useEffect, useState } from "react";

const logos = [
  { name: "11labs", src: "/assets/logos/11labs.png" },
  { name: "Anthropic", src: "/assets/logos/anthropic.png" },
  { name: "Apify", src: "/assets/logos/apify.svg" },
  { name: "CodeRabbit", src: "/assets/logos/coderabbit.svg" },
  { name: "Cursor", src: "/assets/logos/cursor.webp" },
  { name: "Groq", src: "/assets/logos/groq.svg" },
  { name: "Manus", src: "/assets/logos/Manus_logo.svg.png" },
  { name: "Mobbin", src: "/assets/logos/mobbin.png" },
  { name: "OpenAI", src: "/assets/logos/openai.png" },
  { name: "Sunway", src: "/assets/logos/Sunway_logo.png" },
];

interface LogoScrollingBarProps {
  scrollSpeed?: number;
  direction?: "left" | "right";
  showTitle?: boolean;
}

export function LogoScrollingBar({ 
  scrollSpeed = 1.5, 
  direction = "left",
  showTitle = true 
}: LogoScrollingBarProps = {}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [translateX, setTranslateX] = useState(0);

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let position = 0;
    // For left scroll: positive translateX moves container right, content appears to scroll left
    // For right scroll: negative translateX moves container left, content appears to scroll right
    const speed = direction === "right" ? -scrollSpeed : scrollSpeed;

    const animate = () => {
      // Calculate the width of one set of logos
      // Logo width (120px) + gap (32px for gap-8) = 152px per logo
      const logoWidth = 120;
      const baseGap = 32; // gap-8 = 2rem = 32px
      const setWidth = (logoWidth + baseGap) * logos.length;
      
      position += speed;
      
      // Seamlessly loop - reset position when it completes one set
      // Since we have duplicate logos, resetting creates infinite scroll illusion
      if (direction === "left") {
        // Left scroll: position increases (positive)
        // Reset by subtracting setWidth when >= setWidth
        // This creates seamless loop because duplicate logos are identical
        while (position >= setWidth) {
          position -= setWidth;
        }
      } else if (direction === "right") {
        // Right scroll: position decreases (negative)
        // Reset by adding setWidth when <= -setWidth
        // This creates seamless loop because duplicate logos are identical
        while (position <= -setWidth) {
          position += setWidth;
        }
      }
      
      setTranslateX(position);
      animationId = requestAnimationFrame(animate);
    };

    // Start animation immediately
    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [scrollSpeed, direction]);

  // Duplicate logos many times to ensure seamless infinite scroll
  // Need enough duplicates to cover viewport width + extra for seamless looping
  const duplicatedLogos = [...logos, ...logos, ...logos, ...logos, ...logos, ...logos];

  return (
    <section className="relative z-10 w-full bg-black py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10 lg:px-16">
        {showTitle && (
          <h2 className="mb-8 text-center font-[family-name:var(--font-perfectly-nineties)] text-3xl md:text-4xl lg:text-5xl font-bold text-white">
            Who we've worked with
          </h2>
        )}
        
        <div className="relative overflow-hidden w-full">
          <div
            ref={scrollRef}
            className="flex gap-8 md:gap-12 lg:gap-16"
            style={{
              transform: `translateX(${translateX}px)`,
              willChange: "transform",
              width: "max-content",
            }}
          >
            {duplicatedLogos.map((logo, index) => (
              <div
                key={`${logo.name}-${index}`}
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: "120px",
                  height: "60px",
                }}
              >
                <img
                  src={logo.src}
                  alt={logo.name}
                  className="h-full w-full object-contain opacity-70 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0"
                  onError={(e) => {
                    const target = e.currentTarget;
                    target.onerror = null;
                    target.src = "/placeholder.svg";
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
