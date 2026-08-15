"use client";

import { useMemo } from "react";

import { CommandWindow } from "@/components/rpg/command-window";
import { MessageWindow } from "@/components/rpg/message-window";
import { RPGTaskList } from "@/components/rpg/rpg-task-list";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { computeRemainingMs, useTimerState, useTimerTick } from "@/hooks/use-timer";
import { downloadExport } from "@/lib/api";
import { formatRemaining, SESSION_TYPE_LABEL_JA } from "@/lib/timer";

export function RPGView() {
  const timer = useTimerState();
  const { now } = useTimerTick();
  const { tasks, isLoading, addTask, editTask, removeTask } = useTasks();

  const remainingMs = computeRemainingMs({
    phase: timer.phase,
    endsAt: timer.endsAt,
    remainingMsSnapshot: timer.remainingMsSnapshot,
    now,
  });

  const activeTask = tasks.find((task) => task.id === timer.activeTaskId) ?? null;

  const message = useMemo(() => {
    if (timer.phase === "running") {
      return timer.sessionType === "WORK"
        ? `${activeTask ? activeTask.title : "しごと"} に ちゅうしんしている...`
        : `${SESSION_TYPE_LABEL_JA[timer.sessionType]}中...`;
    }
    if (timer.phase === "paused") {
      return "いちじ ていしちゅう...「たたかう」で さいかいできる。";
    }
    return timer.sessionType === "WORK"
      ? "「たたかう」で しゅうちゅうを はじめよう。"
      : `「たたかう」で ${SESSION_TYPE_LABEL_JA[timer.sessionType]}に はいろう。`;
  }, [timer.phase, timer.sessionType, activeTask]);

  return (
    <div className="font-dotgothic flex w-full flex-col items-center gap-4 bg-black px-4 py-10 text-white">
      <p className="text-sm text-white/70">{SESSION_TYPE_LABEL_JA[timer.sessionType]}</p>
      <p className="text-6xl tabular-nums">{formatRemaining(remainingMs)}</p>

      <MessageWindow message={message} />

      <CommandWindow
        canStart={timer.phase !== "running"}
        canFlee={timer.phase !== "idle"}
        tasks={tasks}
        activeTaskId={timer.activeTaskId}
        onStart={timer.start}
        onFlee={timer.reset}
        onSelectTask={timer.switchTask}
      />

      <RPGTaskList
        tasks={tasks}
        isLoading={isLoading}
        activeTaskId={timer.activeTaskId}
        onAdd={(title, estimatedPomodoros) => {
          void addTask({ title, estimated_pomodoros: estimatedPomodoros });
        }}
        onToggleCompleted={(taskId, isCompleted) => {
          void editTask(taskId, { is_completed: isCompleted });
        }}
        onDelete={(taskId) => {
          void removeTask(taskId);
        }}
      />

      <Button
        type="button"
        variant="outline"
        className="border-white text-white hover:bg-white hover:text-black"
        onClick={() => void downloadExport()}
      >
        きろくを もちだす (JSON)
      </Button>
    </div>
  );
}
