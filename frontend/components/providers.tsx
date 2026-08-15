"use client";

import type { ReactNode } from "react";

import { ThemeProvider } from "@/hooks/use-theme";
import { TimerProvider } from "@/hooks/use-timer";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <TimerProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </TimerProvider>
  );
}
