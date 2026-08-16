"use client";

import { useTheme } from "@/hooks/use-theme";
import { useSound } from "@/hooks/use-sound";
import { downloadExport } from "@/lib/api";
import { playClickSound } from "@/lib/sound";
import { DQ_BOX_SM, GLASS_BUTTON } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

/**
 * 両テーマ共通のヘッダー。ThemeWrapperの外 (PomodoroScreen) に配置され、
 * テーマ切替でコンポーネント自体は再マウントされない。
 */
export function AppHeader() {
  const { theme, toggleTheme } = useTheme();
  const { soundEnabled, toggleSound } = useSound();
  const isRpg = theme === "rpg";

  function handleThemeToggle(): void {
    playClickSound();
    toggleTheme();
  }

  return (
    <header className="flex w-full max-w-5xl flex-col items-center justify-between gap-4 px-4 pt-4 sm:flex-row md:px-8 md:pt-8">
      <div
        className={cn(
          "px-4 py-2 text-center sm:text-left",
          isRpg ? DQ_BOX_SM : cn(GLASS_BUTTON, "px-5 py-2.5"),
        )}
      >
        {isRpg ? (
          <h1 className="font-dotgothic text-xl tracking-widest text-yellow-300 md:text-2xl">
            {"⚔️ ポモドーロ クエスト ⚔️"}
          </h1>
        ) : (
          <h1 className="bg-gradient-to-r from-orange-400 to-amber-300 bg-clip-text text-xl font-extrabold tracking-tight text-transparent md:text-2xl">
            {"✨ POMODORO FOCUS"}
          </h1>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={toggleSound}
          className={cn(
            "px-3 py-1.5 text-xs transition-all md:text-sm",
            isRpg
              ? cn(DQ_BOX_SM, "text-white hover:bg-white hover:text-black")
              : cn(GLASS_BUTTON, "text-gray-300 hover:text-white"),
          )}
        >
          {soundEnabled ? "🔊 おと: ON" : "🔇 おと: OFF"}
        </button>

        <button
          type="button"
          onClick={() => void downloadExport()}
          className={cn(
            "px-3 py-1.5 text-xs transition-all md:text-sm",
            isRpg
              ? cn(DQ_BOX_SM, "text-white hover:bg-white hover:text-black")
              : cn(GLASS_BUTTON, "text-gray-300 hover:text-white"),
          )}
        >
          {"💾 データをほぞん"}
        </button>

        <button
          type="button"
          onClick={handleThemeToggle}
          className={cn(
            "px-4 py-1.5 text-xs font-bold transition-all md:text-sm",
            isRpg
              ? cn(DQ_BOX_SM, "bg-yellow-400 text-black hover:bg-yellow-300")
              : cn(
                  GLASS_BUTTON,
                  "border-orange-500/40 bg-orange-500/20 text-white shadow-lg shadow-orange-500/10 hover:bg-orange-500",
                ),
          )}
        >
          {isRpg ? "ミニマル表示へ" : "RPG表示へ"}
        </button>
      </div>
    </header>
  );
}
