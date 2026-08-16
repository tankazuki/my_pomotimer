"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useTheme } from "@/hooks/use-theme";
import { playClickSound } from "@/lib/sound";
import { DQ_BOX_SM, GLASS_BUTTON } from "@/lib/style-tokens";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "タイマー" },
  { href: "/stats", label: "統計" },
  { href: "/calendar", label: "カレンダー" },
] as const;

/** 両テーマ共通のページ内ナビゲーション。AppShell内、AppHeaderのすぐ下に配置される。 */
export function AppNav() {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isRpg = theme === "rpg";

  return (
    <nav
      aria-label="ページナビゲーション"
      className="flex w-full max-w-5xl flex-wrap items-center justify-center gap-2 px-4 md:justify-start md:px-8"
    >
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            onClick={() => playClickSound()}
            className={cn(
              "px-4 py-1.5 text-xs font-semibold transition-all md:text-sm",
              isRpg
                ? cn(
                    DQ_BOX_SM,
                    isActive ? "bg-yellow-400 text-black" : "text-white hover:bg-white hover:text-black",
                  )
                : cn(
                    GLASS_BUTTON,
                    isActive
                      ? "border-orange-500/40 bg-orange-500/20 text-white"
                      : "text-gray-300 hover:text-white",
                  ),
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
