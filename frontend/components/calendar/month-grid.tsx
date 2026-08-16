"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useMemo } from "react";

import type { DailyStat } from "@/lib/api";
import { formatDateYYYYMMDD, getMonthDates } from "@/lib/date";
import { cn } from "@/lib/utils";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"];

type IntensityLevel = 0 | 1 | 2 | 3 | 4;

const RPG_INTENSITY_CLASS: Record<IntensityLevel, string> = {
  0: "bg-black",
  1: "bg-yellow-400/10",
  2: "bg-yellow-400/25",
  3: "bg-yellow-400/40",
  4: "bg-yellow-400/60",
};

const MINIMAL_INTENSITY_CLASS: Record<IntensityLevel, string> = {
  0: "bg-white/[0.02]",
  1: "bg-orange-500/10",
  2: "bg-orange-500/20",
  3: "bg-orange-500/35",
  4: "bg-orange-500/50",
};

function intensityLevel(minutes: number, maxMinutes: number): IntensityLevel {
  if (minutes <= 0 || maxMinutes <= 0) return 0;
  const ratio = minutes / maxMinutes;
  if (ratio > 0.75) return 4;
  if (ratio > 0.5) return 3;
  if (ratio > 0.25) return 2;
  return 1;
}

type MonthGridProps = {
  theme: "rpg" | "minimal";
  year: number;
  /** 0始まり月。 */
  month: number;
  statsByDate: Map<string, DailyStat>;
  selectedDate: string;
  todayDate: string;
  /** 月送りの方向 (1=翌月へ, -1=前月へ)。スライド演出の向きに使う。 */
  direction: 1 | -1;
  onSelectDate: (dateStr: string) => void;
};

export function MonthGrid({
  theme,
  year,
  month,
  statsByDate,
  selectedDate,
  todayDate,
  direction,
  onSelectDate,
}: MonthGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const isRpg = theme === "rpg";
  const monthKey = `${year}-${String(month + 1).padStart(2, "0")}`;

  const dates = useMemo(() => getMonthDates(year, month), [year, month]);
  const maxMinutes = useMemo(() => {
    let max = 0;
    for (const stat of statsByDate.values()) {
      if (stat.work_minutes > max) max = stat.work_minutes;
    }
    return max;
  }, [statsByDate]);

  const variants = {
    enter: (dir: 1 | -1) =>
      prefersReducedMotion ? { opacity: 0 } : { x: dir > 0 ? 32 : -32, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: (dir: 1 | -1) =>
      prefersReducedMotion ? { opacity: 0 } : { x: dir > 0 ? -32 : 32, opacity: 0 },
  };

  return (
    <div className="w-full">
      <div className="mb-2 grid grid-cols-7 gap-1 text-center text-xs font-semibold text-gray-400">
        {WEEKDAY_LABELS.map((label) => (
          <div key={label}>{label}</div>
        ))}
      </div>
      <AnimatePresence mode="wait" custom={direction} initial={false}>
        <motion.div
          key={monthKey}
          custom={direction}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: prefersReducedMotion ? 0.12 : 0.25, ease: "easeOut" }}
          className="grid grid-cols-7 gap-1"
        >
          {dates.map((date) => {
            const dateStr = formatDateYYYYMMDD(date);
            const stat = statsByDate.get(dateStr);
            const inMonth = date.getMonth() === month;
            const isSelected = dateStr === selectedDate;
            const isToday = dateStr === todayDate;
            const level = intensityLevel(stat?.work_minutes ?? 0, maxMinutes);
            const hasDue = (stat?.due_task_count ?? 0) > 0;

            return (
              <button
                key={dateStr}
                type="button"
                onClick={() => onSelectDate(dateStr)}
                aria-current={isToday ? "date" : undefined}
                aria-pressed={isSelected}
                title={stat ? `作業 ${stat.work_minutes}分${hasDue ? ` / 締切 ${stat.due_task_count}件` : ""}` : undefined}
                className={cn(
                  "relative flex aspect-square flex-col items-center justify-center gap-0.5 rounded-md text-xs transition-colors",
                  isRpg ? RPG_INTENSITY_CLASS[level] : MINIMAL_INTENSITY_CLASS[level],
                  isRpg
                    ? "border border-white/20 text-white hover:border-white"
                    : "border border-white/5 text-gray-200 hover:border-white/20",
                  !inMonth && "opacity-30",
                  isSelected &&
                    (isRpg
                      ? "border-2 border-yellow-300"
                      : "border-orange-400/70 ring-1 ring-orange-400/60"),
                  isToday && !isSelected && (isRpg ? "border-white" : "border-white/40"),
                )}
              >
                <span
                  className={cn(
                    "font-semibold",
                    isToday && (isRpg ? "text-yellow-300" : "text-orange-300"),
                  )}
                >
                  {date.getDate()}
                </span>
                {hasDue && (
                  <span
                    aria-hidden="true"
                    className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-red-400"
                  />
                )}
              </button>
            );
          })}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
