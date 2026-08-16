import { expect, test } from "@playwright/test";

import { addTaskInMinimalView } from "./helpers";

/**
 * 実際のバックエンド (playwright.config.ts の webServer) に対して通すE2E。APIはモックしない。
 * page.clock はバックエンドAPI呼び出し (fetch) には影響せず、setTimeout/setInterval/Date/rAFのみを
 * 制御する。install直後は実時間と同期して進むため、通常の画面操作・アニメーションはそのまま働き、
 * runFor()を呼んだ区間だけ時間を高速に進められる (25分の実待機を避けるため)。
 */
test("タスク作成→タイマー開始→テーマ切替→完了でcompleted_pomodorosがUIに反映される", async ({
  page,
}) => {
  await page.clock.install({ time: new Date() });
  await page.goto("/");

  const taskTitle = "レポート作成";
  await addTaskInMinimalView(page, taskTitle);

  const taskRow = page.locator("li", { hasText: taskTitle });
  await expect(taskRow).toBeVisible();
  await taskRow.getByRole("button", { name: taskTitle, exact: true }).click();

  await page.getByRole("button", { name: "開始" }).click();
  await expect(page.getByText(`しゅうちゅう ・ ${taskTitle}`)).toBeVisible();

  await page.getByRole("button", { name: "RPG表示へ" }).click();
  await expect(page.getByText(`${taskTitle} に しゅうちゅうしている...`)).toBeVisible();

  // WORKセッション (25分) を完了させる。runFor だと250ms間隔のtickを6000回近く律儀に処理してしまい
  // 実時間で遅すぎるため、区間内の未発火タイマーを1回だけ処理するfastForwardで一気に進める。
  await page.clock.fastForward("25:05");

  // 完了後は次のセッション (1回目のWORK完了後なのでSHORT_BREAK) がidleで待機する。
  await expect(page.getByText("「たたかう」で きゅうけいに はいろう。")).toBeVisible();

  // POST /api/sessions によりcompleted_pomodorosがサーバー側で+1され、
  // notifyTaskSessionRecorded経由でタスク一覧が再取得されてUIに反映される。
  await expect(page.locator("li", { hasText: taskTitle })).toContainText("1/1");
});
