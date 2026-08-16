"use client";

import { Pause, Play, RotateCcw, SkipForward } from "lucide-react";
import { useMemo } from "react";

import { AnimatedTime } from "@/components/minimal/animated-time";
import { CircularProgress } from "@/components/minimal/circular-progress";
import { MinimalTaskList } from "@/components/minimal/minimal-task-list";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { useTodayPomodoroCount } from "@/hooks/use-today-pomodoro-count";
import { computeRemainingMs, useTimerState, useTimerTick } from "@/hooks/use-timer";
import { playClickSound } from "@/lib/sound";
import { GLASS_CARD } from "@/lib/style-tokens";
import {
  computeTimerMessage,
  progressRatio,
  SESSION_DURATION_MINUTES,
  SESSION_TYPE_LABEL_JA,
  type SessionType,
} from "@/lib/timer";
import { cn } from "@/lib/utils";

const SESSION_TYPE_OPTIONS: { type: SessionType; label: string }[] = [
  { type: "WORK", label: `しゅうちゅう (${SESSION_DURATION_MINUTES.WORK}ふん)` },
  { type: "SHORT_BREAK", label: `きゅうけい (${SESSION_DURATION_MINUTES.SHORT_BREAK}ふん)` },
  { type: "LONG_BREAK", label: `ながいきゅうけい (${SESSION_DURATION_MINUTES.LONG_BREAK}ふん)` },
];

export function MinimalView() {
  const timer = useTimerState();
  const { now } = useTimerTick();
  const { tasks, isLoading, addTask, editTask, removeTask } = useTasks();
  const todayCount = useTodayPomodoroCount();

  const remainingMs = computeRemainingMs({
    phase: timer.phase,
    endsAt: timer.endsAt,
    remainingMsSnapshot: timer.remainingMsSnapshot,
    now,
  });
  const ratio = progressRatio(remainingMs, timer.totalMs);
  const activeTask = tasks.find((task) => task.id === timer.activeTaskId) ?? null;
  const totalCount = tasks.reduce((sum, task) => sum + task.completed_pomodoros, 0);
  const level = Math.floor(totalCount / 4) + 1;

  const message = useMemo(
    () => computeTimerMessage(timer.phase, timer.sessionType, activeTask?.title ?? null),
    [timer.phase, timer.sessionType, activeTask],
  );

  const isModeSelectDisabled = timer.phase !== "idle";

  function handleStart(): void {
    playClickSound();
    timer.start();
  }

  function handlePause(): void {
    playClickSound();
    timer.pause();
  }

  function handleReset(): void {
    playClickSound();
    timer.reset();
  }

  function handleSkip(): void {
    playClickSound();
    timer.skip();
  }

  return (
    <div className="grid w-full max-w-5xl grid-cols-1 items-start gap-8 px-4 py-6 lg:grid-cols-12">
      <section className="flex flex-col gap-6 lg:col-span-4">
        <div className={cn(GLASS_CARD, "relative flex flex-col justify-between gap-6 overflow-hidden p-6")}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -top-8 -right-8 h-32 w-32 rounded-full bg-orange-500/10 blur-2xl"
          />

          <div>
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold tracking-widest text-orange-400 uppercase">
                フォーカス中のタスク
              </span>
            </div>

            <div>
              <h2 className="truncate text-xl font-bold tracking-tight text-white">
                {activeTask ? activeTask.title : "タスクを選択してください"}
              </h2>
              <p className="mt-1 flex items-center gap-2 text-xs text-gray-400">
                <span>
                  {"Lv."}
                  <span className="font-bold text-orange-400">{level}</span>
                  {" フォーカスヒーロー"}
                </span>
                <span>{"・"}</span>
                <span className="flex items-center gap-1 text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
                  {"アクティブ"}
                </span>
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all duration-300">
            <div className="mb-1 text-[10px] font-bold tracking-widest text-gray-400 uppercase">
              ステータス通知
            </div>
            <div className="flex min-h-[40px] items-center text-sm font-medium text-gray-200">
              {message}
            </div>
          </div>
        </div>

        <div className={cn(GLASS_CARD, "flex h-full flex-col p-6")}>
          <MinimalTaskList
            tasks={tasks}
            isLoading={isLoading}
            activeTaskId={timer.activeTaskId}
            onAdd={(title, estimatedPomodoros, dueDate, tags) => {
              void addTask({
                title,
                estimated_pomodoros: estimatedPomodoros,
                due_date: dueDate,
                tags,
              });
            }}
            onToggleCompleted={(taskId, isCompleted) => {
              void editTask(taskId, { is_completed: isCompleted });
            }}
            onDelete={(taskId) => {
              void removeTask(taskId);
            }}
            onSelect={(taskId) => {
              playClickSound();
              timer.switchTask(taskId);
            }}
          />
        </div>
      </section>

      <section className="flex flex-col gap-6 lg:col-span-8">
        <div className={cn(GLASS_CARD, "relative flex min-h-[480px] flex-col items-center justify-center gap-8 p-8")}>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute h-80 w-80 rounded-full bg-orange-500/10 blur-3xl"
          />

          <div className="z-10 flex flex-wrap justify-center gap-1.5 rounded-2xl border border-white/10 bg-white/5 p-1.5">
            {SESSION_TYPE_OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                disabled={isModeSelectDisabled}
                onClick={() => {
                  playClickSound();
                  timer.setSessionType(option.type);
                }}
                className={cn(
                  "rounded-xl px-5 py-2 text-xs font-semibold transition-all duration-300 disabled:pointer-events-none disabled:opacity-50",
                  timer.sessionType === option.type
                    ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                    : "text-gray-400 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="z-10 my-2 flex flex-col items-center gap-2">
            <CircularProgress ratio={ratio} active={timer.phase === "running"}>
              <AnimatedTime remainingMs={remainingMs} />
            </CircularProgress>
            <span className="text-xs font-semibold tracking-widest text-orange-400 uppercase">
              {SESSION_TYPE_LABEL_JA[timer.sessionType]}
              {activeTask && timer.sessionType === "WORK" ? ` ・ ${activeTask.title}` : ""}
            </span>
          </div>

          <div className="z-10 mt-2 flex flex-wrap items-center justify-center gap-4">
            {timer.phase === "running" ? (
              <Button
                type="button"
                size="lg"
                onClick={handlePause}
                aria-label="一時停止"
                className="gap-2 h-auto rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 hover:shadow-orange-500/40"
              >
                <Pause />
                いちじていし
              </Button>
            ) : (
              <Button
                type="button"
                size="lg"
                onClick={handleStart}
                aria-label="開始"
                className="gap-2 h-auto rounded-2xl bg-gradient-to-r from-orange-500 to-amber-500 px-8 py-4 text-sm font-bold text-white shadow-xl shadow-orange-500/20 hover:from-orange-400 hover:to-amber-400 hover:shadow-orange-500/40"
              >
                <Play />
                かいし
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleReset}
              disabled={timer.phase === "idle"}
              aria-label="リセット"
              className="gap-2 h-auto rounded-2xl border-white/10 bg-white/5 px-6 py-4 text-sm font-medium text-gray-300 hover:bg-white/10 hover:text-white"
            >
              <RotateCcw />
              リセット
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="lg"
              onClick={handleSkip}
              aria-label="スキップ"
              className="gap-2 h-auto rounded-2xl px-6 py-4 text-sm font-medium text-gray-400 hover:bg-white/10 hover:text-white"
            >
              <SkipForward />
              スキップ
            </Button>
          </div>

          <div className="z-10 mt-6 grid w-full grid-cols-2 gap-4 border-t border-white/5 pt-6 md:grid-cols-3">
            <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-center">
              <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                きょうのポモドーロ
              </div>
              <div className="mt-1 text-xl font-bold text-orange-400">
                {"🍅 x "}
                {todayCount}
              </div>
            </div>
            <div className="rounded-xl border border-white/5 bg-white/5 p-3.5 text-center">
              <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                るいけいかんりょう
              </div>
              <div className="mt-1 text-xl font-bold text-white">{totalCount}</div>
            </div>
            <div className="col-span-2 rounded-xl border border-white/5 bg-white/5 p-3.5 text-center md:col-span-1">
              <div className="text-[10px] font-bold tracking-wider text-gray-400 uppercase">
                フォーカスランク
              </div>
              <div className="mt-1 text-xl font-bold text-emerald-400">
                {"Lv. "}
                {level}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
