"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import { cn } from "@/lib/utils";
import type { TaskRead } from "@/lib/api";

type Command = "start" | "task" | "flee";

const COMMAND_LABELS: Record<Command, string> = {
  start: "たたかう",
  task: "じゅもん",
  flee: "にげる",
};

type CommandWindowProps = {
  canStart: boolean;
  canFlee: boolean;
  tasks: TaskRead[];
  activeTaskId: string | null;
  onStart: () => void;
  onFlee: () => void;
  onSelectTask: (taskId: string | null) => void;
};

export function CommandWindow({
  canStart,
  canFlee,
  tasks,
  activeTaskId,
  onStart,
  onFlee,
  onSelectTask,
}: CommandWindowProps) {
  const shouldReduceMotion = useReducedMotion();
  const [isTaskListOpen, setIsTaskListOpen] = useState(false);
  const [cursor, setCursor] = useState<Command>("start");

  const commands: Command[] = ["start", "task", "flee"];

  function runCommand(command: Command): void {
    setCursor(command);
    if (command === "start") {
      if (canStart) onStart();
    } else if (command === "task") {
      setIsTaskListOpen((open) => !open);
    } else {
      if (canFlee) onFlee();
      setIsTaskListOpen(false);
    }
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.12, ease: "linear" }}
      style={{ transformOrigin: "top" }}
      className="w-full max-w-sm border-2 border-white bg-black p-3 text-white"
    >
      <ul className="space-y-1">
        {commands.map((command) => {
          const disabled = (command === "start" && !canStart) || (command === "flee" && !canFlee);
          return (
            <li key={command}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => runCommand(command)}
                className="flex w-full items-center gap-2 px-1 text-left text-lg disabled:opacity-40"
              >
                <span className="inline-block w-3">
                  {cursor === command && (
                    <motion.span
                      animate={shouldReduceMotion ? { opacity: 1 } : { opacity: [1, 0, 1] }}
                      transition={{
                        duration: 0.6,
                        repeat: shouldReduceMotion ? 0 : Infinity,
                        ease: "linear",
                      }}
                    >
                      {"▶"}
                    </motion.span>
                  )}
                </span>
                {COMMAND_LABELS[command]}
              </button>
            </li>
          );
        })}
      </ul>

      {isTaskListOpen && (
        <div className="mt-2 border-t-2 border-white pt-2">
          <button
            type="button"
            onClick={() => {
              onSelectTask(null);
              setIsTaskListOpen(false);
            }}
            className={cn(
              "block w-full px-1 py-0.5 text-left",
              activeTaskId === null && "bg-white text-black",
            )}
          >
            (たいしょうタスクなし)
          </button>
          {tasks.length === 0 && <p className="px-1 py-0.5 text-white/60">クエストが ありません。</p>}
          {tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                onSelectTask(task.id);
                setIsTaskListOpen(false);
              }}
              className={cn(
                "block w-full px-1 py-0.5 text-left",
                activeTaskId === task.id && "bg-white text-black",
              )}
            >
              {task.title}
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
