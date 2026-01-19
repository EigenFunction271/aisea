"use client";

import { useRef, useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DottedMap from "dotted-map";
import Image from "next/image";
import { useTheme } from "next-themes";

interface MapProps {
  dots?: Array<{
    start: { lat: number; lng: number; label?: string };
    end: { lat: number; lng: number; label?: string };
  }>;
  lineColor?: string;
  showLabels?: boolean;
  labelClassName?: string;
  animationDuration?: number;
  loop?: boolean;
}

interface LabelPosition {
  x: number;
  y: number;
  label: string;
  originalX: number;
  originalY: number;
  width: number;
  height: number;
  needsLeaderLine?: boolean;
}

// Southeast Asia bounding box
const SEA_BOUNDS = {
  minLat: -10,
  maxLat: 30,
  minLng: 95,
  maxLng: 140,
};

// Full world bounds for projection
const WORLD_WIDTH = 800;
const WORLD_HEIGHT = 400;

export function WorldMap({ 
  dots = [], 
  lineColor = "#0ea5e9",
  showLabels = true,
  labelClassName = "text-sm",
  animationDuration = 2,
  loop = true
}: MapProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoveredLocation, setHoveredLocation] = useState<string | null>(null);
  const { theme } = useTheme();

  const map = useMemo(
    () => new DottedMap({ height: 100, grid: "diagonal" }),
    []
  );

  const svgMap = useMemo(
    () => map.getSVG({
      radius: 0.22,
      color: theme === "dark" ? "#FFFF7F40" : "#00000040",
      shape: "circle",
      backgroundColor: theme === "dark" ? "black" : "white",
    }),
    [map, theme]
  );

  // Project point to world coordinates using equirectangular projection
  // This is a simple cylindrical projection that maps lat/lng directly to x/y
  // Verified coordinates should match the DottedMap library's projection
  const projectPoint = (lat: number, lng: number) => {
    // Clamp coordinates to valid ranges
    const clampedLat = Math.max(-90, Math.min(90, lat));
    const clampedLng = Math.max(-180, Math.min(180, lng));
    
    // Equirectangular projection (Plate Carrée)
    // Map longitude [-180, 180] to x [0, WORLD_WIDTH]
    const x = (clampedLng + 180) * (WORLD_WIDTH / 360);
    // Map latitude [-90, 90] to y [WORLD_HEIGHT, 0] (inverted because SVG y increases downward)
    // This matches the standard equirectangular projection used by most map libraries
    const y = (90 - clampedLat) * (WORLD_HEIGHT / 180);
    
    return { x, y };
  };

  // Calculate SEA-focused viewBox
  const seaViewBox = useMemo(() => {
    const seaMinX = (SEA_BOUNDS.minLng + 180) * (WORLD_WIDTH / 360);
    const seaMaxX = (SEA_BOUNDS.maxLng + 180) * (WORLD_WIDTH / 360);
    const seaMinY = (90 - SEA_BOUNDS.maxLat) * (WORLD_HEIGHT / 180);
    const seaMaxY = (90 - SEA_BOUNDS.minLat) * (WORLD_HEIGHT / 180);
    
    // Add padding (20% on each side)
    const paddingX = (seaMaxX - seaMinX) * 0.2;
    const paddingY = (seaMaxY - seaMinY) * 0.2;
    
    const viewX = Math.max(0, seaMinX - paddingX);
    const viewY = Math.max(0, seaMinY - paddingY);
    const viewWidth = Math.min(WORLD_WIDTH, seaMaxX - seaMinX + paddingX * 2);
    const viewHeight = Math.min(WORLD_HEIGHT, seaMaxY - seaMinY + paddingY * 2);
    
    return { x: viewX, y: viewY, width: viewWidth, height: viewHeight };
  }, []);

  // Memoize projected points to avoid recalculation
  const projectedPoints = useMemo(() => {
    return dots.map(dot => ({
      start: projectPoint(dot.start.lat, dot.start.lng),
      end: projectPoint(dot.end.lat, dot.end.lng),
      startLabel: dot.start.label,
      endLabel: dot.end.label,
    }));
  }, [dots]);

  // Optimized label positioning with reduced iterations
  const labelPositions = useMemo(() => {
    if (!showLabels) return [];
    
    const positions: LabelPosition[] = [];
    const labelWidth = 100;
    const labelHeight = 30;
    const minDistance = 60;
    
    // Collect all label positions using memoized points
    projectedPoints.forEach((proj, i) => {
      if (proj.startLabel) {
        positions.push({
          x: proj.start.x - labelWidth / 2,
          y: proj.start.y - 35,
          label: proj.startLabel,
          originalX: proj.start.x,
          originalY: proj.start.y,
          width: labelWidth,
          height: labelHeight,
        });
      }
      if (proj.endLabel) {
        positions.push({
          x: proj.end.x - labelWidth / 2,
          y: proj.end.y - 35,
          label: proj.endLabel,
          originalX: proj.end.x,
          originalY: proj.end.y,
          width: labelWidth,
          height: labelHeight,
        });
      }
    });

    // Optimized overlap resolution - reduced iterations
    const resolvedPositions = positions.map((pos, i) => {
      let adjustedX = pos.x;
      let adjustedY = pos.y;
      const maxAttempts = 20; // Reduced from 50
      
      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        let hasOverlap = false;
        
        for (let j = 0; j < positions.length; j++) {
          if (i === j) continue;
          
          const other = positions[j];
          const dx = adjustedX - other.x;
          const dy = adjustedY - other.y;
          const distanceSq = dx * dx + dy * dy; // Use squared distance to avoid sqrt
          
          if (distanceSq < minDistance * minDistance) {
            hasOverlap = true;
            const distance = Math.sqrt(distanceSq);
            const angle = Math.atan2(dy, dx);
            const pushDistance = minDistance - distance + 5;
            adjustedX += Math.cos(angle) * pushDistance;
            adjustedY += Math.sin(angle) * pushDistance;
            
            adjustedX = Math.max(0, Math.min(WORLD_WIDTH - labelWidth, adjustedX));
            adjustedY = Math.max(0, Math.min(WORLD_HEIGHT - labelHeight, adjustedY));
          }
        }
        
        if (!hasOverlap) break;
      }
      
      const finalY = adjustedY < pos.originalY - 20 ? adjustedY : pos.originalY - 45;
      const offsetX = Math.abs(adjustedX - (pos.originalX - labelWidth / 2));
      const offsetY = Math.abs(finalY - (pos.originalY - 35));
      
      return {
        ...pos,
        x: adjustedX,
        y: finalY,
        needsLeaderLine: offsetX > 10 || offsetY > 10,
      };
    });
    
    return resolvedPositions;
  }, [projectedPoints, showLabels]);

  // Memoize path creation
  const createCurvedPath = useCallback((
    start: { x: number; y: number },
    end: { x: number; y: number }
  ) => {
    const midX = (start.x + end.x) / 2;
    const midY = Math.min(start.y, end.y) - 50;
    return `M ${start.x} ${start.y} Q ${midX} ${midY} ${end.x} ${end.y}`;
  }, []);

  // Simplified animation timing
  const staggerDelay = 0.2; // Reduced from 0.3
  const totalAnimationTime = dots.length * staggerDelay + animationDuration;
  const pauseTime = 1.5; // Reduced from 2
  const fullCycleDuration = totalAnimationTime + pauseTime;

  // Calculate image crop to focus on SEA region
  const imageCropStyle = useMemo(() => {
    const leftPercent = (seaViewBox.x / WORLD_WIDTH) * 100;
    const topPercent = (seaViewBox.y / WORLD_HEIGHT) * 100;
    const widthPercent = (seaViewBox.width / WORLD_WIDTH) * 100;
    const heightPercent = (seaViewBox.height / WORLD_HEIGHT) * 100;
    const scale = 100 / Math.min(widthPercent, heightPercent);
    
    return {
      objectPosition: `${leftPercent + widthPercent / 2}% ${topPercent + heightPercent / 2}%`,
      objectFit: 'cover' as const,
      transform: `scale(${scale})`,
      transformOrigin: 'center center',
    };
  }, [seaViewBox]);

  return (
    <div className="w-full aspect-[2/1] md:aspect-[2.5/1] lg:aspect-[2/1] dark:bg-black bg-white rounded-lg relative font-sans overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <Image
          src={`data:image/svg+xml;utf8,${encodeURIComponent(svgMap)}`}
          className="h-full w-full pointer-events-none select-none"
          alt="world map"
          height="495"
          width="1056"
          draggable={false}
          priority
          style={imageCropStyle}
        />
      </div>
      <svg
        ref={svgRef}
        viewBox={`${seaViewBox.x} ${seaViewBox.y} ${seaViewBox.width} ${seaViewBox.height}`}
        className="w-full h-full absolute inset-0 pointer-events-auto select-none"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <linearGradient id="path-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="5%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="95%" stopColor={lineColor} stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow">
            <feMorphology operator="dilate" radius="0.5" />
            <feGaussianBlur stdDeviation="1" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          
        </defs>

        {projectedPoints.map((proj, i) => {
          const pathD = createCurvedPath(proj.start, proj.end);
          
          // Simplified animation timing
          const startTime = (i * staggerDelay) / fullCycleDuration;
          const endTime = (i * staggerDelay + animationDuration) / fullCycleDuration;
          const resetTime = totalAnimationTime / fullCycleDuration;
          
          return (
            <g key={`path-group-${i}`}>
              <motion.path
                d={pathD}
                fill="none"
                stroke="url(#path-gradient)"
                strokeWidth="1"
                initial={{ pathLength: 0 }}
                animate={loop ? {
                  pathLength: [0, 0, 1, 1, 0],
                } : {
                  pathLength: 1
                }}
                transition={loop ? {
                  duration: fullCycleDuration,
                  times: [0, startTime, endTime, resetTime, 1],
                  ease: "easeInOut",
                  repeat: Infinity,
                  repeatDelay: 0,
                } : {
                  duration: animationDuration,
                  delay: i * staggerDelay,
                  ease: "easeInOut",
                }}
                style={{ 
                  willChange: 'pathLength',
                  // Optimize rendering performance
                  shapeRendering: 'optimizeSpeed',
                }}
              />
              
              {/* Simplified: Remove animated circle for better performance */}
            </g>
          );
        })}

        {projectedPoints.map((proj, i) => {
          const dot = dots[i];
          
          return (
            <g key={`points-group-${i}`}>
              {/* Start Point */}
              <g key={`start-${i}`}>
                <g
                  onMouseEnter={() => setHoveredLocation(proj.startLabel || `Location ${i}`)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  className="cursor-pointer transition-transform hover:scale-110"
                  style={{ transformOrigin: `${proj.start.x}px ${proj.start.y}px` }}
                >
                  <circle
                    cx={proj.start.x}
                    cy={proj.start.y}
                    r="3"
                    fill={lineColor}
                    filter="url(#glow)"
                    className="drop-shadow-lg"
                    style={{ willChange: 'transform' }}
                  />
                  {/* Simplified pulsing animation - single ring instead of multiple */}
                  <circle
                    cx={proj.start.x}
                    cy={proj.start.y}
                    r="3"
                    fill={lineColor}
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="3;10;3"
                      dur="2s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
                      dur="2s"
                      begin="0s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
                
                {showLabels && proj.startLabel && (() => {
                  const labelPos = labelPositions.find(p => 
                    p.label === proj.startLabel && 
                    Math.abs(p.originalX - proj.start.x) < 1 && 
                    Math.abs(p.originalY - proj.start.y) < 1
                  );
                  if (!labelPos) return null;
                  
                  return (
                    <motion.g
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.5 }}
                      className="pointer-events-none"
                    >
                      {labelPos.needsLeaderLine && (
                        <line
                          x1={proj.start.x}
                          y1={proj.start.y}
                          x2={labelPos.x + labelPos.width / 2}
                          y2={labelPos.y + labelPos.height / 2}
                          stroke={lineColor}
                          strokeWidth="0.5"
                          strokeOpacity="0.3"
                          strokeDasharray="2,2"
                        />
                      )}
                      <foreignObject
                        x={labelPos.x}
                        y={labelPos.y}
                        width={labelPos.width}
                        height={labelPos.height}
                        className="block"
                      >
                        <div className="flex items-center justify-center h-full">
                          <span className="text-sm font-medium px-2 py-0.5 rounded-md bg-white/95 dark:bg-black/95 text-black dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
                            {labelPos.label}
                          </span>
                        </div>
                      </foreignObject>
                    </motion.g>
                  );
                })()}
              </g>
              
              {/* End Point */}
              <g key={`end-${i}`}>
                <g
                  onMouseEnter={() => setHoveredLocation(proj.endLabel || `Destination ${i}`)}
                  onMouseLeave={() => setHoveredLocation(null)}
                  className="cursor-pointer transition-transform hover:scale-110"
                  style={{ transformOrigin: `${proj.end.x}px ${proj.end.y}px` }}
                >
                  <circle
                    cx={proj.end.x}
                    cy={proj.end.y}
                    r="3"
                    fill={lineColor}
                    filter="url(#glow)"
                    className="drop-shadow-lg"
                    style={{ willChange: 'transform' }}
                  />
                  <circle
                    cx={proj.end.x}
                    cy={proj.end.y}
                    r="3"
                    fill={lineColor}
                    opacity="0.4"
                  >
                    <animate
                      attributeName="r"
                      values="3;10;3"
                      dur="2s"
                      begin="0.5s"
                      repeatCount="indefinite"
                    />
                    <animate
                      attributeName="opacity"
                      values="0.6;0;0.6"
                      dur="2s"
                      begin="0.5s"
                      repeatCount="indefinite"
                    />
                  </circle>
                </g>
                
                {showLabels && proj.endLabel && (() => {
                  const labelPos = labelPositions.find(p => 
                    p.label === proj.endLabel && 
                    Math.abs(p.originalX - proj.end.x) < 1 && 
                    Math.abs(p.originalY - proj.end.y) < 1
                  );
                  if (!labelPos) return null;
                  
                  return (
                    <motion.g
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 + i * 0.1, duration: 0.5 }}
                      className="pointer-events-none"
                    >
                      {labelPos.needsLeaderLine && (
                        <line
                          x1={proj.end.x}
                          y1={proj.end.y}
                          x2={labelPos.x + labelPos.width / 2}
                          y2={labelPos.y + labelPos.height / 2}
                          stroke={lineColor}
                          strokeWidth="0.5"
                          strokeOpacity="0.3"
                          strokeDasharray="2,2"
                        />
                      )}
                      <foreignObject
                        x={labelPos.x}
                        y={labelPos.y}
                        width={labelPos.width}
                        height={labelPos.height}
                        className="block"
                      >
                        <div className="flex items-center justify-center h-full">
                          <span className="text-sm font-medium px-2 py-0.5 rounded-md bg-white/95 dark:bg-black/95 text-black dark:text-white border border-gray-200 dark:border-gray-700 shadow-sm">
                            {labelPos.label}
                          </span>
                        </div>
                      </foreignObject>
                    </motion.g>
                  );
                })()}
              </g>
            </g>
          );
        })}
      </svg>
      
      {/* Mobile Tooltip */}
      <AnimatePresence mode="wait">
        {hoveredLocation && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="absolute bottom-4 left-4 bg-white/90 dark:bg-black/90 text-black dark:text-white px-3 py-2 rounded-lg text-sm font-medium backdrop-blur-sm sm:hidden border border-gray-200 dark:border-gray-700"
          >
            {hoveredLocation}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
