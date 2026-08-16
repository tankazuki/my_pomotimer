"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import { cn } from "@/lib/utils";

type TagChipsProps = {
  tags: string[];
  onRemove?: (tag: string) => void;
  variant?: "rpg" | "minimal";
  className?: string;
};

/** 選択済みタグをチップ表示する。onRemove指定時は×ボタンで削除できる。 */
export function TagChips({ tags, onRemove, variant = "minimal", className }: TagChipsProps) {
  const shouldReduceMotion = useReducedMotion();
  const isRpg = variant === "rpg";

  if (tags.length === 0) return null;

  return (
    <ul className={cn("flex flex-wrap items-center gap-1.5", className)}>
      <AnimatePresence initial={false}>
        {tags.map((tag) => (
          <motion.li
            key={tag}
            layout
            initial={shouldReduceMotion ? false : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9 }}
            transition={{ duration: shouldReduceMotion ? 0 : 0.15 }}
            className={cn(
              "flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium",
              isRpg
                ? "border border-white/60 bg-black text-yellow-300"
                : "border border-white/10 bg-white/10 text-gray-200",
            )}
          >
            <span className="max-w-[8rem] truncate">{`#${tag}`}</span>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(tag)}
                aria-label={`タグ ${tag} を削除`}
                className={cn(
                  "leading-none transition-colors",
                  isRpg ? "text-yellow-300/70 hover:text-red-400" : "text-gray-400 hover:text-red-400",
                )}
              >
                {"×"}
              </button>
            )}
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
