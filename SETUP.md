# Webアプリ開発環境 セットアップ手順 (FastAPI + Next.js / Windows)

## 0. 前提

- Claude Code インストール済み
- Python 3.12+ / Node.js 20+ インストール済み
- このフォルダ一式を、新規プロジェクトのルートに展開して使う

## 1. バックエンド (FastAPI) の初期化

```
mkdir backend
cd backend
pip install uv
uv init --python 3.12
uv add fastapi "uvicorn[standard]" sqlalchemy alembic pydantic-settings
uv add --dev ruff mypy pytest httpx
cd ..
```

## 2. フロントエンド (Next.js) の初期化

```
npx create-next-app@latest frontend --typescript --tailwind --app --eslint
cd frontend
npm install framer-motion
npx shadcn@latest init
cd ..
```

`create-next-app` の対話プロンプトは基本デフォルトでよい。
src/ ディレクトリ構成を使うかは任意 (CLAUDE.mdの記述と揃えれば
どちらでも問題ない)。

## 3. 最小構成の作成

Claude Code 起動後、最初にこう指示すればよい:

「CLAUDE.md のアーキテクチャ原則に従って、最小構成を作って。
 バックエンドは /health エンドポイント、pydantic-settingsの
 Settingsクラス、backend/.env.example、SQLite接続のdb.py、
 CORS設定 (frontendのオリジンを許可)。
 フロントエンドはトップページから /health を叩いて結果を表示する
 だけの画面と、Framer Motionでのフェードインアニメーションを1つ。
 動作確認もして。」

## 4. .gitignore と初回コミット

.gitignore に最低限含めるもの:

```
backend/.venv/
backend/__pycache__/
backend/*.db
backend/.env
frontend/node_modules/
frontend/.next/
frontend/.env.local
```

その後:

```
git init
git add .
git commit -m "chore: initial setup"
```

## 5. 起動と動作確認

バックエンド:
```
cd backend
uv run uvicorn app.main:app --reload
```
http://127.0.0.1:8000/docs で Swagger UI が開けば成功。

フロントエンド (別ターミナル):
```
cd frontend
npm run dev
```
http://localhost:3000 が開けば成功。

`frontend/.env.local` に以下を設定してAPIの接続先を指定する:
```
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000
```

## 6. Playwright MCPの接続 (推奨)

画面実装後、Claude Codeが実際にブラウザで動作確認できるようになる。
アニメーションの見た目確認にも使える。

```
claude mcp add playwright -- npx @playwright/mcp@latest
```

## 7. 運用フロー

### 大きめの機能 (新テーブル・新画面・認証)
1. やりたいことを自然言語で伝える → planner が計画を作る
   (この時点でAPI仕様が固まる) → 承認
2. backend-coder と frontend-coder が並列で実装
3. reviewer が差分レビュー → 指摘があれば修正
4. tester がテスト追加・実行 (pytest + Playwright)
5. Hooks が backend/frontend それぞれのlint/typecheck/buildの最終安全網

### 小さな修正
- 「〇〇を直して」だけでOK (planner はスキップされる)

## 8. データベースの扱い

- 開発中: SQLite (backend/内にファイル1つ)
- スキーマ変更は必ず「マイグレーションを作って」と Alembic 経由で
- デプロイ時: 環境変数 DATABASE_URL を PostgreSQL に向けるだけで
  切り替わる設計を CLAUDE.md で強制している

## 9. 将来デプロイするときに効いてくる設計 (設定済み)

- バックエンドの設定値はすべて環境変数 → デプロイ先の環境変数設定だけで動く
- フロントエンドの `NEXT_PUBLIC_API_BASE_URL` を本番APIのURLに
  差し替えるだけで接続先が切り替わる
- SQLite固有機能を避けるルール → PostgreSQL移行がスムーズ
- デプロイ段階になったら「バックエンドとフロントエンドそれぞれの
  Dockerfileと本番用設定を作って。reviewerにデプロイ前の総点検も
  させて」と指示すればよい

## 補足: Hooksについて

`.claude/settings.json` の保存時フォーマットは、拡張子を問わず
ruff format と prettier の両方を試す簡易的な作りになっている。
片方は必ずエラーになるが無視される設計 (動作に影響なし)。
セッション終了時のチェックは backend/ と frontend/ の存在を見て
それぞれのlint/typecheck/buildを実行する。プロジェクト構成を
変えた場合はこのファイルのパスも合わせて調整すること。
