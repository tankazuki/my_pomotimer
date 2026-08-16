"use client";

import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, type ReactNode } from "react";

const SIZE = 220;
const STROKE_WIDTH = 10;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const GLOW_KEYFRAMES = [
  "drop-shadow(0 0 15px rgba(249, 115, 22, 0.4))",
  "drop-shadow(0 0 28px rgba(249, 115, 22, 0.75))",
  "drop-shadow(0 0 15px rgba(249, 115, 22, 0.4))",
];
const STATIC_GLOW = "drop-shadow(0 0 15px rgba(249, 115, 22, 0.35))";

type CircularProgressProps = {
  /** 経過割合 (0=開始直後 〜 1=終了)。 */
  ratio: number;
  /** running中かどうか。trueのときオレンジ系のグローを揺らす (mockのtimer-glow-active相当)。 */
  active?: boolean;
  children?: ReactNode;
};

export function CircularProgress({ ratio, active = false, children }: CircularProgressProps) {
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

  const shouldGlow = active && !shouldReduceMotion;

  return (
    <motion.div
      className="relative flex items-center justify-center"
      style={{ width: SIZE, height: SIZE }}
      animate={{ filter: shouldGlow ? GLOW_KEYFRAMES : STATIC_GLOW }}
      transition={shouldGlow ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
    >
      <svg width={SIZE} height={SIZE} className="-rotate-90">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          className="fill-none stroke-white/5"
        />
        <motion.circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          style={{ strokeDashoffset }}
          className="fill-none stroke-orange-500"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </motion.div>
  );
}
