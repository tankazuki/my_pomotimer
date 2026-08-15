"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import type { TaskRead } from "@/lib/api";

type RPGTaskListProps = {
  tasks: TaskRead[];
  isLoading: boolean;
  activeTaskId: string | null;
  onAdd: (title: string, estimatedPomodoros: number) => void;
  onToggleCompleted: (taskId: string, isCompleted: boolean) => void;
  onDelete: (taskId: string) => void;
};

export function RPGTaskList({
  tasks,
  isLoading,
  activeTaskId,
  onAdd,
  onToggleCompleted,
  onDelete,
}: RPGTaskListProps) {
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
    <div className="w-full max-w-sm border-2 border-white bg-black p-3 text-white">
      <h2 className="mb-2 text-sm">クエストいちらん</h2>

      <form onSubmit={handleSubmit} className="mb-3 flex gap-1.5">
        <Input
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="あたらしい クエスト"
          className="border-white bg-black text-white placeholder:text-white/50"
        />
        <Input
          type="number"
          min={1}
          max={99}
          value={estimatedPomodoros}
          onChange={(event) => setEstimatedPomodoros(Number(event.target.value) || 1)}
          className="w-16 border-white bg-black text-white"
        />
        <Button type="submit" variant="outline" className="border-white text-white hover:bg-white hover:text-black">
          追加
        </Button>
      </form>

      {isLoading ? (
        <p className="text-sm text-white/70">よみこみちゅう...</p>
      ) : tasks.length === 0 ? (
        <p className="text-sm text-white/70">クエストが ありません。</p>
      ) : (
        <ul className="space-y-1">
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center gap-2 px-1 py-0.5 text-sm ${
                task.id === activeTaskId ? "bg-white text-black" : ""
              }`}
            >
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={(checked) => onToggleCompleted(task.id, checked)}
              />
              <span className={`flex-1 ${task.is_completed ? "line-through opacity-60" : ""}`}>
                {task.title}
              </span>
              <span className="tabular-nums">
                {task.completed_pomodoros}/{task.estimated_pomodoros}
              </span>
              <button
                type="button"
                onClick={() => onDelete(task.id)}
                aria-label={`${task.title} を削除`}
                className="opacity-70 hover:opacity-100"
              >
                {"×"}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
