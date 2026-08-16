// Server Component (デフォルト)。実際の描画・状態管理はクライアントコンポーネントの StatsView に委ねる。

import { StatsView } from "@/components/stats/stats-view";

export default function StatsPage() {
  return <StatsView />;
}
