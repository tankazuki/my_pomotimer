"use client";

import { useState, type FormEvent } from "react";

import { Checkbox } from "@/components/ui/checkbox";
import { DueDateField } from "@/components/shared/due-date-field";
import { TagChips } from "@/components/shared/tag-chips";
import { TagInput } from "@/components/shared/tag-input";
import { playClickSound } from "@/lib/sound";
import { DQ_BOX, DQ_BOX_SM } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";
import type { TaskRead } from "@/lib/api";

type RPGTaskListProps = {
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

export function RPGTaskList({
  tasks,
  isLoading,
  activeTaskId,
  onAdd,
  onToggleCompleted,
  onDelete,
  onSelect,
}: RPGTaskListProps) {
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
    <div className={`${DQ_BOX} flex h-full flex-col p-4 text-white`}>
      <div className="mb-4 flex items-center justify-between border-b-2 border-white pb-2">
        <span className="text-lg text-yellow-300">クエスト (たすく)</span>
      </div>

      <form onSubmit={handleSubmit} className="mb-4 flex flex-col gap-2">
        <input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="あたらしい クエスト"
          className={`${DQ_BOX_SM} p-2 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-yellow-300`}
        />
        <div className="flex flex-wrap items-center gap-2">
          <label className="whitespace-nowrap text-xs text-gray-400">{"よそう 🍅:"}</label>
          <input
            type="number"
            min={1}
            max={99}
            value={estimatedPomodoros}
            onChange={(event) => setEstimatedPomodoros(Number(event.target.value) || 1)}
            className={`${DQ_BOX_SM} w-16 p-1 text-center text-sm text-white focus:outline-none`}
          />
          <DueDateField value={dueDate} onChange={setDueDate} variant="rpg" />
        </div>
        <TagInput value={tags} onChange={setTags} variant="rpg" placeholder="タグ (にんい)" />
        <button
          type="submit"
          className={`${DQ_BOX_SM} bg-white px-3 py-1 text-sm font-bold text-black hover:bg-yellow-300`}
        >
          {"＋ ついか"}
        </button>
      </form>

      {isLoading ? (
        <p className="text-sm text-white/70">よみこみちゅう...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-white/70">クエストが ありません。</p>
      ) : (
        <ul className="flex-grow space-y-2 overflow-y-auto pr-1">
          {tasks.map((task) => {
            const isActive = task.id === activeTaskId;
            return (
              <li
                key={task.id}
                className={cn(
                  DQ_BOX_SM,
                  "p-2 text-xs",
                  isActive ? "bg-white text-black" : "text-white",
                )}
              >
                <div className="mb-1 flex items-start justify-between gap-1">
                  <div className="flex min-w-0 flex-1 items-center gap-1.5">
                    <Checkbox
                      checked={task.is_completed}
                      onCheckedChange={(checked) => onToggleCompleted(task.id, checked)}
                    />
                    <button
                      type="button"
                      onClick={() => onSelect(task.id)}
                      className={cn(
                        "flex min-w-0 flex-1 items-center gap-1 text-left",
                        task.is_completed && "line-through opacity-60",
                      )}
                    >
                      <span>{isActive ? "▶" : "・"}</span>
                      <span className="truncate">{task.title}</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => onDelete(task.id)}
                    aria-label={`${task.title} を削除`}
                    className="px-1 text-red-400 hover:text-red-600"
                  >
                    {"✕"}
                  </button>
                </div>
                <div
                  className={cn(
                    "flex items-center justify-between text-[10px]",
                    isActive ? "text-gray-800" : "text-gray-400",
                  )}
                >
                  <span>
                    {"進捗: "}
                    {task.completed_pomodoros}/{task.estimated_pomodoros}
                  </span>
                  <span>
                    {"🍅".repeat(task.completed_pomodoros)}
                    {"⚪".repeat(Math.max(0, task.estimated_pomodoros - task.completed_pomodoros))}
                  </span>
                </div>
                {(task.due_date || (task.tags ?? []).length > 0) && (
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    {task.due_date && (
                      <span
                        className={cn(
                          "border px-1.5 py-0.5 text-[10px] font-bold",
                          isOverdue(task.due_date, task.is_completed)
                            ? "border-red-400 text-red-400"
                            : isActive
                              ? "border-black/40 text-gray-800"
                              : "border-white/40 text-gray-300",
                        )}
                      >
                        {`⏰${task.due_date}`}
                      </span>
                    )}
                    <TagChips tags={(task.tags ?? []).map((tag) => tag.name)} variant="rpg" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
