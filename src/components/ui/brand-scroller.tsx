"use client";
 
import Image from "next/image";

const logos = [
  { src: "/assets/logos/11labs.png", name: "11Labs" },
  { src: "/assets/logos/anthropic.png", name: "Anthropic" },
  { src: "/assets/logos/apify.svg", name: "Apify" },
  { src: "/assets/logos/coderabbit.svg", name: "CodeRabbit" },
  { src: "/assets/logos/cursor.webp", name: "Cursor" },
  { src: "/assets/logos/groq.svg", name: "Groq" },
  { src: "/assets/logos/Manus_logo.svg.png", name: "Manus" },
  { src: "/assets/logos/mobbin.png", name: "Mobbin" },
  { src: "/assets/logos/openai.png", name: "OpenAI" },
  { src: "/assets/logos/Sunway_logo.png", name: "Sunway" },
];
 
export const BrandScroller = () => {
  return (
    <>
       <div className="group flex overflow-hidden py-2 [--gap:2rem] [gap:var(--gap)] flex-row max-w-full [--duration:40s] [mask-image:linear-gradient(to_right,_rgba(0,_0,_0,_0),rgba(0,_0,_0,_1)_10%,rgba(0,_0,_0,_1)_90%,rgba(0,_0,_0,_0))]">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee flex-row"
              key={i}
            >
              {logos.map((logo, idx) => (
                <div key={`${i}-${idx}`} className="flex items-center gap-3 px-4">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={32}
                    height={32}
                    className="object-contain h-8 w-auto"
                  />
                  <p className="text-lg font-semibold opacity-80 whitespace-nowrap">{logo.name}</p>
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};
 
export const BrandScrollerReverse = () => {
  return (
    <>
       <div className="group flex overflow-hidden py-2 [--gap:2rem] [gap:var(--gap)] flex-row max-w-full [--duration:40s] [mask-image:linear-gradient(to_right,_rgba(0,_0,_0,_0),rgba(0,_0,_0,_1)_10%,rgba(0,_0,_0,_1)_90%,rgba(0,_0,_0,_0))]">
        {Array(4)
          .fill(0)
          .map((_, i) => (
            <div
              className="flex shrink-0 justify-around [gap:var(--gap)] animate-marquee-reverse flex-row"
              key={i}
            >
              {logos.map((logo, idx) => (
                <div key={`${i}-${idx}`} className="flex items-center gap-3 px-4">
                  <Image
                    src={logo.src}
                    alt={logo.name}
                    width={32}
                    height={32}
                    className="object-contain h-8 w-auto"
                  />
                  <p className="text-lg font-semibold opacity-80 whitespace-nowrap">{logo.name}</p>
                </div>
              ))}
            </div>
          ))}
      </div>
    </>
  );
};
