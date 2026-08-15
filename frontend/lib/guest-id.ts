/**
 * Guest ID (localStorageに保存するUUID) の解決。
 * 未発行なら POST /api/guest でサーバーに新規発行してもらい、以後はlocalStorageの値を使い回す。
 */

import { createGuest } from "@/lib/api";

const STORAGE_KEY = "pomodoro:guestId";

let guestIdPromise: Promise<string> | null = null;

function readStoredGuestId(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

function storeGuestId(id: string): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // プライベートブラウジング等でlocalStorageが使えない場合は永続化を諦める
  }
}

export function getGuestId(): Promise<string> {
  if (guestIdPromise) return guestIdPromise;

  guestIdPromise = (async () => {
    const stored = readStoredGuestId();
    if (stored) return stored;

    const guest = await createGuest();
    storeGuestId(guest.id);
    return guest.id;
  })();

  return guestIdPromise;
}
