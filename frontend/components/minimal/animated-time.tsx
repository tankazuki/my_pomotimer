"use client";

import { useMotionValue, useReducedMotion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

import { formatRemaining } from "@/lib/timer";

export function AnimatedTime({ remainingMs }: { remainingMs: number }) {
  const shouldReduceMotion = useReducedMotion();
  const target = useMotionValue(remainingMs);
  const smoothed = useSpring(target, { stiffness: 90, damping: 20, mass: 0.4 });
  const formatted = useTransform(shouldReduceMotion ? target : smoothed, (value) =>
    formatRemaining(value),
  );
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    target.set(remainingMs);
  }, [remainingMs, target]);

  useEffect(() => {
    return formatted.on("change", (text) => {
      if (spanRef.current) spanRef.current.textContent = text;
    });
  }, [formatted]);

  return (
    <span ref={spanRef} className="font-mono text-6xl font-bold tabular-nums text-white md:text-7xl">
      {formatRemaining(remainingMs)}
    </span>
  );
}
