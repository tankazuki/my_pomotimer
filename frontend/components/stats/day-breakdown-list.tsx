"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type { DailyStat } from "@/lib/api";
import { formatMinutesJa } from "@/lib/format-minutes";
import { DQ_BOX_SM, GLASS_CARD } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

type DayBreakdownListProps = {
  day: DailyStat | null;
  isRpg: boolean;
};

function formatDateJa(dateStr: string): string {
  const [, month, day] = dateStr.split("-");
  return `${Number(month)}月${Number(day)}日`;
}

/** 選択された日のタスク別内訳 (タスク名・作業時間・完了セッション数)。 */
export function DayBreakdownList({ day, isRpg }: DayBreakdownListProps) {
  const shouldReduceMotion = useReducedMotion();

  if (!day) {
    return (
      <div className={cn(isRpg ? DQ_BOX_SM : GLASS_CARD, "p-6 text-center text-sm text-gray-400")}>
        グラフの棒をクリックすると、その日の内訳が表示されます。
      </div>
    );
  }

  return (
    <div className={cn(isRpg ? DQ_BOX_SM : GLASS_CARD, "p-5")}>
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <h3 className={cn("text-sm font-bold", isRpg ? "text-yellow-300" : "text-white")}>
          {formatDateJa(day.date)}の内訳
        </h3>
        <span className="text-xs text-gray-400">
          合計 {formatMinutesJa(day.work_minutes)} ・ 完了 {day.completed_work_sessions} 回
        </span>
      </div>

      {day.tasks.length === 0 ? (
        <p className="py-6 text-center text-sm text-gray-400">この日の作業記録はありません。</p>
      ) : (
        <ul className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {day.tasks.map((task, index) => (
              <motion.li
                key={task.task_id ?? `untitled-${index}`}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className={cn(
                  "flex items-center justify-between gap-3 rounded-lg px-3 py-2 text-sm",
                  isRpg
                    ? "border border-white/30 bg-black text-white"
                    : "border border-white/10 bg-white/5 text-gray-100",
                )}
              >
                <span className="min-w-0 flex-1 truncate">{task.title ?? "(タスク未設定)"}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  {formatMinutesJa(task.work_minutes)} ・ {task.completed_sessions}セッション
                </span>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
