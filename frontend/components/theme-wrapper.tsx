"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { MinimalView } from "@/components/minimal/minimal-view";
import { RPGView } from "@/components/rpg/rpg-view";
import { useTheme } from "@/hooks/use-theme";

export function ThemeWrapper() {
  const { theme } = useTheme();
  const shouldReduceMotion = useReducedMotion();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={theme}
        initial={{ opacity: shouldReduceMotion ? 1 : 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: shouldReduceMotion ? 1 : 0 }}
        transition={{ duration: shouldReduceMotion ? 0 : 0.25, ease: "easeInOut" }}
        className="flex w-full flex-1 flex-col items-center"
      >
        {theme === "rpg" ? <RPGView /> : <MinimalView />}
      </motion.div>
    </AnimatePresence>
  );
}
