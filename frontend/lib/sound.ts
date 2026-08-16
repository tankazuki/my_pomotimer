/**
 * Web Audio API による効果音再生。依存追加なしで実装する。
 * AudioContextはモジュールスコープで遅延生成する (初回のユーザー操作時に生成し、
 * ページロード時に自動生成しない。ブラウザの自動再生ポリシー対策)。
 */

const SOUND_ENABLED_KEY = "pomodoro:sound-enabled";

let audioContext: AudioContext | null = null;
let soundEnabled = true;

/** サウンドON/OFF状態もモジュールスコープの外部ストアとして持つ (hooks/use-timer.tsxや
 * hooks/use-theme.tsxと同じ設計方針)。React側へは useSyncExternalStore で橋渡しする。 */
const listeners = new Set<() => void>();
let hasHydratedFromStorage = false;

function notify(): void {
  for (const listener of listeners) listener();
}

export function subscribeSoundEnabled(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (audioContext) return audioContext;

  const AudioContextCtor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextCtor) return null;

  audioContext = new AudioContextCtor();
  return audioContext;
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

export function setSoundEnabled(value: boolean): void {
  if (value === soundEnabled) return;
  soundEnabled = value;
  try {
    window.localStorage.setItem(SOUND_ENABLED_KEY, value ? "1" : "0");
  } catch {
    // 保存できなくてもサウンド設定自体は動作を続ける
  }
  notify();
}

/** マウント後に一度だけlocalStorageから復元する (ハイドレーション不一致を避けるため)。 */
export function ensureSoundPreferenceHydrated(): void {
  if (hasHydratedFromStorage) return;
  hasHydratedFromStorage = true;
  try {
    const raw = window.localStorage.getItem(SOUND_ENABLED_KEY);
    if (raw !== null && raw !== (soundEnabled ? "1" : "0")) {
      soundEnabled = raw === "1";
      notify();
    }
  } catch {
    // localStorageが使えない場合は既定値 (ON) のまま
  }
}

export function playClickSound(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "square";
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.setValueAtTime(880, now + 0.04);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch {
    // オーディオ再生に失敗しても操作自体は継続する
  }
}

export function playCompleteFanfare(): void {
  if (!soundEnabled) return;
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const noteOsc = ctx.createOscillator();
      const noteGain = ctx.createGain();
      noteOsc.type = "square";
      noteOsc.frequency.setValueAtTime(freq, now + idx * 0.12);
      noteGain.connect(ctx.destination);
      noteOsc.connect(noteGain);
      noteGain.gain.setValueAtTime(0.12, now + idx * 0.12);
      noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.2);
      noteOsc.start(now + idx * 0.12);
      noteOsc.stop(now + idx * 0.12 + 0.2);
    });
  } catch {
    // オーディオ再生に失敗しても操作自体は継続する
  }
}
