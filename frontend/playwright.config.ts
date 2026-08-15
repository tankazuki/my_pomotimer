import path from "node:path";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E用のバックエンド (uvicorn) とフロントエンド (Next.js / Turbopack dev server) を
 * webServer で自動起動する。開発中のDB (backend/app.db) を汚さないよう、
 * バックエンドには専用のDATABASE_URL (backend/e2e.db, .gitignoreの `backend/*.db` に含まれる)
 * を渡す。
 */
const BACKEND_DIR = path.join(__dirname, "..", "backend");
const BACKEND_URL = "http://127.0.0.1:8000";
const FRONTEND_URL = "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: {
    baseURL: FRONTEND_URL,
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: "uv run uvicorn app.main:app --host 127.0.0.1 --port 8000",
      cwd: BACKEND_DIR,
      url: `${BACKEND_URL}/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 60_000,
      env: {
        DATABASE_URL: "sqlite:///./e2e.db",
        CORS_ORIGINS: FRONTEND_URL,
      },
    },
    {
      command: "npm run dev",
      cwd: __dirname,
      url: FRONTEND_URL,
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
});
