"use client";

import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  ensureSoundPreferenceHydrated,
  isSoundEnabled,
  setSoundEnabled,
  subscribeSoundEnabled,
} from "@/lib/sound";

type UseSoundResult = {
  soundEnabled: boolean;
  toggleSound: () => void;
};

function getServerSnapshot(): boolean {
  return true;
}

/** lib/sound.ts のモジュールスコープ状態をReactに橋渡しする薄いフック。 */
export function useSound(): UseSoundResult {
  const soundEnabled = useSyncExternalStore(subscribeSoundEnabled, isSoundEnabled, getServerSnapshot);

  // localStorage読み出しはマウント後のuseEffectで行う (hydration不一致を避けるため)。
  useEffect(() => {
    ensureSoundPreferenceHydrated();
  }, []);

  const toggleSound = useCallback(() => {
    setSoundEnabled(!isSoundEnabled());
  }, []);

  return { soundEnabled, toggleSound };
}
