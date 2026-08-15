"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { TaskRead } from "@/lib/api";
import { cn } from "@/lib/utils";

type MinimalTaskListProps = {
  tasks: TaskRead[];
  isLoading: boolean;
  activeTaskId: string | null;
  onAdd: (title: string, estimatedPomodoros: number) => void;
  onToggleCompleted: (taskId: string, isCompleted: boolean) => void;
  onDelete: (taskId: string) => void;
  onSelect: (taskId: string) => void;
};

export function MinimalTaskList({
  tasks,
  isLoading,
  activeTaskId,
  onAdd,
  onToggleCompleted,
  onDelete,
  onSelect,
}: MinimalTaskListProps) {
  const shouldReduceMotion = useReducedMotion();
  const [title, setTitle] = useState("");
  const [estimatedPomodoros, setEstimatedPomodoros] = useState(1);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd(trimmed, estimatedPomodoros);
    setTitle("");
    setEstimatedPomodoros(1);
  }

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-4 shadow-sm">
      <form onSubmit={handleSubmit} className="mb-3 flex gap-2">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="新しいタスク"
        />
        <Input
          type="number"
          min={1}
          max={99}
          value={estimatedPomodoros}
          onChange={(event) => setEstimatedPomodoros(Number(event.target.value) || 1)}
          className="w-16"
        />
        <Button type="submit">追加</Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">読み込み中...</p>
      ) : (
        <ul className="space-y-1.5">
          <AnimatePresence initial={false}>
            {tasks.map((task) => (
              <motion.li
                key={task.id}
                layout
                initial={shouldReduceMotion ? false : { opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                transition={{ duration: shouldReduceMotion ? 0 : 0.2 }}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-2 py-1.5",
                  task.id === activeTaskId && "bg-accent",
                )}
              >
                <Checkbox
                  checked={task.is_completed}
                  onCheckedChange={(checked) => onToggleCompleted(task.id, checked)}
                />
                <button
                  type="button"
                  onClick={() => onSelect(task.id)}
                  className={cn(
                    "flex-1 truncate text-left text-sm",
                    task.is_completed && "text-muted-foreground line-through",
                  )}
                >
                  {task.title}
                </button>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {task.completed_pomodoros}/{task.estimated_pomodoros}
                </span>
                <button
                  type="button"
                  onClick={() => onDelete(task.id)}
                  aria-label={`${task.title} を削除`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  {"×"}
                </button>
              </motion.li>
            ))}
          </AnimatePresence>
          {tasks.length === 0 && <p className="text-sm text-muted-foreground">タスクがありません。</p>}
        </ul>
      )}
    </div>
  );
}
