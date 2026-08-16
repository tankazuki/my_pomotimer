"use client";

import { useCallback, useEffect, useState } from "react";

import { listTags, type TagRead } from "@/lib/api";

type State =
  | { kind: "loading" }
  | { kind: "success"; tags: TagRead[] }
  | { kind: "error"; message: string };

type UseTagsResult = {
  tags: TagRead[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
};

/** listTags を薄くラップするフック (use-tasks.ts と同じ構造)。 */
export function useTags(params?: { q?: string; limit?: number }): UseTagsResult {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const q = params?.q;
  const limit = params?.limit;

  useEffect(() => {
    let cancelled = false;
    listTags({ q, limit })
      .then((data) => {
        if (!cancelled) setState({ kind: "success", tags: data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "タグの取得に失敗しました",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [q, limit, reloadKey]);

  const refresh = useCallback(() => {
    setState({ kind: "loading" });
    setReloadKey((key) => key + 1);
  }, []);

  return {
    tags: state.kind === "success" ? state.tags : [],
    isLoading: state.kind === "loading",
    error: state.kind === "error" ? state.message : null,
    refresh,
  };
}
