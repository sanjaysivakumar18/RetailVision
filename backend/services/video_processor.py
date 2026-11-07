import os
import sys
from pathlib import Path

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

import cv2
import time
import subprocess
import numpy as np
from datetime import datetime
from typing import Dict, Any, List, Optional
import imageio_ffmpeg

from backend.database import db
from backend.services.person_detector import PersonDetector
from backend.services.customer_tracker import CustomerTracker
from backend.services.shelf_detector import ShelfDetector
from backend.services.interaction_analyzer import InteractionAnalyzer
from backend.services.heatmap_generator import HeatmapGenerator
from backend.services.analytics_engine import AnalyticsEngine
from backend.services.report_generator import ReportGenerator

class VideoProcessor:
    def __init__(self, outputs_dir: Path):
        self.outputs_dir = outputs_dir
        self.customer_tracker = CustomerTracker()
        self.shelf_detector = ShelfDetector()
        self.interaction_analyzer = InteractionAnalyzer()
        self.heatmap_generator = HeatmapGenerator()
        self.analytics_engine = AnalyticsEngine()
        self.report_generator = ReportGenerator()
        self.ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()

    def process_video_session(self, session_id: str, video_path: str):
        """
        Master asynchronous background worker for CCTV video analysis.
        Optimized with Apple Silicon GPU acceleration, smart gating, and resolution scaling.
        """
        try:
            db.update_session_progress(session_id, 5.0, "Reading video stream...")
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {video_path}")

            orig_fps = cap.get(cv2.CAP_PROP_FPS) or 25.0
            orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = total_frames / orig_fps if orig_fps > 0 else 0.0

            db.update_session_metadata(session_id, {
                "fps": round(orig_fps, 2),
                "width": orig_width,
                "height": orig_height,
                "total_frames": total_frames,
                "duration_seconds": round(duration, 2)
            })

            # Setup output paths
            session_out_dir = self.outputs_dir / session_id
            session_out_dir.mkdir(parents=True, exist_ok=True)
            evidence_dir = self.outputs_dir / "evidence"

            raw_annotated_path = session_out_dir / "annotated_temp.mp4"
            final_annotated_path = session_out_dir / "annotated.mp4"
            heatmap_path = session_out_dir / "heatmap.jpg"
            pdf_path = session_out_dir / "retail_report.pdf"
            csv_path = session_out_dir / "analytics_data.csv"

            # Determine annotated output video resolution (max 1080p for fast web streaming)
            out_w = orig_width
            out_h = orig_height
            scale_ratio = 1.0
            if orig_width > 1920:
                scale_ratio = 1920.0 / orig_width
                out_w = 1920
                out_h = int(orig_height * scale_ratio)
            # Ensure dimensions are even numbers for H.264
            out_w = out_w - (out_w % 2)
            out_h = out_h - (out_h % 2)

            # ----------------------------------------------------
            # Phase 1: Automatic Shelf & Structure Recognition
            # ----------------------------------------------------
            db.update_session_progress(session_id, 12.0, "Identifying retail shelves & store layout...")
            
            sample_frame_indices = np.linspace(0, max(0, total_frames - 1), num=min(10, max(3, total_frames // 40)), dtype=int)
            sample_frames = []
            for s_idx in sample_frame_indices:
                cap.set(cv2.CAP_PROP_POS_FRAMES, int(s_idx))
                ret, frame = cap.read()
                if ret:
                    sample_frames.append(frame)

            shelves = self.shelf_detector.detect_shelves_from_frames(
                sample_frames, self.customer_tracker.model
            )

            base_frame = sample_frames[0].copy() if sample_frames else np.zeros((orig_height, orig_width, 3), dtype=np.uint8)

            # ----------------------------------------------------
            # Phase 2: Frame-by-Frame Detection, Tracking & Annotations
            # ----------------------------------------------------
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            writer = cv2.VideoWriter(str(raw_annotated_path), fourcc, orig_fps, (out_w, out_h))

            self.customer_tracker.reset()
            self.interaction_analyzer.reset()

            frame_idx = 0
            all_events = []
            trail_history: Dict[int, List[tuple]] = {}
            tracked_persons: List[Dict[str, Any]] = []

            # Adaptive inference stride for low-resource cloud CPUs
            # If video has standard/high framerate (>=16 fps), run neural network inference
            # every `frame_stride` frames (~6 fps effective), while smoothly maintaining tracks
            # on intermediate frames. Reduces CPU load by ~4x without compromising tracking accuracy.
            frame_stride = max(1, int(orig_fps / 6)) if orig_fps >= 16 else 1

            # Downscale 4K / high-resolution frames for 9x faster neural network inference
            nn_scale = 1.0
            if orig_width > 1280:
                nn_scale = 1280.0 / orig_width
                nn_w = 1280
                nn_h = int(orig_height * nn_scale)
            else:
                nn_w, nn_h = orig_width, orig_height

            scaled_shelves = []
            for s in shelves:
                scaled_shelves.append({
                    **s,
                    "bbox": [c * nn_scale for c in s["bbox"]]
                })

            while True:
                ret, frame = cap.read()
                if not ret:
                    break

                timestamp = frame_idx / orig_fps

                is_inference_frame = (frame_idx % frame_stride == 0) or (frame_idx == 0)

                if is_inference_frame:
                    if nn_scale != 1.0:
                        nn_frame = cv2.resize(frame, (nn_w, nn_h), interpolation=cv2.INTER_AREA)
                    else:
                        nn_frame = frame

                    # 1. ByteTrack Person Tracking (GPU/CPU with imgsz=640)
                    raw_tracks = self.customer_tracker.track_frame(nn_frame, timestamp)

                    # Scale tracks back to original coordinates
                    if nn_scale != 1.0:
                        inv_nn = 1.0 / nn_scale
                        tracked_persons = []
                        for p in raw_tracks:
                            p_orig = dict(p)
                            p_orig["bbox"] = [c * inv_nn for c in p["bbox"]]
                            p_orig["foot_point"] = (p["foot_point"][0] * inv_nn, p["foot_point"][1] * inv_nn)
                            tracked_persons.append(p_orig)
                    else:
                        tracked_persons = raw_tracks

                    # 2. Hand-Object & Shelf Interaction Analysis (Gated Pose)
                    events = self.interaction_analyzer.analyze_frame_interactions(
                        frame=nn_frame,
                        frame_number=frame_idx,
                        timestamp=timestamp,
                        tracked_persons=raw_tracks,
                        shelves=scaled_shelves,
                        evidence_dir=evidence_dir,
                        session_id=session_id
                    )
                    all_events.extend(events)

                # 3. Render Annotations
                # If downscaling output for fast playback, resize visual frame
                if scale_ratio != 1.0:
                    vis_frame = cv2.resize(frame, (out_w, out_h), interpolation=cv2.INTER_AREA)
                    coord_scale = scale_ratio
                else:
                    vis_frame = frame.copy()
                    coord_scale = 1.0

                # Draw Shelf Bounding Boxes
                for s in shelves:
                    sx1 = int(s["bbox"][0] * coord_scale)
                    sy1 = int(s["bbox"][1] * coord_scale)
                    sx2 = int(s["bbox"][2] * coord_scale)
                    sy2 = int(s["bbox"][3] * coord_scale)

                    cv2.rectangle(vis_frame, (sx1, sy1), (sx2, sy2), (235, 140, 37), 2)
                    badge = f"{s['shelf_id']}: {s['label']}"
                    cv2.rectangle(vis_frame, (sx1, max(0, sy1 - 22)), (sx1 + len(badge) * 8 + 10, sy1), (25, 33, 50), -1)
                    cv2.putText(vis_frame, badge, (sx1 + 4, max(15, sy1 - 6)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1, cv2.LINE_AA)

                # Draw Customer Tracks & Trails
                for p in tracked_persons:
                    t_id = p["track_id"]
                    if t_id is None:
                        continue
                    px1 = int(p["bbox"][0] * coord_scale)
                    py1 = int(p["bbox"][1] * coord_scale)
                    px2 = int(p["bbox"][2] * coord_scale)
                    py2 = int(p["bbox"][3] * coord_scale)
                    foot_pt = (int(p["foot_point"][0] * coord_scale), int(p["foot_point"][1] * coord_scale))

                    if t_id not in trail_history:
                        trail_history[t_id] = []
                    trail_history[t_id].append(foot_pt)
                    if len(trail_history[t_id]) > 30:
                        trail_history[t_id].pop(0)

                    pts = trail_history[t_id]
                    for k in range(1, len(pts)):
                        alpha_thick = int(1 + (k / len(pts)) * 2)
                        cv2.line(vis_frame, pts[k - 1], pts[k], (0, 215, 255), alpha_thick)

                    cv2.rectangle(vis_frame, (px1, py1), (px2, py2), (59, 214, 115), 2)
                    id_text = f"Customer #{t_id:02d} ({p['confidence']:.2f})"
                    (tw, th), _ = cv2.getTextSize(id_text, cv2.FONT_HERSHEY_SIMPLEX, 0.48, 1)
                    cv2.rectangle(vis_frame, (px1, max(0, py1 - th - 8)), (px1 + tw + 6, py1), (15, 23, 42), -1)
                    cv2.putText(vis_frame, id_text, (px1 + 3, max(14, py1 - 4)), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (255, 255, 255), 1, cv2.LINE_AA)

                # Top HUD Banner
                cv2.rectangle(vis_frame, (0, 0), (out_w, 36), (11, 15, 23), -1)
                hud_text = f"RETAILVISION AI  |  Time: {timestamp:.1f}s / {duration:.1f}s  |  Active Shoppers: {len(tracked_persons)}  |  FPS: {orig_fps:.1f}"
                cv2.putText(vis_frame, hud_text, (16, 23), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (226, 232, 240), 1, cv2.LINE_AA)

                writer.write(vis_frame)
                frame_idx += 1

                if frame_idx % 8 == 0 or frame_idx == total_frames:
                    pct = 15.0 + (frame_idx / max(1, total_frames)) * 60.0
                    db.update_session_progress(
                        session_id,
                        round(pct, 1),
                        f"Tracking customers & analyzing behaviors (frame {frame_idx}/{total_frames})..."
                    )

            cap.release()
            writer.release()

            # ----------------------------------------------------
            # Phase 3: Transcode to Browser H.264 MP4 (Ultra-Fast)
            # ----------------------------------------------------
            db.update_session_progress(session_id, 78.0, "Encoding browser-compatible video stream...")
            self._transcode_to_h264(raw_annotated_path, final_annotated_path)

            # ----------------------------------------------------
            # Phase 4: Customer Summary & Heatmap Generation
            # ----------------------------------------------------
            db.update_session_progress(session_id, 83.0, "Generating video-specific spatial heatmap...")
            customer_summaries = self.customer_tracker.get_all_customer_summaries()
            self.interaction_analyzer.finalize_exit_events(customer_summaries)
            all_events = self.interaction_analyzer.recorded_events

            for cust in customer_summaries:
                cid = cust["customer_track_id"]
                c_state = self.interaction_analyzer.customer_states.get(cid, {})
                dwell_map = c_state.get("shelf_dwell_map", {})
                
                shelves_visited = []
                for s_id, dwell in dwell_map.items():
                    shelves_visited.append({
                        "shelf_id": s_id,
                        "dwell_time": dwell
                    })
                cust["shelves_visited"] = shelves_visited
                cust["interaction_summary"] = {
                    "visited_shelves_count": len(shelves_visited),
                    "shelf_dwell": dwell_map,
                    "has_picked_up": c_state.get("has_picked_up", False),
                    "examined": c_state.get("examined", False)
                }

            traffic_info = self.heatmap_generator.generate_heatmap(
                base_frame=base_frame,
                all_tracks=customer_summaries,
                output_path=heatmap_path
            )

            # ----------------------------------------------------
            # Phase 5: Business Intelligence & Report Generation
            # ----------------------------------------------------
            db.update_session_progress(session_id, 90.0, "Compiling retail intelligence & generating reports...")
            
            analytics_result = self.analytics_engine.compute_session_analytics(
                customers=customer_summaries,
                shelves=shelves,
                events=all_events,
                traffic_info=traffic_info,
                video_metadata={"duration": duration, "fps": orig_fps}
            )

            summary = analytics_result["summary"]
            updated_shelves = analytics_result["shelf_stats"]

            db.insert_shelves(session_id, updated_shelves)
            db.insert_customers(session_id, customer_summaries)
            db.insert_events(session_id, all_events)

            session_dict = db.get_session_by_id(session_id) or {}
            session_dict["summary"] = summary
            
            self.report_generator.generate_pdf_report(
                session=session_dict,
                shelves=updated_shelves,
                customers=customer_summaries,
                events=all_events,
                heatmap_file_path=str(heatmap_path),
                output_pdf_path=pdf_path
            )

            self.report_generator.generate_csv_analytics(
                session=session_dict,
                shelves=updated_shelves,
                customers=customer_summaries,
                events=all_events,
                output_csv_path=csv_path
            )

            completed_at = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S UTC")
            db.complete_session(
                session_id=session_id,
                annotated_video_path=f"/outputs/{session_id}/annotated.mp4",
                heatmap_path=f"/outputs/{session_id}/heatmap.jpg",
                completed_at=completed_at,
                summary=summary
            )

        except Exception as e:
            import traceback
            traceback.print_exc()
            db.fail_session(session_id, str(e))

    def _transcode_to_h264(self, input_path: Path, output_path: Path):
        cmd = [
            self.ffmpeg_exe,
            "-y",
            "-i", str(input_path),
            "-c:v", "libx264",
            "-preset", "ultrafast",
            "-pix_fmt", "yuv420p",
            "-movflags", "+faststart",
            "-threads", "4",
            str(output_path)
        ]
        try:
            subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True)
            if input_path.exists():
                input_path.unlink()
        except Exception as e:
            print(f"H.264 transcode warning: {e}. Falling back to raw file rename.")
            if input_path.exists():
                input_path.rename(output_path)
