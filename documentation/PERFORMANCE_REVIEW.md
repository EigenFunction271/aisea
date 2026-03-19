# Performance Optimization Review

## Executive Summary
This codebase has several performance optimization opportunities. The main areas for improvement are:
1. **Image Optimization** (High Impact) - Replace `<img>` tags with Next.js `Image` component
2. **Code Duplication** (Medium Impact) - Extract duplicate shader code
3. **Bundle Size** (Medium Impact) - Optimize heavy dependencies
4. **React Performance** (Low-Medium Impact) - Add memoization where needed
5. **Next.js Configuration** (Low Impact) - Add performance optimizations

---

## 🔴 Critical Issues (High Impact)

### 1. Image Optimization - Missing Next.js Image Component

**Issue**: Multiple components use native `<img>` tags instead of Next.js optimized `Image` component, missing automatic optimization, lazy loading, and responsive images.

**Affected Files**:
- `src/components/LogoScrollingBar.tsx` (line 122)
- `src/components/ui/interactive-scrolling-story-component.tsx` (line 175)
- `src/components/ui/images-scrolling-animation.tsx` (line 62)

**Impact**: 
- Larger initial bundle size
- No automatic image optimization
- Missing lazy loading
- No responsive image generation

**Recommendation**: Replace all `<img>` tags with Next.js `Image` component.

**Example Fix**:
```typescript
// Before (LogoScrollingBar.tsx)
<img
  src={logo.src}
  alt={logo.name}
  className="h-full w-full object-contain opacity-70 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0"
/>

// After
<Image
  src={logo.src}
  alt={logo.name}
  width={120}
  height={60}
  className="h-full w-full object-contain opacity-70 grayscale transition-opacity duration-300 hover:opacity-100 hover:grayscale-0"
  loading="lazy"
  sizes="120px"
/>
```

**Note**: For scrolling animations, you may need to use `unoptimized={true}` if the images need to be positioned absolutely, but still benefit from lazy loading.

---

## 🟡 Medium Priority Issues

### 2. Code Duplication - Shader Code

**Issue**: Large shader code (200+ lines) is duplicated in:
- `src/app/[locale]/page.tsx` (lines 34-206)
- `src/app/[locale]/residency/page.tsx` (lines 27-199)

**Impact**: 
- Increased bundle size (~10-15KB per duplication)
- Maintenance burden
- Risk of inconsistencies

**Recommendation**: Extract shader code to a shared module.

**Suggested Structure**:
```
src/shaders/
  └── cppn-shader.ts  // Shared shader code
src/components/
  └── ShaderBackground.tsx  // Reusable component
```

**Benefits**:
- Single source of truth
- Smaller bundle size
- Easier maintenance

---

### 3. Bundle Size Optimization

**Issue**: Heavy dependencies loaded upfront:
- `three` (~600KB)
- `@react-three/fiber` (~200KB)
- `@react-three/drei` (~150KB)
- `framer-motion` (~200KB)
- `gsap` (~100KB)
- `lenis` (~50KB)

**Current State**: 
- ✅ `WorldMap` is already dynamically imported (good!)
- ❌ Shader components load immediately
- ❌ Multiple animation libraries loaded simultaneously

**Recommendations**:

1. **Lazy load shader components**:
```typescript
const ShaderBackground = dynamic(
  () => import('@/components/ShaderBackground'),
  { ssr: false, loading: () => <div className="bg-black absolute inset-0" /> }
);
```

2. **Consider reducing animation libraries**:
   - You're using both `framer-motion` and `gsap` - consider standardizing on one
   - `lenis` is only used in `images-scrolling-animation.tsx` - lazy load it

3. **Tree-shake unused Three.js features**:
```typescript
// Instead of: import * as THREE from 'three';
import { Vector2 } from 'three';
```

---

### 4. React Performance - Missing Memoization

**Issue**: Some components re-render unnecessarily or recreate expensive computations.

**Affected Components**:

1. **Navbar Component** (`src/components/ui/navbar.tsx`):
   - Arrays recreated on every render (lines 27-35)
   - Could benefit from `useMemo` for static data

2. **WhatAISeaDoes Component** (`src/components/WhatAISeaDoes.tsx`):
   - `aiseaSlidesData` recreated on every render (lines 9-34)
   - Should be memoized

3. **HowItWorks Component** (`src/components/HowItWorks.tsx`):
   - `cards` array recreated on every render (lines 40-53)
   - Variants objects recreated (lines 9-38)

**Recommendations**:

```typescript
// Example: WhatAISeaDoes.tsx
export function WhatAISeaDoes() {
  const t = useTranslations('whatAISeaDoes');
  
  const aiseaSlidesData: SlideData[] = useMemo(() => [
    {
      title: t('slide1.title'),
      description: t('slide1.description'),
      image: "/assets/images_slides/1.png",
      bgColor: "#000000",
      textColor: "#ffffff",
      features: (t.raw('slide1.features') as string[]),
    },
    // ... rest
  ], [t]);
  
  // ...
}
```

**Note**: For translation-dependent data, you may need to include translation keys in the dependency array or use a different approach.

---

### 5. Next.js Configuration Enhancements

**Current Config** (`next.config.ts`):
```typescript
const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      "*.glsl": {
        loaders: ["raw-loader"],
        as: "*.js",
      },
    },
  },
};
```

**Recommended Additions**:

```typescript
const nextConfig: NextConfig = {
  // ... existing config
  
  // Image optimization
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },
  
  // Compression
  compress: true,
  
  // Production optimizations
  productionBrowserSourceMaps: false,
  
  // Experimental features for better performance
  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons'],
  },
};
```

---

## 🟢 Low Priority / Nice to Have

### 6. Font Loading Optimization

**Current State**: ✅ Good - Using Next.js font optimization

**Potential Enhancement**: Preload critical fonts
```typescript
// In layout.tsx
<link
  rel="preload"
  href="/fonts/perfectly-nineties-regular.otf"
  as="font"
  type="font/otf"
  crossOrigin="anonymous"
/>
```

### 7. CSS Optimization

**Current State**: Using Tailwind CSS v4

**Recommendations**:
- Ensure unused CSS is purged (should be automatic with Tailwind v4)
- Consider critical CSS extraction for above-the-fold content

### 8. Bundle Analysis

**Recommendation**: Add bundle analyzer to track bundle size:

```json
// package.json
{
  "scripts": {
    "analyze": "ANALYZE=true next build"
  }
}
```

Install: `@next/bundle-analyzer`

---

## 📊 Performance Metrics to Track

1. **First Contentful Paint (FCP)** - Target: < 1.8s
2. **Largest Contentful Paint (LCP)** - Target: < 2.5s
3. **Time to Interactive (TTI)** - Target: < 3.8s
4. **Total Bundle Size** - Target: < 500KB (gzipped)
5. **Image Optimization** - All images should use Next.js Image component

---

## 🎯 Implementation Priority

1. **Week 1**: Fix image optimization (Critical)
2. **Week 2**: Extract duplicate shader code (Medium)
3. **Week 3**: Add memoization to components (Medium)
4. **Week 4**: Optimize bundle size with lazy loading (Medium)
5. **Ongoing**: Monitor and optimize based on metrics

---

## ✅ What's Already Good

1. ✅ Dynamic imports for heavy components (`WorldMap`)
2. ✅ Proper use of `useMemo` in scrolling components
3. ✅ Direct DOM manipulation for animations (bypassing React reconciliation)
4. ✅ Font optimization with Next.js
5. ✅ Proper image optimization in some components (`CityScrollingBar`, main page hero)
6. ✅ Throttled frame updates in shader components
7. ✅ Error boundaries implemented

---

## 📝 Additional Notes

- The shader throttling (60fps cap) is well implemented
- The scrolling animations use `willChange: "transform"` which is good for performance
- Consider adding `loading="lazy"` to below-the-fold images
- Monitor Core Web Vitals in production

---

## 🔧 Quick Wins (Can be done immediately)

1. Replace `<img>` with `Image` in `LogoScrollingBar.tsx` (5 min)
2. Add `useMemo` to `WhatAISeaDoes` component (5 min)
3. Add `useMemo` to `HowItWorks` component (5 min)
4. Add image optimization config to `next.config.ts` (2 min)
5. Extract shader code to shared module (30 min)

**Total estimated time for quick wins: ~1 hour**
