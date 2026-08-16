"use client";

import { useMemo } from "react";

import { CommandWindow } from "@/components/rpg/command-window";
import { MessageWindow } from "@/components/rpg/message-window";
import { RPGTaskList } from "@/components/rpg/rpg-task-list";
import { StatusWindow } from "@/components/rpg/status-window";
import { useTasks } from "@/hooks/use-tasks";
import { useTodayPomodoroCount } from "@/hooks/use-today-pomodoro-count";
import { computeRemainingMs, useTimerState, useTimerTick } from "@/hooks/use-timer";
import { playClickSound } from "@/lib/sound";
import { DQ_BOX, DQ_BOX_SM } from "@/lib/style-tokens";
import {
  computeTimerMessage,
  formatRemaining,
  SESSION_DURATION_MINUTES,
  type SessionType,
} from "@/lib/timer";
import { cn } from "@/lib/utils";

const SESSION_TYPE_OPTIONS: { type: SessionType; label: string }[] = [
  { type: "WORK", label: `さぎょう (${SESSION_DURATION_MINUTES.WORK}ふん)` },
  { type: "SHORT_BREAK", label: `きゅうけい (${SESSION_DURATION_MINUTES.SHORT_BREAK}ふん)` },
  { type: "LONG_BREAK", label: `ちょうきゅうけい (${SESSION_DURATION_MINUTES.LONG_BREAK}ふん)` },
];

export function RPGView() {
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

  const activeTask = tasks.find((task) => task.id === timer.activeTaskId) ?? null;
  const totalCount = tasks.reduce((sum, task) => sum + task.completed_pomodoros, 0);
  const level = Math.floor(totalCount / 4) + 1;

  const message = useMemo(
    () => computeTimerMessage(timer.phase, timer.sessionType, activeTask?.title ?? null),
    [timer.phase, timer.sessionType, activeTask],
  );

  const isModeSelectDisabled = timer.phase !== "idle";

  return (
    <div className="font-dotgothic grid w-full max-w-5xl grid-cols-1 items-start gap-6 px-4 py-6 text-white lg:grid-cols-12">
      <section className="flex flex-col gap-6 lg:col-span-4">
        <StatusWindow level={level} todayCount={todayCount} totalCount={totalCount} />
        <MessageWindow message={message} />
      </section>

      <section className="flex flex-col gap-6 lg:col-span-5">
        <div className={`${DQ_BOX} flex flex-col items-center gap-6 p-6 text-center`}>
          <div className="flex flex-wrap justify-center gap-2 text-sm">
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
                  DQ_BOX_SM,
                  "px-3 py-1 disabled:pointer-events-none disabled:opacity-50",
                  timer.sessionType === option.type
                    ? "bg-white font-bold text-black"
                    : "text-gray-300",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className={`${DQ_BOX} w-full p-6`}>
            <p className="text-6xl font-bold tracking-widest text-white tabular-nums md:text-7xl">
              {formatRemaining(remainingMs)}
            </p>
            <p className="mt-4 truncate text-sm text-yellow-300">
              {activeTask ? `選択中: ${activeTask.title}` : "選択中: たすくが えらばれていません"}
            </p>
          </div>

          <CommandWindow
            canStart={timer.phase !== "running"}
            canPause={timer.phase === "running"}
            canFlee={timer.phase !== "idle"}
            onStart={timer.start}
            onPause={timer.pause}
            onFlee={timer.reset}
            onSkip={timer.skip}
          />
        </div>
      </section>

      <section className="flex flex-col gap-6 lg:col-span-3">
        <RPGTaskList
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
      </section>
    </div>
  );
}
