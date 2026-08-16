"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

import type {
  DailyTaskBreakdown,
  DayDetailResponse,
  DaySessionRead,
  SessionType,
  TaskRead,
} from "@/lib/api";
import { DQ_BOX, DQ_BOX_SM, GLASS_CARD } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  WORK: "作業",
  SHORT_BREAK: "小休憩",
  LONG_BREAK: "長休憩",
};

const DATE_HEADER_FORMATTER = new Intl.DateTimeFormat("ja-JP", {
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "short",
});

const TIME_FORMATTER = new Intl.DateTimeFormat("ja-JP", { hour: "2-digit", minute: "2-digit" });

function formatTimeRange(startedAt: string, endedAt: string): string {
  return `${TIME_FORMATTER.format(new Date(startedAt))} - ${TIME_FORMATTER.format(new Date(endedAt))}`;
}

/** "YYYY-MM-DD" をローカルタイムゾーンのDateとして解釈する (UTC変換によるずれを防ぐ)。 */
function parseDateStrAsLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

type DayDetailPanelProps = {
  theme: "rpg" | "minimal";
  dateStr: string;
  data: DayDetailResponse | null;
  isLoading: boolean;
  error: string | null;
};

export function DayDetailPanel({ theme, dateStr, data, isLoading, error }: DayDetailPanelProps) {
  const prefersReducedMotion = useReducedMotion();
  const isRpg = theme === "rpg";
  const boxClass = isRpg ? DQ_BOX : GLASS_CARD;
  const subBoxClass = isRpg ? DQ_BOX_SM : "rounded-xl border border-white/10 bg-white/5";

  const heading = DATE_HEADER_FORMATTER.format(parseDateStrAsLocalDate(dateStr));

  const isEmpty =
    !isLoading &&
    !error &&
    data !== null &&
    data.sessions.length === 0 &&
    data.worked_tasks.length === 0 &&
    data.due_tasks.length === 0;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={dateStr}
        initial={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={prefersReducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.22, ease: "easeOut" }}
        className={cn(boxClass, "flex flex-col gap-5 p-4 md:p-6")}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-bold text-white">{heading}</h2>
          {data ? (
            <span className="text-xs text-gray-400">
              作業時間合計: <span className="font-semibold text-orange-300">{data.work_minutes}分</span>
            </span>
          ) : null}
        </div>

        {isLoading && <p className="text-sm text-gray-400">読み込み中...</p>}
        {error && <p className="text-sm text-red-400">{error}</p>}
        {isEmpty && <p className="text-sm text-gray-400">この日の記録はありません。</p>}

        {data && data.sessions.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">セッション</h3>
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {data.sessions.map((session) => (
                  <SessionRow key={session.id} session={session} className={subBoxClass} isRpg={isRpg} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        {data && data.worked_tasks.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">
              作業したタスク
            </h3>
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {data.worked_tasks.map((task) => (
                  <TaskBreakdownRow
                    key={task.task_id ?? task.title ?? "untitled"}
                    task={task}
                    className={subBoxClass}
                  />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}

        {data && data.due_tasks.length > 0 && (
          <section className="flex flex-col gap-2">
            <h3 className="text-xs font-semibold tracking-wide text-gray-400 uppercase">締切タスク</h3>
            <ul className="flex flex-col gap-2">
              <AnimatePresence initial={false}>
                {data.due_tasks.map((task) => (
                  <DueTaskRow key={task.id} task={task} className={subBoxClass} />
                ))}
              </AnimatePresence>
            </ul>
          </section>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

function SessionRow({
  session,
  className,
  isRpg,
}: {
  session: DaySessionRead;
  className: string;
  isRpg: boolean;
}) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(className, "flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-sm")}
    >
      <span className="flex items-center gap-2">
        <span
          className={cn(
            "rounded px-1.5 py-0.5 text-[10px] font-semibold",
            session.session_type === "WORK"
              ? isRpg
                ? "bg-yellow-400 text-black"
                : "bg-orange-500/30 text-orange-200"
              : "bg-white/10 text-gray-300",
          )}
        >
          {SESSION_TYPE_LABEL[session.session_type]}
        </span>
        <span className="text-gray-200">{session.task_title ?? "(タスク未設定)"}</span>
      </span>
      <span className="flex items-center gap-2 text-xs text-gray-400">
        {formatTimeRange(session.started_at, session.ended_at)}
        <span className={session.status === "COMPLETED" ? "text-emerald-400" : "text-red-400"}>
          {session.status === "COMPLETED" ? "完了" : "中断"}
        </span>
      </span>
    </motion.li>
  );
}

function TaskBreakdownRow({ task, className }: { task: DailyTaskBreakdown; className: string }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(className, "flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-200")}
    >
      <span className="truncate">{task.title ?? "(タスク未設定)"}</span>
      <span className="text-xs text-gray-400">
        {task.work_minutes}分 / {task.completed_sessions}回
      </span>
    </motion.li>
  );
}

function DueTaskRow({ task, className }: { task: TaskRead; className: string }) {
  return (
    <motion.li
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(className, "flex items-center justify-between gap-2 px-3 py-2 text-sm text-gray-200")}
    >
      <span className="truncate">{task.title}</span>
      <span className={cn("text-xs", task.is_completed ? "text-emerald-400" : "text-yellow-300")}>
        {task.is_completed ? "完了済み" : "未完了"}
      </span>
    </motion.li>
  );
}
