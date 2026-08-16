"use client";

import { motion, useReducedMotion, type Variants } from "framer-motion";
import type { KeyboardEvent } from "react";

import type { DailyStat } from "@/lib/api";
import { formatMinutesJa } from "@/lib/format-minutes";
import { cn } from "@/lib/utils";

const CHART_HEIGHT = 140;
const CHART_TOP_PADDING = 8;
const LABEL_HEIGHT = 18;
const SLOT_WIDTH = 20;
const BAR_WIDTH_RATIO = 0.6;
/** 全日0分でもグラフが潰れて見えないようにするための最低スケール。 */
const MIN_SCALE_MINUTES = 60;

type DailyBarChartProps = {
  days: DailyStat[];
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  isRpg: boolean;
};

function shortLabel(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}/${Number(day)}`;
}

/** 日別の作業時間 (分) を表す手書きSVG棒グラフ。チャートライブラリは使わない。 */
export function DailyBarChart({ days, selectedDate, onSelectDate, isRpg }: DailyBarChartProps) {
  const shouldReduceMotion = useReducedMotion();
  const maxMinutes = Math.max(MIN_SCALE_MINUTES, ...days.map((day) => day.work_minutes));
  const labelInterval = days.length > 31 ? 7 : days.length > 14 ? 2 : 1;
  const viewBoxWidth = days.length * SLOT_WIDTH;
  const viewBoxHeight = CHART_TOP_PADDING + CHART_HEIGHT + LABEL_HEIGHT;

  const containerVariants: Variants = {
    hidden: {},
    visible: { transition: shouldReduceMotion ? {} : { staggerChildren: 0.015 } },
  };
  const barVariants: Variants = {
    hidden: { scaleY: shouldReduceMotion ? 1 : 0 },
    visible: {
      scaleY: 1,
      transition: { duration: shouldReduceMotion ? 0 : 0.35, ease: "easeOut" },
    },
  };

  function handleKeyDown(event: KeyboardEvent<SVGRectElement>, date: string): void {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onSelectDate(date);
    }
  }

  return (
    <svg
      viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
      className="h-40 w-full sm:h-48"
      preserveAspectRatio="none"
      role="img"
      aria-label="日別の作業時間の棒グラフ"
    >
      <motion.g initial="hidden" animate="visible" variants={containerVariants}>
        {days.map((day, index) => {
          const barHeight =
            day.work_minutes <= 0 ? 0 : Math.max((day.work_minutes / maxMinutes) * CHART_HEIGHT, 2);
          const slotX = index * SLOT_WIDTH;
          const barWidth = SLOT_WIDTH * BAR_WIDTH_RATIO;
          const barX = slotX + (SLOT_WIDTH - barWidth) / 2;
          const barY = CHART_TOP_PADDING + CHART_HEIGHT - barHeight;
          const isSelected = day.date === selectedDate;

          return (
            <g key={day.date}>
              {/* クリック/タップ判定用の領域 (0分の日でも選択できるよう帯全体を対象にする)。 */}
              <rect
                x={slotX}
                y={CHART_TOP_PADDING}
                width={SLOT_WIDTH}
                height={CHART_HEIGHT}
                role="button"
                tabIndex={0}
                aria-pressed={isSelected}
                aria-label={`${day.date} ${formatMinutesJa(day.work_minutes)}`}
                onClick={() => onSelectDate(day.date)}
                onKeyDown={(event) => handleKeyDown(event, day.date)}
                className={cn(
                  "cursor-pointer outline-none transition-colors",
                  isSelected
                    ? isRpg
                      ? "fill-yellow-400/15"
                      : "fill-orange-400/10"
                    : "fill-transparent hover:fill-white/5",
                )}
              />
              <motion.rect
                x={barX}
                width={barWidth}
                y={barY}
                height={Math.max(barHeight, 1)}
                variants={barVariants}
                className={cn(
                  "pointer-events-none origin-bottom",
                  isSelected
                    ? isRpg
                      ? "fill-yellow-400"
                      : "fill-orange-400"
                    : isRpg
                      ? "fill-white/80"
                      : "fill-orange-500/60",
                )}
              />
              {index % labelInterval === 0 && (
                <text
                  x={slotX + SLOT_WIDTH / 2}
                  y={viewBoxHeight - 4}
                  textAnchor="middle"
                  fontSize={6}
                  className={cn("pointer-events-none", isRpg ? "fill-gray-300" : "fill-gray-500")}
                >
                  {shortLabel(day.date)}
                </text>
              )}
            </g>
          );
        })}
      </motion.g>
    </svg>
  );
}
