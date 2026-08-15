/**
 * バックエンドAPIのクライアント層。
 * コンポーネント内で直接 fetch のURLを組み立てず、必ずここを経由する。
 */

import { getGuestId } from "@/lib/guest-id";

export type HealthResponse = {
  status: "ok" | "degraded";
  app_name: string;
  database: "ok" | "error";
};

export type GuestRead = {
  id: string;
  created_at: string;
};

export type SessionType = "WORK" | "SHORT_BREAK" | "LONG_BREAK";
export type SessionStatus = "COMPLETED" | "INTERRUPTED";

export type TaskCreate = {
  title: string;
  estimated_pomodoros: number;
};

export type TaskUpdate = {
  title?: string;
  estimated_pomodoros?: number;
  is_completed?: boolean;
};

export type TaskRead = {
  id: string;
  user_id: string;
  title: string;
  estimated_pomodoros: number;
  completed_pomodoros: number;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

export type SessionCreate = {
  task_id: string | null;
  session_type: SessionType;
  duration_minutes: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string;
};

export type SessionRead = {
  id: string;
  task_id: string | null;
  user_id: string;
  session_type: SessionType;
  duration_minutes: number;
  status: SessionStatus;
  started_at: string;
  ended_at: string;
};

/** APIのベースURLは環境変数から読む (ハードコード禁止)。 */
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export class ApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApiError";
  }
}

function resolveBaseUrl(): string {
  if (!API_BASE_URL) {
    throw new ApiError(
      "NEXT_PUBLIC_API_BASE_URL が設定されていません (.env.local を確認してください)",
    );
  }
  // 末尾のスラッシュを取り除き、パス連結時の // を防ぐ
  return API_BASE_URL.replace(/\/+$/, "");
}

type RequestOptions = RequestInit & {
  /** trueの場合、X-Guest-ID ヘッダーを解決して付与する。 */
  guest?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { guest = false, headers, ...init } = options;
  const guestHeaders: HeadersInit = guest ? { "X-Guest-ID": await getGuestId() } : {};

  const method = init.method ?? "GET";
  const response = await fetch(`${resolveBaseUrl()}${path}`, {
    ...init,
    headers: { Accept: "application/json", ...guestHeaders, ...headers },
  });

  if (!response.ok) {
    throw new ApiError(`${method} ${path} が ${response.status} を返しました`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

const JSON_HEADERS = { "Content-Type": "application/json" };

/** バックエンドの死活確認 (GET /health)。 */
export function fetchHealth(signal?: AbortSignal): Promise<HealthResponse> {
  return request<HealthResponse>("/health", { signal, cache: "no-store" });
}

/** 新規ゲストプロフィールの発行 (POST /api/guest)。guest-id.ts から呼ばれる。 */
export function createGuest(): Promise<GuestRead> {
  return request<GuestRead>("/api/guest", { method: "POST", cache: "no-store" });
}

export function listTasks(includeCompleted = true): Promise<TaskRead[]> {
  const params = new URLSearchParams({ include_completed: String(includeCompleted) });
  return request<TaskRead[]>(`/api/tasks?${params.toString()}`, {
    guest: true,
    cache: "no-store",
  });
}

export function createTask(data: TaskCreate): Promise<TaskRead> {
  return request<TaskRead>("/api/tasks", {
    method: "POST",
    guest: true,
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export function getTask(taskId: string): Promise<TaskRead> {
  return request<TaskRead>(`/api/tasks/${taskId}`, { guest: true, cache: "no-store" });
}

export function updateTask(taskId: string, data: TaskUpdate): Promise<TaskRead> {
  return request<TaskRead>(`/api/tasks/${taskId}`, {
    method: "PATCH",
    guest: true,
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export function deleteTask(taskId: string): Promise<void> {
  return request<void>(`/api/tasks/${taskId}`, { method: "DELETE", guest: true });
}

export function createSession(data: SessionCreate): Promise<SessionRead> {
  return request<SessionRead>("/api/sessions", {
    method: "POST",
    guest: true,
    headers: JSON_HEADERS,
    body: JSON.stringify(data),
  });
}

export function listSessions(params?: {
  task_id?: string;
  limit?: number;
  offset?: number;
}): Promise<SessionRead[]> {
  const query = new URLSearchParams();
  if (params?.task_id) query.set("task_id", params.task_id);
  if (params?.limit !== undefined) query.set("limit", String(params.limit));
  if (params?.offset !== undefined) query.set("offset", String(params.offset));
  const suffix = query.toString() ? `?${query.toString()}` : "";
  return request<SessionRead[]>(`/api/sessions${suffix}`, { guest: true, cache: "no-store" });
}

/** GET /api/export の結果をファイルとしてダウンロードする (ブラウザ専用)。 */
export async function downloadExport(): Promise<void> {
  const guestId = await getGuestId();
  const response = await fetch(`${resolveBaseUrl()}/api/export`, {
    headers: { "X-Guest-ID": guestId },
  });

  if (!response.ok) {
    throw new ApiError(`GET /api/export が ${response.status} を返しました`);
  }

  const disposition = response.headers.get("Content-Disposition") ?? "";
  const filenameMatch = /filename="?([^"]+)"?/.exec(disposition);
  const filename = filenameMatch?.[1] ?? "pomodoro-export.json";

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  try {
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = filename;
    anchor.click();
  } finally {
    URL.revokeObjectURL(url);
  }
}
