"use client";

// 状態・イベントハンドラ・アニメーションを持つため Client Component にする。

import { motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { fetchHealth, type HealthResponse } from "@/lib/api";

type State =
  | { kind: "loading" }
  | { kind: "success"; data: HealthResponse }
  | { kind: "error"; message: string };

export function HealthStatus() {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const controller = new AbortController();

    fetchHealth(controller.signal)
      .then((data) => setState({ kind: "success", data }))
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          kind: "error",
          message:
            error instanceof Error ? error.message : "不明なエラーが発生しました",
        });
      });

    return () => controller.abort();
  }, [reloadKey]);

  // 「確認中」への切り替えはイベントハンドラ側で行う
  // (effect 内で同期的に setState すると再レンダリングが連鎖するため)。
  const reload = useCallback(() => {
    setState({ kind: "loading" });
    setReloadKey((key) => key + 1);
  }, []);

  return (
    <motion.section
      // フェードイン。動きを減らす設定のユーザーには移動をなくし、透明度のみにする。
      initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: shouldReduceMotion ? 0 : 0.4, ease: "easeOut" }}
      className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-sm font-medium text-muted-foreground">
        バックエンド接続状況
      </h2>

      <div className="mt-3 min-h-16" aria-live="polite">
        {state.kind === "loading" && (
          <p className="text-sm text-muted-foreground">確認中...</p>
        )}

        {state.kind === "success" && (
          <dl className="space-y-1 text-sm">
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">status</dt>
              <dd className="font-mono font-medium">{state.data.status}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">app_name</dt>
              <dd className="font-mono font-medium">{state.data.app_name}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="text-muted-foreground">database</dt>
              <dd className="font-mono font-medium">{state.data.database}</dd>
            </div>
          </dl>
        )}

        {state.kind === "error" && (
          <p className="text-sm text-destructive">
            接続できませんでした: {state.message}
          </p>
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={reload}
        disabled={state.kind === "loading"}
        className="mt-4"
      >
        再確認
      </Button>
    </motion.section>
  );
}
