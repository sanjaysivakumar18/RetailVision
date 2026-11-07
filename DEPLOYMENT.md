# RetailVision AI — Deployment Guide

This guide covers deployment options for **RetailVision AI**, from 1-click cloud platforms to Docker containers and cloud virtual machines.

---

## Architecture Overview

RetailVision AI is architected for **unified single-port production serving**:
- The FastAPI backend serves the React production build directly at `/`.
- REST API endpoints are mounted under `/api/*`.
- CCTV output videos, heatmaps, and evidence snapshots are served under `/outputs/*`.
- Dynamic cloud port binding is handled automatically via `PORT` (e.g. Render, Railway, Fly.io, Cloud Run).

```
   ┌────────────────────────────────────────────────────────┐
   │                  RetailVision AI Server                 │
   │                                                        │
   │   GET /                  ──> React Production SPA      │
   │   GET /api/*             ──> FastAPI REST Endpoints    │
   │   GET /outputs/*         ──> Static Video / Heatmaps   │
   │   POST /api/videos/upload──> OpenCV / YOLO Pipeline    │
   └────────────────────────────────────────────────────────┘
```

---

## Option 1: Docker (Recommended for Any Cloud or Local Server)

The repository includes a multi-stage `Dockerfile` and `docker-compose.yml`.

### Quick Run with Docker Compose:
```bash
docker compose up --build -d
```
Access the application at: **`http://localhost:8000`**

### Run with Docker directly:
```bash
# 1. Build the image
docker build -t retailvision:latest .

# 2. Run the container
docker run -p 8000:8000 -v $(pwd)/backend/outputs:/app/backend/outputs retailvision:latest
```

---

## Option 2: Deploy to Railway

Railway is ideal for computer vision applications due to generous resource limits and automatic Dockerfile detection.

1. Create a free account at [Railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `sanjaysivakumar18/RetailVision`.
4. Railway will automatically detect the `Dockerfile` and build both the frontend and backend.
5. In **Variables**, add:
   - `PORT=8000`
   - `PYTHONUNBUFFERED=1`
6. (Optional) Under **Volumes**, add a persistent volume mounted to `/app/backend/outputs` so processed videos and evidence frames persist across redeployments.
7. Click **Generate Domain** to get your public URL (e.g. `https://retailvision.up.railway.app`).

---

## Option 3: Deploy to Render

1. Create an account at [Render.com](https://render.com).
2. Click **New** → **Web Service**.
3. Connect your GitHub repository `sanjaysivakumar18/RetailVision`.
4. Configure settings:
   - **Environment**: `Docker`
   - **Branch**: `main`
   - **Plan**: Starter or Standard (recommended for ML inference)
5. Add Environment Variables:
   - `PYTHONUNBUFFERED` = `1`
6. Click **Create Web Service**. Render will build the Docker container and deploy the app with automatic SSL (`https://retailvision.onrender.com`).

---

## Option 4: Deploy to a Cloud VPS (AWS EC2 / DigitalOcean / GCP / Linode)

For dedicated Ubuntu 22.04 / 24.04 servers:

```bash
# 1. Clone repository
git clone https://github.com/sanjaysivakumar18/RetailVision.git
cd RetailVision

# 2. Install system packages
sudo apt update && sudo apt install -y python3-pip python3-venv ffmpeg libgl1-mesa-glx nodejs npm

# 3. Build frontend
cd frontend
npm install
npm run build
cd ..

# 4. Set up Python virtual environment
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# 5. Run with Systemd or Uvicorn
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

---

## Pre-Deployment Checklist

- [x] Multi-stage `Dockerfile` with Node.js builder & Python 3.11 runtime
- [x] Headless OpenCV (`opencv-python-headless`) to avoid missing X11/GUI libraries
- [x] ByteTrack Hungarian assignment (`lapx`) included in `requirements.txt`
- [x] Dynamic environment port binding (`PORT` env variable)
- [x] Unified single-port static mounting of React frontend build at `/`
- [x] Resilient offline model loading with automatic Ultralytics fallback
- [x] Persistent upload and output directories (`.gitkeep` preserved)
- [x] Strict data integrity verification (zero dummy analytics)

