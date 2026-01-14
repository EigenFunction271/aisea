"use client";

import React from "react";
import { motion, Variants, HTMLMotionProps } from "motion/react";
import { useInView } from "motion/react";
import { useRef } from "react";

interface TimelineContentProps extends Omit<HTMLMotionProps<"div">, "as"> {
  as?: React.ElementType;
  animationNum: number;
  timelineRef: React.RefObject<HTMLElement | null>;
  customVariants?: Variants;
  children: React.ReactNode;
  className?: string;
}

export function TimelineContent({
  as: Component = "div",
  animationNum,
  timelineRef,
  customVariants,
  children,
  className,
  ...props
}: TimelineContentProps) {
  const ref = useRef(null);
  const isInView = useInView(timelineRef || ref, { once: true, margin: "-100px" });

  const defaultVariants: Variants = {
    hidden: {
      opacity: 0,
      filter: "blur(10px)",
    },
    visible: (i: number) => ({
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        delay: i * 0.1,
        duration: 0.7,
      },
    }),
  };

  const variants = customVariants || defaultVariants;

  const MotionComponent = motion.create(Component as React.ElementType);

  return (
    <MotionComponent
      ref={ref}
      initial="hidden"
      animate={isInView ? "visible" : "hidden"}
      variants={variants}
      custom={animationNum}
      className={className}
      {...(props as any)}
    >
      {children}
    </MotionComponent>
  );
}
