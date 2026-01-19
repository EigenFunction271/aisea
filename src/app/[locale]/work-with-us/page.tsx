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
import { Navbar1 } from "@/components/ui/navbar";
import { Mail } from "lucide-react";
import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LogoScrollingBar } from "@/components/LogoScrollingBar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

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
  const lastFrameTime = useRef(0);
  const frameSkip = useRef(0);

  useFrame((state) => {
    if (!materialRef.current) return;
    
    // Throttle updates to ~60fps max to reduce CPU usage
    const now = state.clock.elapsedTime;
    if (now - lastFrameTime.current < 0.016) {
      return;
    }
    lastFrameTime.current = now;
    
    materialRef.current.iTime = now;
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
        gl={{ 
          antialias: true, 
          alpha: false,
          powerPreference: "high-performance",
          stencil: false,
          depth: false,
        }}
        dpr={[1, 2]}
        performance={{ min: 0.5 }}
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

export default function WorkWithUsPage() {
  const t = useTranslations('workWithUs');
  
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
              Reach 10,000+ active AI builders across APAC
            </TextShimmer>
          </BlurFade>

          <BlurFade delay={0.3}>
            <p className="font-[family-name:var(--font-geist-mono)] text-white/80 text-sm sm:text-base md:text-lg leading-relaxed max-w-2xl mx-auto">
              Stop paying for low-signal leads. Get direct access to builders who actually ship and give real feedback.
            </p>
          </BlurFade>

          <BlurFade delay={0.5}>
            <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 max-w-6xl mx-auto px-4 mt-8">
              <div className="flex-1 space-y-4 text-left">
                <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
                  AI.SEA helps AI companies reach qualified technical users in Southeast Asia without burning budget on ads, cold outbound, or slow DevRel programs.
                </p>
                <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
                  We work with teams who need real usage, fast feedback, and regional traction.
                </p>
              </div>
              <div className="flex-1 w-full lg:w-auto">
                <div className="relative w-full aspect-[4/3] lg:max-w-md rounded-lg overflow-hidden">
                  <Image
                    src="/assets/images_slides/4.png"
                    alt="AI.SEA builders"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>
            </div>
          </BlurFade>
        </div>
      </section>

      {/* Spacer to allow scrolling past hero */}
      <div className="relative z-0 h-screen pointer-events-none" />

      {/* Traditional GTM Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12">
            <div className="flex-1 w-full lg:w-auto order-2 lg:order-1">
              <div className="relative w-full aspect-[4/3] lg:max-w-md rounded-lg overflow-hidden">
                <Image
                  src="/assets/images_slides/5.JPG"
                  alt="Traditional GTM challenges"
                  fill
                  className="object-cover"
                  priority
                />
              </div>
            </div>
            <div className="flex-1 space-y-6 text-left order-1 lg:order-2">
              <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight">
                Traditional GTM doesn't scale the way you need it to
              </h2>
              <div className="space-y-4 font-[family-name:var(--font-geist-mono)] text-white/90 text-base sm:text-lg md:text-xl leading-relaxed">
                <p>Paid ads are expensive and noisy.</p>
                <p>Cold outreach rarely reaches real builders.</p>
                <p>DevRel takes months to show signal and is hard to measure.</p>
                <p className="pt-4 border-t border-white/20">
                  Most teams only realize something is wrong after the roadmap is locked and budget is gone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What AI.SEA gives you Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center mb-12 md:mb-16">
            What AI.SEA gives you
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8 mb-12">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-geist-mono)] text-xl md:text-2xl font-semibold text-white">
                  Direct Builder Access
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                  Reach active AI builders across Southeast Asia who are already shipping projects, not passive audiences or mailing lists.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-geist-mono)] text-xl md:text-2xl font-semibold text-white">
                  Trusted Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                  Your product is introduced through established local communities, not ads, cold outreach, or generic newsletters. This ensures direct, targeted outreach to the best category of builders for your product.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <CardTitle className="font-[family-name:var(--font-geist-mono)] text-xl md:text-2xl font-semibold text-white">
                  In-Context Visibility
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                  Your product shows up inside hackathons, sprints, and co-build sessions where tools are chosen under real constraints.
                </p>
              </CardContent>
            </Card>
          </div>

          <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-center text-lg md:text-xl leading-relaxed max-w-3xl mx-auto">
            Learn what works before you commit roadmap, headcount, or regional GTM spend.
          </p>
        </div>
      </section>

      {/* Who we've worked with Section */}
      <div className="relative z-20 bg-black">
        <LogoScrollingBar scrollSpeed={1.0} direction="right" showTitle={true} />
      </div>

      {/* Get access to Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center mb-12 md:mb-16">
            Get access to
          </h2>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              <div className="text-center">
                <div className="font-[family-name:var(--font-perfectly-nineties)] text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4">
                  10,000+
                </div>
                <div className="font-[family-name:var(--font-geist-mono)] text-white/90 text-lg md:text-xl">
                  builders
                </div>
              </div>

              <div className="text-center">
                <div className="font-[family-name:var(--font-perfectly-nineties)] text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4">
                  5
                </div>
                <div className="font-[family-name:var(--font-geist-mono)] text-white/90 text-lg md:text-xl">
                  countries
                </div>
              </div>

              <div className="text-center">
                <div className="font-[family-name:var(--font-perfectly-nineties)] text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-4">
                  US$200k+
                </div>
                <div className="font-[family-name:var(--font-geist-mono)] text-white/90 text-lg md:text-xl">
                  committed
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Case Studies Section */}
      <section className="relative z-20 bg-black text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="font-[family-name:var(--font-perfectly-nineties)] text-4xl sm:text-5xl md:text-6xl font-bold text-white text-center mb-12 md:mb-16">
            Case Studies
          </h2>
          
          <Carousel
            opts={{
              align: "start",
              loop: true,
            }}
            className="w-full max-w-5xl mx-auto"
          >
            <CarouselContent>
              <CarouselItem>
                <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/2 p-6 md:p-8 space-y-4">
                      <CardHeader className="p-0">
                        <CardTitle className="font-[family-name:var(--font-geist-mono)] text-2xl md:text-3xl font-semibold text-white mb-4">
                          Lovable Hackathon reached 200+ non-coders
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-4">
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          AI.SEA partnered with Lovable to run a targeted hackathon designed to reach builders outside their usual technical audience.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          Instead of engineers, the event attracted 200+ non-coders, including 40–50+ year old business owners, operators, and solo founders. Many participants were already running real businesses and were actively looking for tools to ship faster without engineering teams.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          During the hackathon, Lovable became the primary tool participants used to build landing pages, prototypes, and internal tools for their existing businesses. This was not experimentation for fun. It was applied usage under real commercial constraints.
                        </p>
                        <div className="pt-4 border-t border-white/20">
                          <p className="font-[family-name:var(--font-geist-mono)] text-white font-semibold text-base md:text-lg mb-2">
                            Result:
                          </p>
                          <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                            Strong product lock-in. Participants continued using Lovable beyond the event because it directly replaced slower, more expensive workflows they were already paying for.
                          </p>
                        </div>
                      </CardContent>
                    </div>
                    <div className="lg:w-1/2 relative aspect-[4/3] lg:aspect-auto lg:h-auto">
                      <Image
                        src="/assets/images_slides/bfg.avif"
                        alt="Lovable Hackathon"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </Card>
              </CarouselItem>
              
              <CarouselItem>
                <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/2 p-6 md:p-8 space-y-4">
                      <CardHeader className="p-0">
                        <CardTitle className="font-[family-name:var(--font-geist-mono)] text-2xl md:text-3xl font-semibold text-white mb-4">
                          Cursor and Anthropic onboarded ~700 senior builders in SEA in one day
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-4">
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          AI.SEA partnered with Cursor, Anthropic, and ecosystem partners to run one of Malaysia's largest AI hackathons.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          The event drew over 2,000 signups, with approximately 1,000 builders attending in person within a single day. Around 70% of participants were senior developers, founders, or technical leads, closely matching the ideal user profile for both Cursor and Anthropic.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          Participants actively used Cursor and Anthropic tools throughout the hackathon to build and ship working projects under time pressure. This created immediate hands-on onboarding, not passive exposure.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          The top 15 teams received recognition from local VCs and ecosystem partners including AWS.
                        </p>
                        <div className="pt-4 border-t border-white/20">
                          <p className="font-[family-name:var(--font-geist-mono)] text-white font-semibold text-base md:text-lg mb-2">
                            Result:
                          </p>
                          <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                            Public demonstration of how Cursor and Anthropic accelerated development speed, improved iteration quality, and enabled teams to ship more ambitious products within tight timelines.
                          </p>
                        </div>
                      </CardContent>
                    </div>
                    <div className="lg:w-1/2 relative aspect-[4/3] lg:aspect-auto lg:h-auto">
                      <Image
                        src="/assets/images_slides/cam.avif"
                        alt="Cursor and Anthropic Hackathon"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </Card>
              </CarouselItem>
              
              <CarouselItem>
                <Card className="bg-white/5 border-white/10 text-white overflow-hidden">
                  <div className="flex flex-col lg:flex-row">
                    <div className="lg:w-1/2 p-6 md:p-8 space-y-4">
                      <CardHeader className="p-0">
                        <CardTitle className="font-[family-name:var(--font-geist-mono)] text-2xl md:text-3xl font-semibold text-white mb-4">
                          ElevenLabs demonstrated a new product feature through 150+ builders in 2 hours
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0 space-y-4">
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          AI.SEA partnered with ElevenLabs to run a focused 2-hour hackathon designed to showcase a new feature of its voice AI platform.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          150+ builders participated in a single, tightly scoped challenge: re-dub an existing short video using ElevenLabs. The constraint forced every participant to touch the feature directly, not just watch a demo.
                        </p>
                        <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                          The competition format encouraged memes and humor, lowering the barrier to participation while still requiring real product usage. Participants were required to publicly demo their outputs on YouTube, creating organic distribution beyond the event itself.
                        </p>
                        <div className="pt-4 border-t border-white/20">
                          <p className="font-[family-name:var(--font-geist-mono)] text-white font-semibold text-base md:text-lg mb-2">
                            Result:
                          </p>
                          <p className="font-[family-name:var(--font-geist-mono)] text-white/90 text-base md:text-lg leading-relaxed">
                            Within two hours, ElevenLabs achieved hands-on adoption, clear qualitative feedback, and broad public visibility for the new feature without running a traditional launch campaign.
                          </p>
                        </div>
                      </CardContent>
                    </div>
                    <div className="lg:w-1/2 relative aspect-[4/3] lg:aspect-auto lg:h-auto">
                      <Image
                        src="/assets/images_slides/sas.png"
                        alt="ElevenLabs Hackathon"
                        fill
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </Card>
              </CarouselItem>
            </CarouselContent>
            <CarouselPrevious className="text-white border-white/20 hover:bg-white/10 hover:border-white/40" />
            <CarouselNext className="text-white border-white/20 hover:bg-white/10 hover:border-white/40" />
          </Carousel>
          
          <div className="flex justify-center mt-12">
            <Button
              asChild
              size="lg"
              className="font-[family-name:var(--font-geist-mono)] bg-white text-black hover:bg-white/90 font-medium rounded-full text-base md:text-lg px-8 py-6"
            >
              <a
                href="https://airtable.com/appBgmnpu1bJljnxX/pagPGkKttUQAM4nGV/form"
                target="_blank"
                rel="noopener noreferrer"
              >
                Work with us
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="relative z-20 bg-black text-white">
        <div className="max-w-4xl mx-auto px-4 py-16">
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
      </section>
    </div>
  );
}
