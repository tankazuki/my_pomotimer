/**
 * タイマーに関する純粋関数群 (フォーマット・フェーズ遷移・既定時間)。
 * 副作用 (setInterval, localStorage, API通信) は hooks/use-timer.ts 側で扱う。
 */

export type SessionType = "WORK" | "SHORT_BREAK" | "LONG_BREAK";

export type TimerPhase = "idle" | "running" | "paused";

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

/**
 * タイマーの状態に応じたメッセージ文言を返す。RPGテーマのドット絵風メッセージウィンドウ
 * (タイプライター表示) 専用。ひらがな中心のDQ風表記は意図的な演出なので変更しないこと。
 */
export function computeTimerMessage(
  phase: TimerPhase,
  sessionType: SessionType,
  activeTaskTitle: string | null,
): string {
  if (phase === "running") {
    return sessionType === "WORK"
      ? `${activeTaskTitle ?? "しごと"} に しゅうちゅうしている...`
      : `${SESSION_TYPE_LABEL_JA[sessionType]}中...`;
  }
  if (phase === "paused") {
    return "いちじ ていしちゅう...「たたかう」で さいかいできる。";
  }
  return sessionType === "WORK"
    ? "「たたかう」で しゅうちゅうを はじめよう。"
    : `「たたかう」で ${SESSION_TYPE_LABEL_JA[sessionType]}に はいろう。`;
}

/** ミニマルテーマ用のセッション種別表示 (通常の漢字表記)。 */
export const MINIMAL_SESSION_TYPE_LABEL: Record<SessionType, string> = {
  WORK: "集中",
  SHORT_BREAK: "休憩",
  LONG_BREAK: "長い休憩",
};

/**
 * ミニマルテーマのステータス通知パネル用メッセージ。RPGテーマの「たたかう」等の
 * コマンド名には依存せず、実際のボタン名 (開始/一時停止) に沿った表記にする。
 */
export function computeMinimalTimerMessage(
  phase: TimerPhase,
  sessionType: SessionType,
  activeTaskTitle: string | null,
): string {
  if (phase === "running") {
    return sessionType === "WORK"
      ? `${activeTaskTitle ?? "タスク"}に集中しています...`
      : `${MINIMAL_SESSION_TYPE_LABEL[sessionType]}中です...`;
  }
  if (phase === "paused") {
    return "一時停止中です。「開始」で再開できます。";
  }
  return sessionType === "WORK"
    ? "「開始」で集中を始めましょう。"
    : `「開始」で${MINIMAL_SESSION_TYPE_LABEL[sessionType]}に入りましょう。`;
}
