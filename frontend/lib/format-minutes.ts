/**
 * 分単位の数値を日本語表記 (例: "1時間30分") に整形する純粋関数群。
 * 統計画面 (/stats) で使用する。タイマー画面の "mm:ss" 表記 (lib/timer.ts) とは用途が異なる。
 */

/** 分数を "○時間○分" 形式に整形する (0分の場合は "0分")。 */
export function formatMinutesJa(totalMinutes: number): string {
  const minutes = Math.max(0, Math.round(totalMinutes));
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (hours === 0) return `${remainingMinutes}分`;
  if (remainingMinutes === 0) return `${hours}時間`;
  return `${hours}時間${remainingMinutes}分`;
}
