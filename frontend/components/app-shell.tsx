"use client";

import type { ReactNode } from "react";

import { AppHeader } from "@/components/app-header";
import { AppNav } from "@/components/app-nav";
import { useTheme } from "@/hooks/use-theme";
import { DQ_BOX_SM, GLASS_CARD, MINIMAL_BACKGROUND } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

function FooterStatusBar() {
  const { theme } = useTheme();
  const isRpg = theme === "rpg";

  return (
    <footer className="mt-6 w-full max-w-5xl px-4 pb-4 text-center text-xs text-gray-400 md:px-8 md:pb-8">
      <div
        className={cn(
          "inline-block px-4 py-2",
          isRpg ? DQ_BOX_SM : cn(GLASS_CARD, "rounded-xl px-5 py-2 text-gray-400"),
        )}
      >
        モード: ゲスト | データは API に保存されています
      </div>
    </footer>
  );
}

/**
 * 全ルート共通の外枠 (背景・ヘッダー・ナビ・フッター)。app/layout.tsx から呼ばれ、
 * テーマ切替でも再マウントされないようルートレイアウト側に配置する。
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const isRpg = theme === "rpg";

  return (
    <div
      className={cn(
        "relative flex min-h-screen w-full flex-1 flex-col items-center",
        isRpg ? "bg-black" : MINIMAL_BACKGROUND,
      )}
    >
      <AppHeader />
      <AppNav />
      {children}
      <FooterStatusBar />
    </div>
  );
}
