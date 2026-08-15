"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { ThemeWrapper } from "@/components/theme-wrapper";

export function PomodoroScreen() {
  return (
    <div className="relative flex min-h-screen w-full flex-1 flex-col items-center">
      <ThemeToggle />
      <ThemeWrapper />
    </div>
  );
}
