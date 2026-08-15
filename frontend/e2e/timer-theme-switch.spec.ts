import { expect, test } from "@playwright/test";

import { readRemainingSeconds, themeToggleButton } from "./helpers";

const SWITCH_COUNT = 6;
const ADVANCE_MS = 4_000;

/**
 * 本機能の中核要件: タイマー稼働中にテーマ (minimal/RPG) を連続切替しても、
 * 表示される残り時間が単調減少すること (逆戻りしない・止まらない・ジャンプしない) を検証する。
 * TimerProvider が ThemeProvider の外側にあり (components/providers.tsx)、テーマ切替で
 * 再マウントされない設計になっていることの回帰テスト。
 */
test("タイマー稼働中にテーマを連続切替しても残り時間は単調減少する", async ({ page }) => {
  await page.clock.install({ time: new Date() });
  await page.goto("/");

  await page.getByRole("button", { name: "開始" }).click();

  const readings: number[] = [await readRemainingSeconds(page)];

  for (let i = 0; i < SWITCH_COUNT; i++) {
    await themeToggleButton(page).click();
    await page.clock.runFor(ADVANCE_MS);
    readings.push(await readRemainingSeconds(page));
  }

  for (let i = 1; i < readings.length; i++) {
    const delta = readings[i - 1] - readings[i];
    // 止まらない・逆戻りしない: 経過時間分は必ず減っている。
    expect(delta, `${i}回目のテーマ切替後に残り時間が減っていない`).toBeGreaterThan(0);
    // ジャンプしない: 4秒の経過に対して不自然に大きく減っていない。
    expect(delta, `${i}回目のテーマ切替後に残り時間が不自然にジャンプした`).toBeLessThanOrEqual(6);
  }
});
