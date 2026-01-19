"use client";

import { useRef, useMemo } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { shaderMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useGSAP } from '@gsap/react';
import gsap from 'gsap';
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

// ===================== SHADER =====================
const vertexShader = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  #ifdef GL_ES
    precision lowp float;
  #endif
  uniform float iTime;
  uniform vec2 iResolution;
  varying vec2 vUv;
  
  vec4 buf[8];
  
  vec4 sigmoid(vec4 x) { return 1. / (1. + exp(-x)); }
  
  vec4 cppn_fn(vec2 coordinate, float in0, float in1, float in2) {
    // layer 1 *********************************************************************
    buf[6] = vec4(coordinate.x, coordinate.y, 0.3948333106474662 + in0, 0.36 + in1);
    buf[7] = vec4(0.14 + in2, sqrt(coordinate.x * coordinate.x + coordinate.y * coordinate.y), 0., 0.);

    // layer 2 ********************************************************************
    buf[0] = mat4(vec4(6.5404263, -3.6126034, 0.7590882, -1.13613), vec4(2.4582713, 3.1660357, 1.2219609, 0.06276096), vec4(-5.478085, -6.159632, 1.8701609, -4.7742867), vec4(6.039214, -5.542865, -0.90925294, 3.251348))
    * buf[6]
    + mat4(vec4(0.8473259, -5.722911, 3.975766, 1.6522468), vec4(-0.24321538, 0.5839259, -1.7661959, -5.350116), vec4(0.0, 0.0, 0.0, 0.0), vec4(0.0, 0.0, 0.0, 0.0))
    * buf[7]
    + vec4(0.21808943, 1.1243913, -1.7969975, 5.0294676);
    
    buf[1] = mat4(vec4(-3.3522482, -6.0612736, 0.55641043, -4.4719114), vec4(0.8631464, 1.7432913, 5.643898, 1.6106541), vec4(2.4941394, -3.5012043, 1.7184316, 6.357333), vec4(3.310376, 8.209261, 1.1355612, -1.165539))
    * buf[6]
    + mat4(vec4(5.24046, -13.034365, 0.009859298, 15.870829), vec4(2.987511, 3.129433, -0.89023495, -1.6822904), vec4(0.0, 0.0, 0.0, 0.0), vec4(0.0, 0.0, 0.0, 0.0))
    * buf[7]
    + vec4(-5.9457836, -6.573602, -0.8812491, 1.5436668);

    buf[0] = sigmoid(buf[0]);
    buf[1] = sigmoid(buf[1]);

    // layer 3 ********************************************************************
    buf[2] = mat4(vec4(-15.219568, 8.095543, -2.429353, -1.9381982), vec4(-5.951362, 4.3115187, 2.6393783, 1.274315), vec4(-7.3145227, 6.7297835, 5.2473326, 5.9411426), vec4(5.0796127, 8.979051, -1.7278991, -1.158976))
    * buf[6]
    + mat4(vec4(-11.967154, -11.608155, 6.1486754, 11.237008), vec4(2.124141, -6.263192, -1.7050359, -0.7021966), vec4(0.0, 0.0, 0.0, 0.0), vec4(0.0, 0.0, 0.0, 0.0))
    * buf[7]
    + vec4(-4.17164, -3.2281182, -4.576417, -3.6401186);
    
    buf[3] = mat4(vec4(3.1832156, -13.738922, 1.879223, 3.233465), vec4(0.64300746, 12.768129, 1.9141049, 0.50990224), vec4(-0.049295485, 4.4807224, 1.4733979, 1.801449), vec4(5.0039253, 13.000481, 3.3991797, -4.5561905))
    * buf[6]
    + mat4(vec4(-0.1285731, 7.720628, -3.1425676, 4.742367), vec4(0.6393625, 3.714393, -0.8108378, -0.39174938), vec4(0.0, 0.0, 0.0, 0.0), vec4(0.0, 0.0, 0.0, 0.0))
    * buf[7]
    + vec4(-1.1811101, -21.621881, 0.7851888, 1.2329718);
    
    buf[2] = sigmoid(buf[2]);
    buf[3] = sigmoid(buf[3]);

    // layer 5 & 6 ****************************************************************
    buf[4] = mat4(vec4(5.214916, -7.183024, 2.7228765, 2.6592617), vec4(-5.601878, -25.3591, 4.067988, 0.4602802), vec4(-10.57759, 24.286327, 21.102104, 37.546658), vec4(4.3024497, -1.9625226, 2.3458803, -1.372816))
    * buf[0]
    + mat4(vec4(-17.6526, -10.507558, 2.2587414, 12.462782), vec4(6.265566, -502.75443, -12.642513, 0.9112289), vec4(-10.983244, 20.741234, -9.701768, -0.7635988), vec4(5.383626, 1.4819539, -4.1911616, -4.8444734))
    * buf[1]
    + mat4(vec4(12.785233, -16.345072, -0.39901125, 1.7955981), vec4(-30.48365, -1.8345358, 1.4542528, -1.1118771), vec4(19.872723, -7.337935, -42.941723, -98.52709), vec4(8.337645, -2.7312303, -2.2927687, -36.142323))
    * buf[2]
    + mat4(vec4(-16.298317, 3.5471997, -0.44300047, -9.444417), vec4(57.5077, -35.609753, 16.163465, -4.1534753), vec4(-0.07470326, -3.8656476, -7.0901804, 3.1523974), vec4(-12.559385, -7.077619, 1.490437, -0.8211543))
    * buf[3]
    + vec4(-7.67914, 15.927437, 1.3207729, -1.6686112);
    
    buf[5] = mat4(vec4(-1.4109162, -0.372762, -3.770383, -21.367174), vec4(-6.2103205, -9.35908, 0.92529047, 8.82561), vec4(11.460242, -22.348068, 13.625772, -18.693201), vec4(-0.3429052, -3.9905605, -2.4626114, -0.45033523))
    * buf[0]
    + mat4(vec4(7.3481627, -4.3661838, -6.3037653, -3.868115), vec4(1.5462853, 6.5488915, 1.9701879, -0.58291394), vec4(6.5858274, -2.2180402, 3.7127688, -1.3730392), vec4(-5.7973905, 10.134961, -2.3395722, -5.965605))
    * buf[1]
    + mat4(vec4(-2.5132585, -6.6685553, -1.4029363, -0.16285264), vec4(-0.37908727, 0.53738135, 4.389061, -1.3024765), vec4(-0.70647055, 2.0111287, -5.1659346, -3.728635), vec4(-13.562562, 10.487719, -0.9173751, -2.6487076))
    * buf[2]
    + mat4(vec4(-8.645013, 6.5546675, -6.3944063, -5.5933375), vec4(-0.57783127, -1.077275, 36.91025, 5.736769), vec4(14.283112, 3.7146652, 7.1452246, -4.5958776), vec4(2.7192075, 3.6021907, -4.366337, -2.3653464))
    * buf[3]
    + vec4(-5.9000807, -4.329569, 1.2427121, 8.59503);

    buf[4] = sigmoid(buf[4]);
    buf[5] = sigmoid(buf[5]);

    // layer 7 & 8 ****************************************************************
    buf[6] = mat4(vec4(-1.61102, 0.7970257, 1.4675229, 0.20917463), vec4(-28.793737, -7.1390953, 1.5025433, 4.656581), vec4(-10.94861, 39.66238, 0.74318546, -10.095605), vec4(-0.7229728, -1.5483948, 0.7301322, 2.1687684))
    * buf[0]
    + mat4(vec4(3.2547753, 21.489103, -1.0194173, -3.3100595), vec4(-3.7316632, -3.3792162, -7.223193, -0.23685838), vec4(13.1804495, 0.7916005, 5.338587, 5.687114), vec4(-4.167605, -17.798311, -6.815736, -1.6451967))
    * buf[1]
    + mat4(vec4(0.604885, -7.800309, -7.213122, -2.741014), vec4(-3.522382, -0.12359311, -0.5258442, 0.43852118), vec4(9.6752825, -22.853785, 2.062431, 0.099892326), vec4(-4.3196306, -17.730087, 2.5184598, 5.30267))
    * buf[2]
    + mat4(vec4(-6.545563, -15.790176, -6.0438633, -5.415399), vec4(-43.591583, 28.551912, -16.00161, 18.84728), vec4(4.212382, 8.394307, 3.0958717, 8.657522), vec4(-5.0237565, -4.450633, -4.4768, -5.5010443))
    * buf[3]
    + mat4(vec4(1.6985557, -67.05806, 6.897715, 1.9004834), vec4(1.8680354, 2.3915145, 2.5231109, 4.081538), vec4(11.158006, 1.7294737, 2.0738268, 7.386411), vec4(-4.256034, -306.24686, 8.258898, -17.132736))
    * buf[4]
    + mat4(vec4(1.6889864, -4.5852966, 3.8534803, -6.3482175), vec4(1.3543309, -1.2640043, 9.932754, 2.9079645), vec4(-5.2770967, 0.07150358, -0.13962056, 3.3269649), vec4(28.34703, -4.918278, 6.1044083, 4.085355))
    * buf[5]
    + vec4(6.6818056, 12.522166, -3.7075126, -4.104386);
    
    buf[7] = mat4(vec4(-8.265602, -4.7027016, 5.098234, 0.7509808), vec4(8.6507845, -17.15949, 16.51939, -8.884479), vec4(-4.036479, -2.3946867, -2.6055532, -1.9866527), vec4(-2.2167742, -1.8135649, -5.9759874, 4.8846445))
    * buf[0]
    + mat4(vec4(6.7790847, 3.5076547, -2.8191125, -2.7028968), vec4(-5.743024, -0.27844876, 1.4958696, -5.0517144), vec4(13.122226, 15.735168, -2.9397483, -4.101023), vec4(-14.375265, -5.030483, -6.2599335, 2.9848232))
    * buf[1]
    + mat4(vec4(4.0950394, -0.94011575, -5.674733, 4.755022), vec4(4.3809423, 4.8310084, 1.7425908, -3.437416), vec4(2.117492, 0.16342592, -104.56341, 16.949184), vec4(-5.22543, -2.994248, 3.8350096, -1.9364246))
    * buf[2]
    + mat4(vec4(-5.900337, 1.7946124, -13.604192, -3.8060522), vec4(6.6583457, 31.911177, 25.164474, 91.81147), vec4(11.840538, 4.1503043, -0.7314397, 6.768467), vec4(-6.3967767, 4.034772, 6.1714606, -0.32874924))
    * buf[3]
    + mat4(vec4(3.4992442, -196.91893, -8.923708, 2.8142626), vec4(3.4806502, -3.1846354, 5.1725626, 5.1804223), vec4(-2.4009497, 15.585794, 1.2863957, 2.0252278), vec4(-71.25271, -62.441242, -8.138444, 0.50670296))
    * buf[4]
    + mat4(vec4(-12.291733, -11.176166, -7.3474145, 4.390294), vec4(10.805477, 5.6337385, -0.9385842, -4.7348723), vec4(-12.869276, -7.039391, 5.3029537, 7.5436664), vec4(1.4593618, 8.91898, 3.5101583, 5.840625))
    * buf[5]
    + vec4(2.2415268, -6.705987, -0.98861027, -2.117676);

    buf[6] = sigmoid(buf[6]);
    buf[7] = sigmoid(buf[7]);

    // layer 9 ********************************************************************
    buf[0] = mat4(vec4(1.6794263, 1.3817469, 2.9625452, 0.0), vec4(-1.8834411, -1.4806935, -3.5924516, 0.0), vec4(-1.3279216, -1.0918057, -2.3124623, 0.0), vec4(0.2662234, 0.23235129, 0.44178495, 0.0))
    * buf[0]
    + mat4(vec4(-0.6299101, -0.5945583, -0.9125601, 0.0), vec4(0.17828953, 0.18300213, 0.18182953, 0.0), vec4(-2.96544, -2.5819945, -4.9001055, 0.0), vec4(1.4195864, 1.1868085, 2.5176322, 0.0))
    * buf[1]
    + mat4(vec4(-1.2584374, -1.0552157, -2.1688404, 0.0), vec4(-0.7200217, -0.52666044, -1.438251, 0.0), vec4(0.15345335, 0.15196142, 0.272854, 0.0), vec4(0.945728, 0.8861938, 1.2766753, 0.0))
    * buf[2]
    + mat4(vec4(-2.4218085, -1.968602, -4.35166, 0.0), vec4(-22.683098, -18.0544, -41.954372, 0.0), vec4(0.63792, 0.5470648, 1.1078634, 0.0), vec4(-1.5489894, -1.3075932, -2.6444845, 0.0))
    * buf[3]
    + mat4(vec4(-0.49252132, -0.39877754, -0.91366625, 0.0), vec4(0.95609266, 0.7923952, 1.640221, 0.0), vec4(0.30616966, 0.15693925, 0.8639857, 0.0), vec4(1.1825981, 0.94504964, 2.176963, 0.0))
    * buf[4]
    + mat4(vec4(0.35446745, 0.3293795, 0.59547555, 0.0), vec4(-0.58784515, -0.48177817, -1.0614829, 0.0), vec4(2.5271258, 1.9991658, 4.6846647, 0.0), vec4(0.13042648, 0.08864098, 0.30187556, 0.0))
    * buf[5]
    + mat4(vec4(-1.7718065, -1.4033192, -3.3355875, 0.0), vec4(3.1664357, 2.638297, 5.378702, 0.0), vec4(-3.1724713, -2.6107926, -5.549295, 0.0), vec4(-2.851368, -2.249092, -5.3013067, 0.0))
    * buf[6]
    + mat4(vec4(1.5203838, 1.2212278, 2.8404984, 0.0), vec4(1.5210563, 1.2651345, 2.683903, 0.0), vec4(2.9789467, 2.4364579, 5.2347264, 0.0), vec4(2.2270417, 1.8825914, 3.8028636, 0.0))
    * buf[7]
    + vec4(-1.5468478, -3.6171484, 0.24762098, 0.0);

    buf[0] = sigmoid(buf[0]);
    return vec4(buf[0].x , buf[0].y , buf[0].z, 1.0);
  }
  
  // Mostly black with peach, lavender, and orange accents
  vec3 black = vec3(0.0, 0.0, 0.0); // #000000
  vec3 subtlePeach = vec3(0.15, 0.08, 0.06); // Very dark peach
  vec3 peach = vec3(1.0, 0.85, 0.8); // Lighter peach for highlights
  vec3 lavender = vec3(0.87, 0.63, 0.87); // #DDA0DD for highlights
  vec3 subtleOrange = vec3(1.0, 0.65, 0.3); // #FFA64D for subtle orange accents
  
  void main() {
    vec2 uv = vUv * 2.0 - 1.0; uv.y *= -1.0;
    vec4 cppn = cppn_fn(uv, 0.1 * sin(0.3 * iTime), 0.1 * sin(0.69 * iTime), 0.1 * sin(0.44 * iTime));
    
    // Use the neural network output to create subtle variations
    float intensity = (cppn.r + cppn.g + cppn.b) / 3.0;
    
    // Start with mostly black, add subtle peach based on neural network pattern
    vec3 baseColor = mix(black, subtlePeach, intensity * 0.4);
    
    // Add peach highlights where the neural network is more intense
    float peachIntensity = smoothstep(0.3, 0.7, intensity);
    vec3 peachAccent = peach * peachIntensity * 0.6; // 60% opacity
    
    // Add lavender highlights using different channel for variation (increased presence)
    float lavenderIntensity = smoothstep(0.15, 0.65, cppn.g);
    vec3 lavenderAccent = lavender * lavenderIntensity * 0.85; // Increased to 85% opacity
    
    // Add orange accents using blue channel for variation
    float orangeIntensity = smoothstep(0.2, 0.7, cppn.b);
    vec3 orangeAccent = subtleOrange * orangeIntensity * 0.65; // Increased to 65% opacity
    
    vec3 finalColor = baseColor + peachAccent + lavenderAccent + orangeAccent;
    
    // Keep it mostly black but allow more brightness for accents
    finalColor = clamp(finalColor, vec3(0.0), vec3(0.6));
    
    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

const CPPNShaderMaterial = shaderMaterial(
  { iTime: 0, iResolution: new THREE.Vector2(1, 1) },
  vertexShader,
  fragmentShader
);

extend({ CPPNShaderMaterial });

function ShaderPlane() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const materialRef = useRef<any>(null!);

  useFrame((state) => {
    if (!materialRef.current) return;
    materialRef.current.iTime = state.clock.elapsedTime;
    const { width, height } = state.size;
    materialRef.current.iResolution.set(width, height);
  });

  return (
    <mesh ref={meshRef} position={[0, -0.75, -0.5]}>
      <planeGeometry args={[4, 4]} />
      <cPPNShaderMaterial ref={materialRef} side={THREE.DoubleSide} />
    </mesh>
  );
}

function ShaderBackground() {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  
  const camera = useMemo(() => ({ position: [0, 0, 1] as [number, number, number], fov: 75, near: 0.1, far: 1000 }), []);
  
  useGSAP(
    () => {
      if (!canvasRef.current) return;
      
      gsap.set(canvasRef.current, {
        filter: 'blur(20px)',
        scale: 1.1,
        autoAlpha: 0.7
      });
      
      gsap.to(canvasRef.current, {
        filter: 'blur(0px)',
        scale: 1,
        autoAlpha: 1,
        duration: 1.5,
        ease: 'power3.out',
        delay: 0.3
      });
    },
    { scope: canvasRef }
  );
  
  return (
    <div ref={canvasRef} className="bg-black absolute inset-0 -z-10 w-full h-full pointer-events-none" aria-hidden>
      <Canvas
        camera={camera}
        gl={{ antialias: true, alpha: false }}
        dpr={[1, 2]}
        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
      >
        <ShaderPlane />
      </Canvas>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/20" />
    </div>
  );
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    cPPNShaderMaterial: any;
  }
}

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
            <Button
              asChild
              size="lg"
              className="font-[family-name:var(--font-geist-mono)] mt-2 bg-white text-black hover:bg-white/90 font-medium rounded-full text-sm md:text-base relative z-20"
            >
              <a
                href={LUMA_REGISTER_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('hero.registerNow')}
              </a>
            </Button>
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
                  start: { lat: 3.1390, lng: 101.6869, label: "Kuala Lumpur" },
                  end: { lat: -6.2088, lng: 106.8456, label: "Jakarta" },
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: "Jakarta" },
                  end: { lat: -6.1783, lng: 106.6319, label: "Tangerang" },
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: "Jakarta" },
                  end: { lat: -8.6705, lng: 115.2126, label: "Bali" },
                },
                {
                  start: { lat: 3.1390, lng: 101.6869, label: "Kuala Lumpur" },
                  end: { lat: 10.8231, lng: 106.6297, label: "Ho Chi Minh" },
                },
                {
                  start: { lat: 10.8231, lng: 106.6297, label: "Ho Chi Minh" },
                  end: { lat: 16.0544, lng: 108.2022, label: "Da Nang" },
                },
                {
                  start: { lat: 10.8231, lng: 106.6297, label: "Ho Chi Minh" },
                  end: { lat: 21.0285, lng: 105.8542, label: "Ha Noi" },
                },
                {
                  start: { lat: 3.1390, lng: 101.6869, label: "Kuala Lumpur" },
                  end: { lat: 35.6762, lng: 139.6503, label: "Tokyo" },
                },
                {
                  start: { lat: -6.2088, lng: 106.8456, label: "Jakarta" },
                  end: { lat: -27.4698, lng: 153.0251, label: "Brisbane" },
                },
              ]}
              lineColor="#0ea5e9"
              showLabels={true}
              loop={true}
              animationDuration={2}
            />
          </div>
        </div>
      </section>

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
