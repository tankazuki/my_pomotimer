"use client";

import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50"
    >
      {theme === "rpg" ? "ミニマル表示へ" : "RPG表示へ"}
    </Button>
  );
}
