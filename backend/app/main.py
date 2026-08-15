"""FastAPIエントリポイント。"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import export, guest, health, sessions, tasks
from app.config import get_settings

settings = get_settings()

app = FastAPI(title=settings.app_name)

# フロントエンドの開発オリジンのみ許可する。ワイルドカードは使わない。
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["Content-Disposition"],
)

app.include_router(health.router)
app.include_router(guest.router)
app.include_router(tasks.router)
app.include_router(sessions.router)
app.include_router(export.router)
