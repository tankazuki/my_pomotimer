"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";

const SIZE = 220;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

type CircularProgressProps = {
  /** 経過割合 (0=開始直後 〜 1=終了)。 */
  ratio: number;
  children?: ReactNode;
};

export function CircularProgress({ ratio, children }: CircularProgressProps) {
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(ratio);
  const springProgress = useSpring(progress, { stiffness: 120, damping: 22, mass: 0.5 });
  const strokeDashoffset = useTransform(
    shouldReduceMotion ? progress : springProgress,
    (value) => CIRCUMFERENCE * (1 - value),
  );

  useEffect(() => {
    progress.set(ratio);
  }, [ratio, progress]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className="fill-none stroke-muted"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset }}
          className="fill-none stroke-primary"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
