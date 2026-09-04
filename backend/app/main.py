import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parents[1]

TEMP_DIR = BASE_DIR / "temp"
CACHE_DIR = BASE_DIR / "cache"

TEMP_DIR.mkdir(parents=True, exist_ok=True)
CACHE_DIR.mkdir(parents=True, exist_ok=True)

os.environ["TEMP"] = str(TEMP_DIR)
os.environ["TMP"] = str(TEMP_DIR)
os.environ["TMPDIR"] = str(TEMP_DIR)

os.environ["HF_HOME"] = str(CACHE_DIR / "huggingface")
os.environ["TORCH_HOME"] = str(CACHE_DIR / "torch")
os.environ["PADDLE_HOME"] = str(CACHE_DIR / "paddle")

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.scan import router as scan_router
from app.api.reports import router as reports_router
from app.api.notices import router as notices_router


app = FastAPI(
    title="MetraScan AI API",
    description="AI-assisted packaged commodity screening and declaration analysis.",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(scan_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(notices_router, prefix="/api")


@app.get("/")
def root():
    return {
        "status": "ok",
        "message": "MetraScan AI API is running",
    }