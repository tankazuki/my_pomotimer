"use client";

import { Download, Pause, Play, RotateCcw } from "lucide-react";

import { AnimatedTime } from "@/components/minimal/animated-time";
import { CircularProgress } from "@/components/minimal/circular-progress";
import { MinimalTaskList } from "@/components/minimal/minimal-task-list";
import { Button } from "@/components/ui/button";
import { useTasks } from "@/hooks/use-tasks";
import { computeRemainingMs, useTimerState, useTimerTick } from "@/hooks/use-timer";
import { downloadExport } from "@/lib/api";
import { progressRatio, SESSION_TYPE_LABEL_JA } from "@/lib/timer";

export function MinimalView() {
  const timer = useTimerState();
  const { now } = useTimerTick();
  const { tasks, isLoading, addTask, editTask, removeTask } = useTasks();

  const remainingMs = computeRemainingMs({
    phase: timer.phase,
    endsAt: timer.endsAt,
    remainingMsSnapshot: timer.remainingMsSnapshot,
    now,
  });
  const ratio = progressRatio(remainingMs, timer.totalMs);
  const activeTask = tasks.find((task) => task.id === timer.activeTaskId) ?? null;

  return (
    <div className="flex w-full flex-col items-center gap-6 px-4 py-10">
      <p className="text-sm font-medium text-muted-foreground">
        {SESSION_TYPE_LABEL_JA[timer.sessionType]}
        {activeTask && timer.sessionType === "WORK" ? ` ・ ${activeTask.title}` : ""}
      </p>

      <CircularProgress ratio={ratio}>
        <AnimatedTime remainingMs={remainingMs} />
      </CircularProgress>

      <div className="flex items-center gap-3">
        {timer.phase === "running" ? (
          <Button type="button" size="icon-lg" onClick={timer.pause} aria-label="一時停止">
            <Pause />
          </Button>
        ) : (
          <Button type="button" size="icon-lg" onClick={timer.start} aria-label="開始">
            <Play />
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          onClick={timer.reset}
          disabled={timer.phase === "idle"}
          aria-label="リセット"
        >
          <RotateCcw />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-lg"
          onClick={() => void downloadExport()}
          aria-label="エクスポート"
        >
          <Download />
        </Button>
      </div>

      <MinimalTaskList
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
        onSelect={(taskId) => timer.switchTask(taskId)}
      />
    </div>
  );
}
