"use client";

import { useCallback, useEffect, useState } from "react";

import { listSessions, type SessionRead } from "@/lib/api";
import { subscribeSessionRecorded } from "@/lib/session-events";

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
}

function countTodayCompletedWork(sessions: SessionRead[]): number {
  return sessions.filter(
    (session) =>
      session.status === "COMPLETED" &&
      session.session_type === "WORK" &&
      isToday(session.started_at),
  ).length;
}

/** 本日完了したWORKセッション数 (ローカルタイムゾーン基準)。セッション記録のたびに再取得する。 */
export function useTodayPomodoroCount(): number {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    listSessions({ limit: 200 })
      .then((sessions) => setCount(countTodayCompletedWork(sessions)))
      .catch(() => {
        // 取得に失敗しても画面表示は0のまま継続する
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => subscribeSessionRecorded(refresh), [refresh]);

  return count;
}
