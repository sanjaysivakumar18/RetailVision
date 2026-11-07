import os
from pathlib import Path
from typing import List, Dict, Any, Optional
import numpy as np
import torch
from ultralytics import YOLO

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "yolov8n.pt"

class CustomerTracker:
    def __init__(self, model_path: Optional[str] = None, conf_threshold: float = 0.35):
        os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
        os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
        # Auto-detect Apple Silicon GPU (MPS) or CUDA, otherwise CPU
        if torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"

        if not model_path:
            model_path = str(MODEL_PATH) if MODEL_PATH.exists() else "yolov8n.pt"
        self.model = YOLO(model_path)
        self.conf_threshold = conf_threshold
        # In-memory history for active session tracking
        self.active_tracks: Dict[int, Dict[str, Any]] = {}

    def reset(self):
        """Reset internal tracking state for a new session."""
        self.active_tracks = {}

    def track_frame(self, frame: np.ndarray, timestamp: float) -> List[Dict[str, Any]]:
        """
        Runs YOLO tracking with ByteTrack on a single frame for person class (class 0).
        Leverages hardware acceleration and standard 640 inference size.
        """
        # Run ByteTrack on person class (class 0)
        results = self.model.track(
            source=frame,
            persist=True,
            tracker="bytetrack.yaml",
            classes=[0],
            conf=self.conf_threshold,
            imgsz=640,
            device=self.device,
            verbose=False
        )[0]

        tracked_persons = []

        if results.boxes is not None:
            for box in results.boxes:
                # If tracking ID is assigned by ByteTrack
                track_id = int(box.id[0].item()) if box.id is not None else None
                conf = float(box.conf[0].item())
                xyxy = [float(coord) for coord in box.xyxy[0].tolist()]

                # Calculate bottom-center coordinate (person's position on the floor)
                x_center = (xyxy[0] + xyxy[2]) / 2.0
                y_bottom = xyxy[3]
                foot_point = (round(x_center, 1), round(y_bottom, 1), round(timestamp, 2))

                if track_id is not None:
                    if track_id not in self.active_tracks:
                        self.active_tracks[track_id] = {
                            "track_id": track_id,
                            "first_seen": timestamp,
                            "last_seen": timestamp,
                            "trail": [foot_point],
                            "last_bbox": xyxy
                        }
                    else:
                        self.active_tracks[track_id]["last_seen"] = timestamp
                        self.active_tracks[track_id]["trail"].append(foot_point)
                        self.active_tracks[track_id]["last_bbox"] = xyxy

                tracked_persons.append({
                    "track_id": track_id,
                    "bbox": xyxy,
                    "confidence": round(conf, 3),
                    "foot_point": foot_point
                })

        return tracked_persons

    def get_all_customer_summaries(self, min_frames_visible: int = 5) -> List[Dict[str, Any]]:
        """
        Compile final customer summary across the entire video.
        Filters out spurious single-frame false positives.
        """
        summaries = []
        for track_id, data in self.active_tracks.items():
            if len(data["trail"]) < min_frames_visible:
                continue
            
            trail = data["trail"]
            if len(trail) > 200:
                step = len(trail) // 200 + 1
                sampled_trail = trail[::step]
            else:
                sampled_trail = trail

            total_time = max(0.1, round(data["last_seen"] - data["first_seen"], 2))
            summaries.append({
                "customer_track_id": track_id,
                "entry_timestamp": round(data["first_seen"], 2),
                "exit_timestamp": round(data["last_seen"], 2),
                "total_time_seconds": total_time,
                "movement_trail": sampled_trail
            })

        summaries.sort(key=lambda x: x["customer_track_id"])
        return summaries
