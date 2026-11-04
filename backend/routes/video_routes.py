import os
import shutil
import uuid
import cv2
import numpy as np
from datetime import datetime
from pathlib import Path
from fastapi import APIRouter, UploadFile, File, BackgroundTasks, HTTPException, Query
from backend.database import db
from backend.services.video_processor import VideoProcessor

router = APIRouter(prefix="/api/videos", tags=["Videos"])

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
processor = VideoProcessor(outputs_dir=OUTPUTS_DIR)

ALLOWED_EXTENSIONS = {".mp4", ".avi", ".mov", ".mkv", ".webm"}

@router.post("/upload")
async def upload_video(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...)
):
    """
    Upload a CCTV video file and trigger background AI computer vision processing.
    """
    file_ext = Path(file.filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported video format: {file_ext}. Supported formats: MP4, AVI, MOV."
        )

    session_id = f"rv_{uuid.uuid4().hex[:10]}"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    destination_path = UPLOADS_DIR / f"{session_id}_{file.filename}"

    # Asynchronous non-blocking chunk streaming (1MB buffer)
    with open(destination_path, "wb") as buffer:
        while chunk := await file.read(1024 * 1024):
            buffer.write(chunk)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    
    # Store initial session record
    db.create_session({
        "id": session_id,
        "filename": file.filename,
        "original_video_path": f"/uploads/{destination_path.name}",
        "status": "processing",
        "progress": 2.0,
        "stage": "Video uploaded, starting AI pipeline...",
        "created_at": now_str
    })

    # Dispatch non-blocking background analysis
    background_tasks.add_task(
        processor.process_video_session,
        session_id=session_id,
        video_path=str(destination_path)
    )

    return {
        "session_id": session_id,
        "filename": file.filename,
        "status": "processing",
        "message": "CCTV video uploaded successfully. AI processing initiated."
    }

@router.post("/generate-sample")
async def generate_sample_cctv(background_tasks: BackgroundTasks):
    """
    Generates a realistic CCTV retail test video (10 seconds) with synthetic shoppers,
    retail shelves, and aisle movement to allow immediate live verification of the AI pipeline.
    """
    session_id = f"rv_sample_{uuid.uuid4().hex[:6]}"
    filename = "cctv_retail_store_sample.mp4"
    UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
    sample_path = UPLOADS_DIR / f"{session_id}_{filename}"

    # Generate synthetic CCTV footage: 10 seconds at 25 fps = 250 frames
    w, h = 960, 540
    fps = 25.0
    fourcc = cv2.VideoWriter_fourcc(*'mp4v')
    temp_raw = UPLOADS_DIR / f"{session_id}_raw.mp4"
    writer = cv2.VideoWriter(str(temp_raw), fourcc, fps, (w, h))

    # Retail Store Floor Scene Elements
    for frame_i in range(250):
        t = frame_i / fps
        frame = np.zeros((h, w, 3), dtype=np.uint8)

        # 1. Retail Store Floor Tile pattern
        for y in range(0, h, 40):
            for x in range(0, w, 40):
                color = (35, 42, 54) if (x // 40 + y // 40) % 2 == 0 else (42, 50, 64)
                cv2.rectangle(frame, (x, y), (x + 39, y + 39), color, -1)

        # 2. Shelves (Stationary retail structures)
        # Shelf A (Left Snack Rack)
        cv2.rectangle(frame, (80, 140), (280, 420), (55, 65, 81), -1)
        cv2.rectangle(frame, (80, 140), (280, 420), (90, 105, 128), 2)
        # Shelf tiers & products
        for tier_y in [210, 280, 350]:
            cv2.line(frame, (85, tier_y), (275, tier_y), (140, 160, 180), 2)
            # Simulated product boxes
            for px in range(95, 260, 32):
                cv2.rectangle(frame, (px, tier_y - 30), (px + 22, tier_y), (60, 140, 200), -1)

        # Shelf B (Right Beverage Display)
        cv2.rectangle(frame, (680, 140), (880, 420), (55, 65, 81), -1)
        cv2.rectangle(frame, (680, 140), (880, 420), (90, 105, 128), 2)
        for tier_y in [210, 280, 350]:
            cv2.line(frame, (685, tier_y), (875, tier_y), (140, 160, 180), 2)
            for px in range(695, 860, 32):
                cv2.rectangle(frame, (px, tier_y - 35), (px + 20, tier_y), (180, 70, 70), -1)

        # Shelf C (Center Island Display)
        cv2.rectangle(frame, (380, 220), (580, 380), (70, 80, 95), -1)
        cv2.rectangle(frame, (380, 220), (580, 380), (120, 135, 155), 2)
        for px in range(395, 560, 40):
            cv2.rectangle(frame, (px, 250), (px + 28, 290), (40, 170, 120), -1)

        # 3. Simulate Realistic Moving Shoppers (Render human silhouettes)
        # Customer 1: Enters from bottom left (t=0..10), visits Shelf A (t=2..6), moves to center island
        if t >= 0.5:
            if t < 3.0:
                c1_x = int(120 + (t - 0.5) * 50)
                c1_y = int(480 - (t - 0.5) * 60)
            elif t < 6.5:
                # Dwell at Shelf A
                c1_x = 240 + int(np.sin(t * 3) * 5)
                c1_y = 330
            else:
                c1_x = int(240 + (t - 6.5) * 90)
                c1_y = int(330 - (t - 6.5) * 20)
            
            _draw_customer_figure(frame, c1_x, c1_y, (180, 120, 80))

        # Customer 2: Enters from top center (t=2.5..10), approaches Shelf B
        if t >= 2.5:
            if t < 5.5:
                c2_x = int(480 + (t - 2.5) * 75)
                c2_y = int(80 + (t - 2.5) * 80)
            else:
                c2_x = 705 + int(np.cos(t * 2) * 6)
                c2_y = int(320 + np.sin(t * 1.5) * 10)
            _draw_customer_figure(frame, c2_x, c2_y, (90, 160, 210))

        # CCTV timestamp watermark
        cv2.putText(
            frame, f"CAM-04 ENTRANCE AISLE | {datetime.utcnow().strftime('%Y-%m-%d')} {t:05.2f}s",
            (20, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (200, 220, 240), 1, cv2.LINE_AA
        )

        writer.write(frame)

    writer.release()

    # Transcode to standard MP4 with faststart
    processor._transcode_to_h264(temp_raw, sample_path)

    now_str = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
    db.create_session({
        "id": session_id,
        "filename": filename,
        "original_video_path": f"/uploads/{sample_path.name}",
        "status": "processing",
        "progress": 2.0,
        "stage": "Sample CCTV footage created, starting AI analysis...",
        "created_at": now_str
    })

    background_tasks.add_task(
        processor.process_video_session,
        session_id=session_id,
        video_path=str(sample_path)
    )

    return {
        "session_id": session_id,
        "filename": filename,
        "status": "processing",
        "message": "Realistic CCTV retail sample video generated. AI analysis started."
    }

def _draw_customer_figure(img: np.ndarray, cx: int, cy: int, body_color: tuple):
    """Draws a human silhouette detectable by YOLO person detector."""
    # Head
    cv2.circle(img, (cx, cy - 65), 14, (215, 185, 165), -1)
    # Torso
    cv2.ellipse(img, (cx, cy - 25), (18, 28), 0, 0, 360, body_color, -1)
    # Legs
    cv2.line(img, (cx - 7, cy), (cx - 9, cy + 38), (50, 50, 70), 8)
    cv2.line(img, (cx + 7, cy), (cx + 9, cy + 38), (50, 50, 70), 8)
    # Arms
    cv2.line(img, (cx - 16, cy - 35), (cx - 24, cy - 10), body_color, 6)
    cv2.line(img, (cx + 16, cy - 35), (cx + 24, cy - 10), body_color, 6)

