"use client";

import { useEffect, useMemo, useState } from "react";

import { fetchDailyStats, type DailyStat } from "@/lib/api";
import { formatDateYYYYMMDD, getTzOffsetMinutes } from "@/lib/date";
import { subscribeSessionRecorded } from "@/lib/session-events";

type State =
  | { kind: "loading" }
  | { kind: "success"; days: DailyStat[] }
  | { kind: "error"; message: string };

type UseMonthStatsResult = {
  statsByDate: Map<string, DailyStat>;
  isLoading: boolean;
  error: string | null;
};

/**
 * 指定した年月 (month は0始まり) の日別集計 (GET /api/stats/daily) を月初〜月末の
 * 範囲で取得するフック。カレンダー画面専用のローカル実装 (統計画面 /stats 側の集計取得と
 * ロジックが重複するが、画面間の独立性を優先してここに保持する)。
 */
export function useMonthStats(year: number, month: number): UseMonthStatsResult {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const startDate = formatDateYYYYMMDD(new Date(year, month, 1));
    const endDate = formatDateYYYYMMDD(new Date(year, month + 1, 0));
    fetchDailyStats({ startDate, endDate, tzOffsetMinutes: getTzOffsetMinutes() })
      .then((res) => {
        if (!cancelled) setState({ kind: "success", days: res.days });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "月間集計の取得に失敗しました",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [year, month, reloadKey]);

  useEffect(() => subscribeSessionRecorded(() => setReloadKey((key) => key + 1)), []);

  const statsByDate = useMemo(() => {
    const map = new Map<string, DailyStat>();
    if (state.kind === "success") {
      for (const day of state.days) map.set(day.date, day);
    }
    return map;
  }, [state]);

  return {
    statsByDate,
    isLoading: state.kind === "loading",
    error: state.kind === "error" ? state.message : null,
  };
}
