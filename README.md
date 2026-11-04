# RetailVision AI — AI-Powered Retail Intelligence Platform

RetailVision AI transforms raw CCTV security camera recordings into actionable retail business intelligence and automated merchandising decisions using local Computer Vision, Deep Learning, and Rule-Based AI.

Every metric, heatmap, shelf interaction, customer timeline, and store recommendation is generated strictly from the actual video footage uploaded by the user.

---

## Key Capabilities & Workflow

1. **CCTV Video Ingestion**:
   - Accepts MP4, AVI, MOV footage with 1MB asynchronous chunk streaming.
   - Non-blocking background processing with live progress status.
   - Built-in synthetic CCTV test generator for immediate live verification.

2. **Computer Vision & Tracking**:
   - **YOLOv8**: Accurate person and retail fixture detection. Apple Silicon Metal (`mps`) GPU accelerated.
   - **ByteTrack**: Multi-object tracking assigning persistent temporary customer IDs (`Customer #01`, `Customer #02`).
   - **Foot Movement Trails**: Trajectory paths and spatial waypoints mapped directly across the retail floor.

3. **Automatic Shelf Recognition**:
   - Discovers visible shelf units and product racks automatically using edge contours and stationary product clustering.
   - Assigns dynamic identifiers (`Shelf A`, `Shelf B`, `Shelf C`).
   - Computes shelf coordinates, customer proximity, dwell time, and engagement ranking.

4. **Product Interaction & Behaviour Intelligence**:
   - **YOLOv8-Pose Keypoints**: Human wrist and hand proximity tracking gated by shelf boundaries to maximize throughput.
   - Detects shelf approach, dwell, possible product pickup, and possible examination across multiple video frames.
   - **Evidence Viewer**: Automatically saves visual frame snapshots with timestamp badges for every detected event.

5. **Video-Specific Spatial Movement Heatmaps**:
   - Generates resolution-adaptive Gaussian thermal heatmaps overlaid directly onto the CCTV background.
   - Identifies high-traffic hotspots and underutilized cold zones / blind spots.

6. **AI Merchandising & Decision-Support Recommendation Engine**:
   - **Shelf Placement Optimization**: Reallocates high-margin SKUs to established high-dwell fixtures; slows transit speed on walk-through aisles.
   - **Store Layout Improvements**: Discovers funneling corridors and recommends navigational aisle clearance ($\ge 4.5\text{ ft}$).
   - **Product Visibility Improvements**: Identifies browsing friction (high dwell with 0 physical reaches) and eye-level grab geometry.
   - **Traffic & Congestion Optimization**: Mitigates peak shopper bottleneck overlap between customer trajectories.
   - **Shelf Availability & Replenishment**: Flags front-facing stock depletion from verified pickup events and analyzes product returns.
   - **Low-Engagement Area Improvements**: Revitalizes thermal cold zones through anchor staples and targeted illumination.
   - **Strict Telemetry Grounding**: Every recommendation provides:
     - 1. Observation from video analysis.
     - 2. Reason behind the observation.
     - 3. Suggested action.
     - 4. Supporting metrics and video evidence with exact timestamps and visual snapshots.
     - 5. Priority level (`High`, `Medium`, `Low`).

7. **Enterprise Reports & Data Export**:
   - Executive PDF intelligence report generated dynamically via **ReportLab**.
   - Structured quantitative event log export via **Pandas** CSV.
   - Side-by-side session comparison tool to benchmark store layouts and traffic shifts.

---

## Strict Data Integrity Principles

- **No Dummy Data**: Zero hardcoded counts, fake percentages, or simulated timelines.
- **Independent Sessions**: Every uploaded video creates its own SQLite session and dedicated analytics.
- **Evidence-Backed**: Every shelf interaction links to frame number, timestamp, and saved evidence frame.
- **CCTV Compliance Notice**: Clearly clarifies that CCTV computer vision detects visual interactions only and cannot verify financial transactions without Point of Sale (POS) integration.

---

## Technology Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Recharts, Lucide React
- **Backend**: FastAPI, Uvicorn, SQLite3, Pydantic
- **Computer Vision**: Ultralytics YOLOv8, ByteTrack (`lapx`), YOLOv8-Pose, OpenCV, NumPy
- **Transcoding**: `imageio-ffmpeg` (Faststart H.264 MP4 for browser playback)
- **Reporting**: ReportLab (PDF), Pandas (CSV)

---

## Quick Start

### 1. Launch Platform
Run the startup script from the root directory:

```bash
./start.sh
```

Or run backend and frontend independently:

```bash
# Terminal 1: Backend
python3 -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 2. Access the Application
- **Web Dashboard**: [http://localhost:5173](http://localhost:5173)
- **Interactive REST API**: [http://localhost:8000/docs](http://localhost:8000/docs)

### 3. Usage
1. Open the dashboard in your browser.
2. Navigate to **Video Analysis**.
3. Upload any retail CCTV recording (or click **Generate Sample CCTV** for instant testing).
4. Watch the live AI processing progress bar.
5. Explore the 6 dashboard sections:
   - **Overview**: Executive metric cards, shelf rankings, and AI layout recommendations.
   - **Video Analysis**: Side-by-side original and AI-annotated video playback.
   - **Traffic & Shelves**: Recognized shelves, bounding boxes, and spatial heatmaps.
   - **Customer Intelligence**: Customer timelines, movement trails, and Evidence Viewer snapshots.
   - **AI Recommendations**: Actionable store merchandising decisions with priority, reason, action, and visual frame proof.
   - **Reports & History**: PDF/CSV exports, session history, and session comparison tool.
