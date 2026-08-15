import { expect, type Page } from "@playwright/test";

/** 画面中央の残り時間表示 (mm:ss)。テーマ (minimal/RPG) を問わず1つだけ存在する想定。 */
export function timeLocator(page: Page) {
  return page.getByText(/^\d{2}:\d{2}$/);
}

export async function readRemainingSeconds(page: Page): Promise<number> {
  const locator = timeLocator(page);
  await expect(locator).toHaveCount(1);
  const text = (await locator.textContent())?.trim() ?? "";
  const match = /^(\d{2}):(\d{2})$/.exec(text);
  if (!match) throw new Error(`想定しない時刻表示: "${text}"`);
  return Number(match[1]) * 60 + Number(match[2]);
}

export function themeToggleButton(page: Page) {
  return page.getByRole("button", { name: /表示へ$/ });
}

export async function addTaskInMinimalView(page: Page, title: string): Promise<void> {
  await page.getByPlaceholder("新しいタスク").fill(title);
  await page.getByRole("button", { name: "追加" }).click();
}
