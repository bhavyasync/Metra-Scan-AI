import os
from pathlib import Path

# STRICT REQUIREMENT: All temporary files, model downloads, and caches on D: drive only!
D_BASE = Path(r"D:\HACKATHON\metrascan-ai")
D_TEMP = D_BASE / "temp"
D_CACHE = D_BASE / "cache"

D_TEMP.mkdir(parents=True, exist_ok=True)
D_CACHE.mkdir(parents=True, exist_ok=True)

os.environ["TEMP"] = str(D_TEMP)
os.environ["TMP"] = str(D_TEMP)
os.environ["TMPDIR"] = str(D_TEMP)
os.environ["HF_HOME"] = str(D_CACHE / "huggingface")
os.environ["TORCH_HOME"] = str(D_CACHE / "torch")
os.environ["PADDLE_HOME"] = str(D_CACHE / "paddle")

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
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
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