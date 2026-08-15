/**
 * タイマーに関する純粋関数群 (フォーマット・フェーズ遷移・既定時間)。
 * 副作用 (setInterval, localStorage, API通信) は hooks/use-timer.ts 側で扱う。
 */

export type SessionType = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export const SESSION_DURATION_MINUTES: Record<SessionType, number> = {
  WORK: 25,
  SHORT_BREAK: 5,
  LONG_BREAK: 15,
};

/** この回数WORKを完了するごとにLONG_BREAKを挟む。 */
const WORK_SESSIONS_UNTIL_LONG_BREAK = 4;

export function durationMsFor(sessionType: SessionType): number {
  return SESSION_DURATION_MINUTES[sessionType] * 60_000;
}

/**
 * 現在のセッションが完了した後、次に取るべきセッション種別を返す。
 * completedWorkCount は今回完了分を含んだ、通算のWORK完了数。
 */
export function nextSessionType(
  current: SessionType,
  completedWorkCount: number,
): SessionType {
  if (current !== "WORK") return "WORK";
  return completedWorkCount % WORK_SESSIONS_UNTIL_LONG_BREAK === 0
    ? "LONG_BREAK"
    : "SHORT_BREAK";
}

/** 残り時間 (ms) を "mm:ss" 形式に整形する。 */
export function formatRemaining(remainingMs: number): string {
  const totalSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

/** 経過割合 (0〜1) を返す。円形プログレスバーの表示に使う。 */
export function progressRatio(remainingMs: number, totalMs: number): number {
  if (totalMs <= 0) return 0;
  return Math.min(1, Math.max(0, 1 - remainingMs / totalMs));
}

export const SESSION_TYPE_LABEL_JA: Record<SessionType, string> = {
  WORK: "しゅうちゅう",
  SHORT_BREAK: "きゅうけい",
  LONG_BREAK: "ながいきゅうけい",
};
