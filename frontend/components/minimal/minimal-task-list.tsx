"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useState, type FormEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { DueDateField } from "@/components/shared/due-date-field";
import { TagChips } from "@/components/shared/tag-chips";
import { TagInput } from "@/components/shared/tag-input";
import { playClickSound } from "@/lib/sound";
import { GLASS_BUTTON } from "@/lib/style-tokens";
import type { TaskRead } from "@/lib/api";
import { cn } from "@/lib/utils";

type MinimalTaskListProps = {
  tasks: TaskRead[];
  isLoading: boolean;
  activeTaskId: string | null;
  onAdd: (
    title: string,
    estimatedPomodoros: number,
    dueDate: string | null,
    tags: string[],
  ) => void;
  onToggleCompleted: (taskId: string, isCompleted: boolean) => void;
  onDelete: (taskId: string) => void;
  onSelect: (taskId: string) => void;
};

function isOverdue(dueDate: string | null, isCompleted: boolean): boolean {
  if (!dueDate || isCompleted) return false;
  const todayStr = new Date().toISOString().slice(0, 10);
  return dueDate < todayStr;
}

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
  const [dueDate, setDueDate] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    playClickSound();
    onAdd(trimmed, estimatedPomodoros, dueDate, tags);
    setTitle("");
    setEstimatedPomodoros(1);
    setDueDate(null);
    setTags([]);
  }

  return (
    <div className="flex h-full flex-col">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold tracking-wide text-white">タスク</h3>
        <span className="text-xs text-gray-400">{tasks.length} 件</span>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="新しいタスク"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder-gray-500 transition-all focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5">
            <span className="text-xs text-gray-400">{"よそう 🍅:"}</span>
            <input
              type="number"
              min={1}
              max={99}
              value={estimatedPomodoros}
              onChange={(event) => setEstimatedPomodoros(Number(event.target.value) || 1)}
              className="w-8 bg-transparent text-center text-xs text-white focus:outline-none"
            />
          </div>
          <DueDateField value={dueDate} onChange={setDueDate} variant="minimal" />
        </div>
        <TagInput value={tags} onChange={setTags} variant="minimal" />
        <button
          type="submit"
          className={cn(
            GLASS_BUTTON,
            "px-4 py-2 text-xs font-semibold text-white hover:border-orange-400 hover:bg-orange-500",
          )}
        >
          {"追加"}
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-gray-400">読み込み中...</p>
      ) : (
        <ul className="flex-grow space-y-2.5 overflow-y-auto pr-1">
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
                  "flex flex-col gap-2 rounded-xl border p-3 transition-all duration-200",
                  task.id === activeTaskId
                    ? "border-orange-500/40 bg-orange-500/10 shadow-lg shadow-orange-500/5"
                    : "border-white/5 bg-white/5 hover:border-white/15",
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Checkbox
                      checked={task.is_completed}
                      onCheckedChange={(checked) => onToggleCompleted(task.id, checked)}
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(task.id)}
                      className={cn(
                        "min-w-0 flex-1 truncate text-left text-xs font-medium text-white",
                        task.is_completed && "text-gray-400 line-through",
                      )}
                    >
                      {task.title}
                    </button>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className="text-[10px] tabular-nums text-gray-400">
                      {task.completed_pomodoros}/{task.estimated_pomodoros}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(task.id)}
                      aria-label={`${task.title} を削除`}
                      className="px-1 text-xs text-gray-500 transition-colors hover:text-red-400"
                    >
                      {"×"}
                    </button>
                  </div>
                </div>
                {(task.due_date || (task.tags ?? []).length > 0) && (
                  <div className="flex flex-wrap items-center gap-1.5 pl-7">
                    {task.due_date && (
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          isOverdue(task.due_date, task.is_completed)
                            ? "bg-red-500/20 text-red-300"
                            : "bg-white/10 text-gray-300",
                        )}
                      >
                        {`📅 ${task.due_date}`}
                      </span>
                    )}
                    <TagChips tags={(task.tags ?? []).map((tag) => tag.name)} variant="minimal" />
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
          {tasks.length === 0 && <p className="text-sm text-gray-400">タスクがありません。</p>}
        </ul>
      )}
    </div>
  );
}
