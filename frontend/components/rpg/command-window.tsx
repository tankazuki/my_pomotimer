"use client";

import { motion, useReducedMotion } from "framer-motion";

import { playClickSound } from "@/lib/sound";
import { DQ_BOX_SM } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

type CommandWindowProps = {
  /** 「たたかう」を押せるか (phase !== "running")。 */
  canStart: boolean;
  /** 「ぼうぎょ」を押せるか (phase === "running")。 */
  canPause: boolean;
  /** 「にげる」を押せるか (phase !== "idle")。 */
  canFlee: boolean;
  onStart: () => void;
  onPause: () => void;
  onFlee: () => void;
  onSkip: () => void;
};

type CommandDef = {
  key: string;
  label: string;
  description: string;
  disabled: boolean;
  onClick: () => void;
};

export function CommandWindow({
  canStart,
  canPause,
  canFlee,
  onStart,
  onPause,
  onFlee,
  onSkip,
}: CommandWindowProps) {
  const shouldReduceMotion = useReducedMotion();

  function run(action: () => void): void {
    playClickSound();
    action();
  }

  const commands: CommandDef[] = [
    {
      key: "start",
      label: "たたかう",
      description: "タイマー かいし",
      disabled: !canStart,
      onClick: () => run(onStart),
    },
    {
      key: "pause",
      label: "ぼうぎょ",
      description: "いちじ ていし",
      disabled: !canPause,
      onClick: () => run(onPause),
    },
    {
      key: "flee",
      label: "にげる",
      description: "リセット",
      disabled: !canFlee,
      onClick: () => run(onFlee),
    },
    {
      key: "skip",
      label: "じゅもん",
      description: "スキップ",
      disabled: false,
      onClick: () => run(onSkip),
    },
  ];

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.12, ease: "linear" }}
      style={{ transformOrigin: "top" }}
      className="grid w-full grid-cols-2 gap-4 text-left"
    >
      {commands.map((command) => (
        <button
          key={command.key}
          type="button"
          disabled={command.disabled}
          onClick={command.onClick}
          className={cn(
            DQ_BOX_SM,
            "group flex items-center gap-2 p-3 text-white transition-colors hover:bg-white hover:text-black disabled:pointer-events-none disabled:opacity-40",
          )}
        >
          <span className="w-3 shrink-0 text-yellow-400 opacity-0 group-hover:opacity-100 group-hover:text-black">
            {"▶"}
          </span>
          <span>
            <span className="block text-base font-bold">{command.label}</span>
            <span className="block text-xs text-gray-400 group-hover:text-gray-800">
              {command.description}
            </span>
          </span>
        </button>
      ))}
    </motion.div>
  );
}
