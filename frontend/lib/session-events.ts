/**
 * セッション記録 (POST /api/sessions) の完了を hooks/use-tasks.ts に通知するための
 * 最小限のpub/sub。タイマーとタスク一覧はどちらもテーマ切替で再マウントされうるため、
 * Contextではなくモジュールスコープの購読リストで疎結合に連携する。
 */

type Listener = (taskId: string) => void;

const listeners = new Set<Listener>();

export function subscribeTaskSessionRecorded(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function notifyTaskSessionRecorded(taskId: string): void {
  for (const listener of listeners) listener(taskId);
}

/**
 * タスク紐付けの有無を問わず、セッションが1件記録されたことを通知する。
 * 用途: 本日の完了ポモドーロ数を表示するフック (use-today-pomodoro-count.ts) の再取得トリガー。
 */
type SessionRecordedListener = () => void;

const sessionRecordedListeners = new Set<SessionRecordedListener>();

export function subscribeSessionRecorded(listener: SessionRecordedListener): () => void {
  sessionRecordedListeners.add(listener);
  return () => sessionRecordedListeners.delete(listener);
}

export function notifySessionRecorded(): void {
  for (const listener of sessionRecordedListeners) listener();
}
