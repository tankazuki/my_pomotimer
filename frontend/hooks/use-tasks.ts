"use client";

import { useCallback, useEffect, useState } from "react";

import {
  createTask,
  deleteTask,
  listTasks,
  updateTask,
  type TaskCreate,
  type TaskRead,
  type TaskUpdate,
} from "@/lib/api";
import { subscribeTaskSessionRecorded } from "@/lib/session-events";

type State =
  | { kind: "loading" }
  | { kind: "success"; tasks: TaskRead[] }
  | { kind: "error"; message: string };

type UseTasksResult = {
  tasks: TaskRead[];
  isLoading: boolean;
  error: string | null;
  refresh: () => void;
  addTask: (data: TaskCreate) => Promise<TaskRead>;
  editTask: (taskId: string, data: TaskUpdate) => Promise<TaskRead>;
  removeTask: (taskId: string) => Promise<void>;
};

export function useTasks(includeCompleted = true): UseTasksResult {
  const [state, setState] = useState<State>({ kind: "loading" });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    listTasks(includeCompleted)
      .then((data) => {
        if (!cancelled) setState({ kind: "success", tasks: data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "error",
          message: err instanceof Error ? err.message : "タスクの取得に失敗しました",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [includeCompleted, reloadKey]);

  const refresh = useCallback(() => {
    setState({ kind: "loading" });
    setReloadKey((key) => key + 1);
  }, []);

  // タイマーがセッションを記録したら、該当タスクのcompleted_pomodorosを再取得して反映する。
  useEffect(() => subscribeTaskSessionRecorded(() => refresh()), [refresh]);

  const addTask = useCallback(async (data: TaskCreate) => {
    const task = await createTask(data);
    setState((prev) => (prev.kind === "success" ? { ...prev, tasks: [...prev.tasks, task] } : prev));
    return task;
  }, []);

  const editTask = useCallback(async (taskId: string, data: TaskUpdate) => {
    const task = await updateTask(taskId, data);
    setState((prev) =>
      prev.kind === "success"
        ? { ...prev, tasks: prev.tasks.map((t) => (t.id === taskId ? task : t)) }
        : prev,
    );
    return task;
  }, []);

  const removeTask = useCallback(async (taskId: string) => {
    await deleteTask(taskId);
    setState((prev) =>
      prev.kind === "success" ? { ...prev, tasks: prev.tasks.filter((t) => t.id !== taskId) } : prev,
    );
  }, []);

  return {
    tasks: state.kind === "success" ? state.tasks : [],
    isLoading: state.kind === "loading",
    error: state.kind === "error" ? state.message : null,
    refresh,
    addTask,
    editTask,
    removeTask,
  };
}
