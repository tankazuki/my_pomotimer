"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import { createSession, type SessionCreate } from "@/lib/api";
import { notifySessionRecorded, notifyTaskSessionRecorded } from "@/lib/session-events";
import { playCompleteFanfare } from "@/lib/sound";
import { durationMsFor, nextSessionType, type SessionType, type TimerPhase } from "@/lib/timer";

export type { TimerPhase } from "@/lib/timer";

type PersistedTimer = {
  phase: TimerPhase;
  sessionType: SessionType;
  activeTaskId: string | null;
  totalMs: number;
  /** running中のみ有効。endsAt方式で残り時間を都度計算するための基準時刻 (epoch ms)。 */
  endsAt: number | null;
  /** idle/paused時点で確定している残り時間 (ms)。 */
  remainingMs: number;
  startedAt: string | null;
  completedWorkCount: number;
};

const STORAGE_KEY = "pomodoro:timer";
const TICK_INTERVAL_MS = 250;
const VALID_PHASES: readonly TimerPhase[] = ["idle", "running", "paused"];
const VALID_SESSION_TYPES: readonly SessionType[] = ["WORK", "SHORT_BREAK", "LONG_BREAK"];

function initialPersistedTimer(): PersistedTimer {
  const totalMs = durationMsFor("WORK");
  return {
    phase: "idle",
    sessionType: "WORK",
    activeTaskId: null,
    totalMs,
    endsAt: null,
    remainingMs: totalMs,
    startedAt: null,
    completedWorkCount: 0,
  };
}

function isPersistedTimer(value: unknown): value is PersistedTimer {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    VALID_PHASES.includes(v.phase as TimerPhase) &&
    VALID_SESSION_TYPES.includes(v.sessionType as SessionType) &&
    typeof v.totalMs === "number" &&
    typeof v.remainingMs === "number" &&
    typeof v.completedWorkCount === "number"
  );
}

function readPersistedTimer(): PersistedTimer | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isPersistedTimer(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function writePersistedTimer(state: PersistedTimer): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 保存できなくてもタイマー自体は動作を続ける
  }
}

/**
 * タイマーの実体はモジュールスコープの外部ストアとして持つ (Reactの useState ではない)。
 * これにより「テーマ切替でTimerProviderを絶対に再マウントしない」という制約はもちろん、
 * 仮に再マウントされてもタイマーが飛ばないという冗長性も得られる。
 * Reactへは useSyncExternalStore で橋渡しする。
 */
let timerState: PersistedTimer = initialPersistedTimer();
const listeners = new Set<() => void>();
let hasHydratedFromStorage = false;

function getSnapshot(): PersistedTimer {
  return timerState;
}

// useSyncExternalStoreの制約上、getServerSnapshotは呼び出すたびに同じ参照を返す必要がある。
const SERVER_SNAPSHOT: PersistedTimer = initialPersistedTimer();

function getServerSnapshot(): PersistedTimer {
  return SERVER_SNAPSHOT;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notify(): void {
  for (const listener of listeners) listener();
}

function setTimerState(updater: (prev: PersistedTimer) => PersistedTimer): void {
  const next = updater(timerState);
  if (next === timerState) return;
  timerState = next;
  writePersistedTimer(timerState);
  notify();
}

/** マウント後に一度だけlocalStorageから復元する (ハイドレーション不一致を避けるため)。 */
function ensureHydrated(): void {
  if (hasHydratedFromStorage) return;
  hasHydratedFromStorage = true;
  const persisted = readPersistedTimer();
  if (persisted) {
    timerState = persisted;
    notify();
  }
}

function recordSession(
  endedState: PersistedTimer,
  status: "COMPLETED" | "INTERRUPTED",
  endedAtMs: number,
): void {
  if (!endedState.startedAt) return;
  const taskId = endedState.sessionType === "WORK" ? endedState.activeTaskId : null;
  const payload: SessionCreate = {
    task_id: taskId,
    session_type: endedState.sessionType,
    duration_minutes: Math.round(endedState.totalMs / 60_000),
    status,
    started_at: endedState.startedAt,
    ended_at: new Date(endedAtMs).toISOString(),
  };
  createSession(payload)
    .then(() => {
      notifySessionRecorded();
      if (taskId) notifyTaskSessionRecorded(taskId);
    })
    .catch(() => {
      // 記録に失敗してもタイマー操作自体は継続させる (オフライン時にUXを止めないため)
    });
}

function startSession(): void {
  setTimerState((prev) => {
    if (prev.phase === "running") return prev;
    return {
      ...prev,
      phase: "running",
      endsAt: Date.now() + prev.remainingMs,
      startedAt: prev.startedAt ?? new Date().toISOString(),
    };
  });
}

function pauseSession(): void {
  setTimerState((prev) => {
    if (prev.phase !== "running" || prev.endsAt === null) return prev;
    return {
      ...prev,
      phase: "paused",
      remainingMs: Math.max(0, prev.endsAt - Date.now()),
      endsAt: null,
    };
  });
}

function resetSession(): void {
  setTimerState((prev) => {
    if (prev.phase === "idle") return prev;
    const endedAtMs =
      prev.phase === "running" && prev.endsAt !== null ? Math.min(Date.now(), prev.endsAt) : Date.now();
    recordSession(prev, "INTERRUPTED", endedAtMs);

    const totalMs = durationMsFor(prev.sessionType);
    return { ...prev, phase: "idle", totalMs, endsAt: null, remainingMs: totalMs, startedAt: null };
  });
}

function switchActiveTask(taskId: string | null): void {
  setTimerState((prev) => (prev.phase !== "idle" ? prev : { ...prev, activeTaskId: taskId }));
}

/**
 * フェーズを問わず呼べる。実行中のセッションを記録せずに打ち切り、次のセッション種別へ進める。
 * checkNaturalCompletionと違い、recordSessionは呼ばずcompletedWorkCountも増やさない。
 */
function skipSession(): void {
  setTimerState((prev) => {
    // nextSessionTypeは「今回完了分を含む通算WORK完了数」を期待する (0は未完了扱いでLONG_BREAK
    // 判定に誤って一致してしまうため、completedWorkCount=0の場合は1として扱う)。
    const nextType = nextSessionType(prev.sessionType, prev.completedWorkCount || 1);
    const totalMs = durationMsFor(nextType);

    return {
      phase: "idle",
      sessionType: nextType,
      activeTaskId: prev.activeTaskId,
      totalMs,
      endsAt: null,
      remainingMs: totalMs,
      startedAt: null,
      completedWorkCount: prev.completedWorkCount,
    };
  });
}

/** phase === "idle" のときだけ有効。実行中は無視する (mockのsetTimerModeに相当)。 */
function setSessionTypeState(type: SessionType): void {
  setTimerState((prev) => {
    if (prev.phase !== "idle") return prev;
    const totalMs = durationMsFor(type);
    return { ...prev, sessionType: type, totalMs, remainingMs: totalMs };
  });
}

/** running中にendsAtを過ぎていたら完了処理をして次のセッションへ進める。tickごとに呼ばれる。 */
function checkNaturalCompletion(): void {
  setTimerState((prev) => {
    if (prev.phase !== "running" || prev.endsAt === null || Date.now() < prev.endsAt) return prev;

    recordSession(prev, "COMPLETED", prev.endsAt);
    if (prev.sessionType === "WORK") playCompleteFanfare();

    const completedWorkCount =
      prev.sessionType === "WORK" ? prev.completedWorkCount + 1 : prev.completedWorkCount;
    const nextType = nextSessionType(prev.sessionType, completedWorkCount);
    const totalMs = durationMsFor(nextType);

    return {
      phase: "idle",
      sessionType: nextType,
      activeTaskId: prev.activeTaskId,
      totalMs,
      endsAt: null,
      remainingMs: totalMs,
      startedAt: null,
      completedWorkCount,
    };
  });
}

function useNow(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Date.now());
      checkNaturalCompletion();
    }, TICK_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, []);

  return now;
}

type TimerStateValue = {
  phase: TimerPhase;
  sessionType: SessionType;
  activeTaskId: string | null;
  totalMs: number;
  endsAt: number | null;
  /** idle/paused時点の残り時間 (ms)。running中はendsAtとtickのnowから計算すること。 */
  remainingMsSnapshot: number;
  completedWorkCount: number;
  start: () => void;
  pause: () => void;
  reset: () => void;
  skip: () => void;
  setSessionType: (type: SessionType) => void;
  switchTask: (taskId: string | null) => void;
};

type TimerTickValue = {
  now: number;
};

const TimerStateContext = createContext<TimerStateValue | null>(null);
const TimerTickContext = createContext<TimerTickValue | null>(null);

export function TimerProvider({ children }: { children: ReactNode }) {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const now = useNow();

  useEffect(() => {
    ensureHydrated();
  }, []);

  const stateValue = useMemo<TimerStateValue>(
    () => ({
      phase: state.phase,
      sessionType: state.sessionType,
      activeTaskId: state.activeTaskId,
      totalMs: state.totalMs,
      endsAt: state.endsAt,
      remainingMsSnapshot: state.remainingMs,
      completedWorkCount: state.completedWorkCount,
      start: startSession,
      pause: pauseSession,
      reset: resetSession,
      skip: skipSession,
      setSessionType: setSessionTypeState,
      switchTask: switchActiveTask,
    }),
    [state],
  );

  const tickValue = useMemo<TimerTickValue>(() => ({ now }), [now]);

  return (
    <TimerStateContext.Provider value={stateValue}>
      <TimerTickContext.Provider value={tickValue}>{children}</TimerTickContext.Provider>
    </TimerStateContext.Provider>
  );
}

export function useTimerState(): TimerStateValue {
  const ctx = useContext(TimerStateContext);
  if (!ctx) throw new Error("useTimerState must be used within a TimerProvider");
  return ctx;
}

export function useTimerTick(): TimerTickValue {
  const ctx = useContext(TimerTickContext);
  if (!ctx) throw new Error("useTimerTick must be used within a TimerProvider");
  return ctx;
}

/**
 * 表示用の残り時間 (ms) を計算する。runningの場合はendsAtとnow (250ms tick) から算出し、
 * それ以外はidle/paused時点のスナップショットをそのまま返す。
 */
export function computeRemainingMs(params: {
  phase: TimerPhase;
  endsAt: number | null;
  remainingMsSnapshot: number;
  now: number;
}): number {
  if (params.phase === "running" && params.endsAt !== null) {
    return Math.max(0, params.endsAt - params.now);
  }
  return params.remainingMsSnapshot;
}
