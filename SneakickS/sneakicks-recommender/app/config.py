import os
from pathlib import Path

from dotenv import load_dotenv

ROOT = Path(__file__).resolve().parent.parent

# .env rieng cua dich vu (neu co) duoc uu tien; thieu bien nao thi lay tu .env cua backend.
load_dotenv(ROOT / ".env")
load_dotenv(ROOT.parent / "sneakicks-backend" / ".env")


def db_params() -> dict:
    return {
        "host": os.getenv("DB_HOST", "localhost"),
        "port": int(os.getenv("DB_PORT", "5432")),
        "dbname": os.getenv("DB_NAME", "sneakicks"),
        "user": os.getenv("DB_USER", "postgres"),
        "password": os.getenv("DB_PASSWORD", "postgres"),
    }


REFRESH_SECONDS = int(os.getenv("REC_REFRESH_SECONDS", "300"))
TRENDING_HALF_LIFE_DAYS = float(os.getenv("REC_TRENDING_HALF_LIFE_DAYS", "7"))
TRENDING_WINDOW_DAYS = float(os.getenv("REC_TRENDING_WINDOW_DAYS", "30"))
