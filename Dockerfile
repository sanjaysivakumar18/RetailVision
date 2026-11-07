# ==========================================
# Stage 1: Build Frontend React Application
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ==========================================
# Stage 2: Production Python & CV Runtime
# ==========================================
FROM python:3.11-slim AS runtime

# Install system dependencies for OpenCV and FFmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libglib2.0-0 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python requirements
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend source code, models, and scripts
COPY backend/ ./backend/
COPY models/ ./models/
COPY run.py ./

# Copy built frontend production artifacts from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Configure environment variables
ENV PYTHONUNBUFFERED=1
ENV PORT=8000
ENV YOLO_CONFIG_DIR=/tmp/ultralytics
ENV MPLCONFIGDIR=/tmp/matplotlib

EXPOSE 8000

# Run FastAPI unified backend serving both REST API and React UI
CMD ["sh", "-c", "python3 -m uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8000}"]

