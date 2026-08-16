"use client";

import { useEffect, useState } from "react";

import { fetchDayDetail, type DayDetailResponse } from "@/lib/api";
import { getTzOffsetMinutes } from "@/lib/date";
import { subscribeSessionRecorded } from "@/lib/session-events";

type State =
  | { kind: "loading" }
  | { kind: "success"; data: DayDetailResponse }
  | { kind: "error"; message: string };

type UseDayDetailResult = {
  data: DayDetailResponse | null;
  isLoading: boolean;
  error: string | null;
};

/**
 * 特定日の詳細 (GET /api/stats/day/{date}) を取得するフック。
 * dateStr が変わるたび、およびセッションが記録されるたびに再取得する。
 */
export function useDayDetail(dateStr: string): UseDayDetailResult {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchDayDetail(dateStr, getTzOffsetMinutes())
      .then((data) => {
        if (!cancelled) setState({ kind: "success", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "日付詳細の取得に失敗しました",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [dateStr, reloadKey]);

  useEffect(() => subscribeSessionRecorded(() => setReloadKey((key) => key + 1)), []);

  return {
    data: state.kind === "success" ? state.data : null,
    isLoading: state.kind === "loading",
    error: state.kind === "error" ? state.message : null,
  };
}
