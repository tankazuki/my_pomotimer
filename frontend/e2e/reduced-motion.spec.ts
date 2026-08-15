import { expect, test } from "@playwright/test";

import { timeLocator } from "./helpers";

test.describe("prefers-reduced-motion", () => {
  test.use({ contextOptions: { reducedMotion: "reduce" } });

  test("動きを減らす設定でも主要UIが崩れず表示される (minimal/RPG両テーマ)", async ({ page }) => {
    const pageErrors: Error[] = [];
    page.on("pageerror", (error) => pageErrors.push(error));

    await page.goto("/");

    await expect(page.getByPlaceholder("新しいタスク")).toBeVisible();
    await expect(page.getByRole("button", { name: "開始" })).toBeVisible();
    await expect(timeLocator(page)).toHaveText("25:00");

    const minimalTimeBox = await timeLocator(page).boundingBox();
    expect(minimalTimeBox?.width).toBeGreaterThan(0);
    expect(minimalTimeBox?.height).toBeGreaterThan(0);

    await page.getByRole("button", { name: "RPG表示へ" }).click();

    await expect(page.getByPlaceholder("あたらしい クエスト")).toBeVisible();
    await expect(timeLocator(page)).toHaveText("25:00");

    const rpgTimeBox = await timeLocator(page).boundingBox();
    expect(rpgTimeBox?.width).toBeGreaterThan(0);
    expect(rpgTimeBox?.height).toBeGreaterThan(0);

    expect(pageErrors).toEqual([]);
  });
});
