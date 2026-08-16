"use client";

import { ThemeWrapper } from "@/components/theme-wrapper";

/**
 * タイマー画面本体 (テーマ切替アニメーション部分のみ)。ヘッダー・ナビ・フッターは
 * 全ルート共通の AppShell (app/layout.tsx) 側が担う。
 */
export function PomodoroScreen() {
  return <ThemeWrapper />;
}
