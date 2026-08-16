"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchDailyStats, type DailyStatsResponse } from "@/lib/api";
import { formatDateYYYYMMDD, getTzOffsetMinutes } from "@/lib/date";
import { subscribeSessionRecorded } from "@/lib/session-events";

type State =
  | { kind: "loading" }
  | { kind: "success"; data: DailyStatsResponse }
  | { kind: "error"; message: string };

type UseDailyStatsResult = {
  data: DailyStatsResponse | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

function computeRange(rangeDays: number): { startDate: string; endDate: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (rangeDays - 1));
  return { startDate: formatDateYYYYMMDD(start), endDate: formatDateYYYYMMDD(end) };
}

/** 直近 rangeDays 日分の日別統計 (GET /api/stats/daily) を取得するフック。 */
export function useDailyStats(rangeDays: number): UseDailyStatsResult {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const { startDate, endDate } = computeRange(rangeDays);
    fetchDailyStats({ startDate, endDate, tzOffsetMinutes: getTzOffsetMinutes() })
      .then((data) => {
        if (!cancelled) setState({ kind: "success", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "統計データの取得に失敗しました",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [rangeDays, reloadKey]);

  const refresh = useCallback(() => {
    setState({ kind: "loading" });
    setReloadKey((key) => key + 1);
  }, []);

  // ポモドーロセッションが記録されるたびに最新の統計を反映する。
  useEffect(() => subscribeSessionRecorded(refresh), [refresh]);

  return {
    data: state.kind === "success" ? state.data : null,
    isLoading: state.kind === "loading",
    error: state.kind === "error" ? state.message : null,
    refresh,
  };
}
