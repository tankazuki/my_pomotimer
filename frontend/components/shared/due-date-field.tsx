"use client";

import { DQ_BOX_SM } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

type DueDateFieldProps = {
  value: string | null;
  onChange: (value: string | null) => void;
  variant?: "rpg" | "minimal";
  label?: string;
  className?: string;
};

/** <input type="date"> のラッパー。空文字はnullとして扱う。 */
export function DueDateField({
  value,
  onChange,
  variant = "minimal",
  label = "きげん",
  className,
}: DueDateFieldProps) {
  const isRpg = variant === "rpg";

  return (
    <label className={cn("flex items-center gap-2 text-xs text-gray-400", className)}>
      <span className="whitespace-nowrap">{label}</span>
      <input
        type="date"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? null : event.target.value)}
        className={cn(
          "text-xs text-white [color-scheme:dark] focus:outline-none",
          isRpg ? cn(DQ_BOX_SM, "px-2 py-1") : "rounded-xl border border-white/10 bg-white/5 px-2 py-1.5",
        )}
      />
    </label>
  );
}
