import os
import sys
from pathlib import Path

# Automatically add project root to sys.path so imports work regardless of working directory
ROOT_DIR = Path(__file__).resolve().parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Configure writable paths for sandboxed environment
os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.database import db
from backend.routes.video_routes import router as video_router
from backend.routes.analysis_routes import router as analysis_router
from backend.routes.report_routes import router as report_router

BASE_DIR = Path(__file__).resolve().parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
EVIDENCE_DIR = OUTPUTS_DIR / "evidence"

UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)
EVIDENCE_DIR.mkdir(parents=True, exist_ok=True)

# Initialize database schema
db.init_db()

app = FastAPI(
    title="RetailVision AI API",
    description="Enterprise AI-Powered Retail Intelligence Platform",
    version="1.0.0"
)

# Enable CORS for local Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static file access for videos, heatmaps, and evidence frames
app.mount("/outputs", StaticFiles(directory=str(OUTPUTS_DIR)), name="outputs")
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

# Include Routers
app.include_router(video_router)
app.include_router(analysis_router)
app.include_router(report_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "RetailVision AI Backend",
        "version": "1.0.0"
    }

# Mount React Production Build at root for unified single-port serving
FRONTEND_DIST = ROOT_DIR / "frontend" / "dist"
if FRONTEND_DIST.exists():
    app.mount("/", StaticFiles(directory=str(FRONTEND_DIST), html=True), name="frontend")

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    is_dev = os.environ.get("ENVIRONMENT", "production").lower() == "development"
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=is_dev)
