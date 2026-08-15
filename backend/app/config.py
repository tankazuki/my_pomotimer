"""アプリケーション設定。

設定値はすべて環境変数 (または .env) から読む。
コード内へのハードコードは禁止 (デプロイ先ごとに差し替えるため)。
"""

from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_name: str = "my-app backend"

    # 開発時は SQLite。デプロイ時は DATABASE_URL を PostgreSQL に向けるだけで
    # 切り替わるようにしておく (例: postgresql+psycopg://user:pass@host/db)。
    database_url: str = "sqlite:///./app.db"

    # 許可するフロントエンドのオリジン。カンマ区切りで複数指定できる。
    # 本番でワイルドカード ("*") は使わない。
    cors_origins: str = "http://localhost:3000"

    @property
    def cors_origin_list(self) -> list[str]:
        """カンマ区切りの cors_origins をリストに変換する。

        list[str] を直接フィールドにすると環境変数に JSON を書く必要があり、
        .env が読みにくくなるため文字列で受けてここで分割する。
        """
        return [
            origin.strip() for origin in self.cors_origins.split(",") if origin.strip()
        ]


@lru_cache
def get_settings() -> Settings:
    """設定はプロセス内で使い回す (毎回 .env を読みにいかない)。"""
    return Settings()
