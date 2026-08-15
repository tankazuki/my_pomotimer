// Server Component (デフォルト)。インタラクティブな部分だけを Client Component に切り出す。

import { PomodoroScreen } from "@/components/pomodoro-screen";

export default function Home() {
  return <PomodoroScreen />;
}
