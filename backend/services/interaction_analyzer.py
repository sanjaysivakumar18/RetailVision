import os
import cv2
import numpy as np
import torch
from pathlib import Path
from typing import List, Dict, Any, Optional
from ultralytics import YOLO

POSE_MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "yolov8n-pose.pt"

class InteractionAnalyzer:
    def __init__(self, pose_model_path: Optional[str] = None):
        os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
        os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
        if torch.backends.mps.is_available():
            self.device = "mps"
        elif torch.cuda.is_available():
            self.device = "cuda"
        else:
            self.device = "cpu"

        # Load YOLO-Pose for human keypoint tracking (wrists/elbows)
        if not pose_model_path:
            pose_model_path = str(POSE_MODEL_PATH) if POSE_MODEL_PATH.exists() else "yolov8n-pose.pt"
        self.pose_model = YOLO(pose_model_path)
        self.customer_states: Dict[int, Dict[str, Any]] = {}
        self.recorded_events: List[Dict[str, Any]] = []

    def reset(self):
        self.customer_states = {}
        self.recorded_events = []

    def analyze_frame_interactions(
        self,
        frame: np.ndarray,
        frame_number: int,
        timestamp: float,
        tracked_persons: List[Dict[str, Any]],
        shelves: List[Dict[str, Any]],
        evidence_dir: Path,
        session_id: str
    ) -> List[Dict[str, Any]]:
        """
        Analyze spatial proximity and hand-shelf interaction for each tracked customer.
        Gated: Only runs pose estimation if at least one customer is near a shelf zone.
        """
        frame_events = []
        if not tracked_persons or not shelves:
            return frame_events

        # 1. Quick Spatial Pre-Filter: check if any person is in shelf proximity
        any_person_near_shelf = False
        person_proximity_map = {}

        for person in tracked_persons:
            foot_x, foot_y, _ = person["foot_point"]
            px1, py1, px2, py2 = person["bbox"]
            
            matched_shelf = None
            min_dist = float("inf")

            for shelf in shelves:
                sx1, sy1, sx2, sy2 = shelf["bbox"]
                int_x1 = sx1 - 60
                int_y1 = sy1 - 40
                int_x2 = sx2 + 60
                int_y2 = sy2 + 120

                if (int_x1 <= foot_x <= int_x2) and (int_y1 <= foot_y <= int_y2):
                    matched_shelf = shelf
                    break
                else:
                    sc_x = (sx1 + sx2) / 2
                    sc_y = (sy1 + sy2) / 2
                    p_cx = (px1 + px2) / 2
                    p_cy = (py1 + py2) / 2
                    dist = np.hypot(p_cx - sc_x, p_cy - sc_y)
                    if dist < 180 and dist < min_dist:
                        min_dist = dist
                        matched_shelf = shelf

            person_proximity_map[person["track_id"]] = matched_shelf
            if matched_shelf is not None:
                any_person_near_shelf = True

        # 2. Gated Pose Detection: Only execute if someone is actually near a shelf
        person_keypoints_list = []
        if any_person_near_shelf:
            pose_results = self.pose_model(
                frame,
                conf=0.35,
                imgsz=416,
                device=self.device,
                verbose=False
            )[0]
            if pose_results.keypoints is not None and pose_results.boxes is not None:
                for kpts, box in zip(pose_results.keypoints.data, pose_results.boxes):
                    kpts_np = kpts.cpu().numpy()
                    box_xyxy = [float(c) for c in box.xyxy[0].tolist()]
                    person_keypoints_list.append({
                        "box": box_xyxy,
                        "kpts": kpts_np
                    })

        # 3. Analyze each customer
        for person in tracked_persons:
            track_id = person["track_id"]
            if track_id is None:
                continue

            px1, py1, px2, py2 = person["bbox"]
            closest_shelf = person_proximity_map.get(track_id)

            if track_id not in self.customer_states:
                self.customer_states[track_id] = {
                    "current_shelf": None,
                    "entered_shelf_time": None,
                    "shelf_dwell_time": 0.0,
                    "hand_in_shelf_start": None,
                    "hand_reached_shelf": False,
                    "has_picked_up": False,
                    "pickup_time": None,
                    "visited_shelves": set(),
                    "shelf_dwell_map": {}
                }
                # Log entry
                self.recorded_events.append({
                    "customer_track_id": track_id,
                    "shelf_id": None,
                    "event_type": "entered_view",
                    "timestamp": round(timestamp, 2),
                    "frame_number": frame_number,
                    "confidence": 0.95,
                    "evidence_frame_path": None,
                    "details": {"action": "Customer entered camera view"}
                })

            state = self.customer_states[track_id]

            # Match pose keypoints if available
            matched_kpts = None
            if person_keypoints_list:
                best_iou = 0.0
                for pk in person_keypoints_list:
                    iou = self._calculate_iou(person["bbox"], pk["box"])
                    if iou > 0.35 and iou > best_iou:
                        best_iou = iou
                        matched_kpts = pk["kpts"]

            if closest_shelf is not None:
                shelf_id = closest_shelf["shelf_id"]
                state["visited_shelves"].add(shelf_id)

                if state["current_shelf"] != shelf_id:
                    state["current_shelf"] = shelf_id
                    state["entered_shelf_time"] = timestamp
                    state["hand_reached_shelf"] = False
                    state["hand_in_shelf_start"] = None

                    evidence_path = self._save_evidence_frame(
                        frame, person["bbox"], closest_shelf["bbox"],
                        evidence_dir, session_id, track_id, "approached_shelf", timestamp
                    )
                    event = {
                        "customer_track_id": track_id,
                        "shelf_id": shelf_id,
                        "event_type": "approached_shelf",
                        "timestamp": round(timestamp, 2),
                        "frame_number": frame_number,
                        "confidence": 0.88,
                        "evidence_frame_path": evidence_path,
                        "details": {"shelf_label": closest_shelf["label"]}
                    }
                    frame_events.append(event)
                    self.recorded_events.append(event)
                else:
                    dwell = timestamp - (state["entered_shelf_time"] or timestamp)
                    state["shelf_dwell_map"][shelf_id] = round(dwell, 1)

                    if matched_kpts is not None:
                        left_wrist = matched_kpts[9]
                        right_wrist = matched_kpts[10]
                        sx1, sy1, sx2, sy2 = closest_shelf["bbox"]

                        left_in = (left_wrist[2] > 0.35 and sx1 <= left_wrist[0] <= sx2 and sy1 <= left_wrist[1] <= sy2 + 35)
                        right_in = (right_wrist[2] > 0.35 and sx1 <= right_wrist[0] <= sx2 and sy1 <= right_wrist[1] <= sy2 + 35)

                        if left_in or right_in:
                            if not state["hand_reached_shelf"]:
                                state["hand_reached_shelf"] = True
                                state["hand_in_shelf_start"] = timestamp
                            else:
                                hand_dwell = timestamp - state["hand_in_shelf_start"]
                                if hand_dwell >= 0.35 and not state["has_picked_up"]:
                                    state["has_picked_up"] = True
                                    state["pickup_time"] = timestamp
                                    
                                    evidence_path = self._save_evidence_frame(
                                        frame, person["bbox"], closest_shelf["bbox"],
                                        evidence_dir, session_id, track_id, "possible_product_pickup", timestamp
                                    )
                                    pickup_event = {
                                        "customer_track_id": track_id,
                                        "shelf_id": shelf_id,
                                        "event_type": "possible_product_pickup",
                                        "timestamp": round(timestamp, 2),
                                        "frame_number": frame_number,
                                        "confidence": 0.82,
                                        "evidence_frame_path": evidence_path,
                                        "details": {
                                            "shelf_label": closest_shelf["label"],
                                            "observation": "Hand extension into shelf followed by item retrieval motion"
                                        }
                                    }
                                    frame_events.append(pickup_event)
                                    self.recorded_events.append(pickup_event)

                        elif state["has_picked_up"] and (timestamp - (state["pickup_time"] or 0) > 1.0):
                            chest_y = (person["bbox"][1] + person["bbox"][3]) * 0.45
                            if (left_wrist[2] > 0.3 and left_wrist[1] < chest_y + 40) or (right_wrist[2] > 0.3 and right_wrist[1] < chest_y + 40):
                                if "examined" not in state:
                                    state["examined"] = True
                                    evidence_path = self._save_evidence_frame(
                                        frame, person["bbox"], closest_shelf["bbox"],
                                        evidence_dir, session_id, track_id, "possible_product_examination", timestamp
                                    )
                                    exam_event = {
                                        "customer_track_id": track_id,
                                        "shelf_id": shelf_id,
                                        "event_type": "possible_product_examination",
                                        "timestamp": round(timestamp, 2),
                                        "frame_number": frame_number,
                                        "confidence": 0.78,
                                        "evidence_frame_path": evidence_path,
                                        "details": {
                                            "shelf_label": closest_shelf["label"],
                                            "observation": "Customer examining potential product near chest level"
                                        }
                                    }
                                    frame_events.append(exam_event)
                                    self.recorded_events.append(exam_event)

            else:
                if state["current_shelf"] is not None:
                    prev_shelf = state["current_shelf"]
                    dwell = round(timestamp - (state["entered_shelf_time"] or timestamp), 1)
                    
                    if dwell >= 1.5:
                        dwell_event = {
                            "customer_track_id": track_id,
                            "shelf_id": prev_shelf,
                            "event_type": "spent_time_near_shelf",
                            "timestamp": round(timestamp, 2),
                            "frame_number": frame_number,
                            "confidence": 0.90,
                            "evidence_frame_path": None,
                            "details": {"dwell_duration_seconds": dwell}
                        }
                        frame_events.append(dwell_event)
                        self.recorded_events.append(dwell_event)

                    state["current_shelf"] = None
                    state["entered_shelf_time"] = None
                    state["hand_reached_shelf"] = False

        return frame_events

    def finalize_exit_events(self, customer_summaries: List[Dict[str, Any]]):
        for cust in customer_summaries:
            self.recorded_events.append({
                "customer_track_id": cust["customer_track_id"],
                "shelf_id": None,
                "event_type": "left_view",
                "timestamp": cust["exit_timestamp"],
                "frame_number": 0,
                "confidence": 0.95,
                "evidence_frame_path": None,
                "details": {"action": "Customer departed visible camera area"}
            })

    def _save_evidence_frame(
        self,
        frame: np.ndarray,
        person_bbox: List[float],
        shelf_bbox: List[float],
        evidence_dir: Path,
        session_id: str,
        track_id: int,
        event_type: str,
        timestamp: float
    ) -> str:
        evidence_dir.mkdir(parents=True, exist_ok=True)
        filename = f"{session_id}_c{track_id}_{event_type}_{int(timestamp * 1000)}.jpg"
        filepath = evidence_dir / filename

        vis = frame.copy()
        sx1, sy1, sx2, sy2 = [int(c) for c in shelf_bbox]
        cv2.rectangle(vis, (sx1, sy1), (sx2, sy2), (255, 180, 0), 2)
        
        px1, py1, px2, py2 = [int(c) for c in person_bbox]
        cv2.rectangle(vis, (px1, py1), (px2, py2), (0, 255, 128), 2)
        
        label = f"Customer #{track_id:02d} | {event_type.replace('_', ' ').title()} @ {timestamp:.1f}s"
        (lw, lh), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.55, 1)
        cv2.rectangle(vis, (px1, max(0, py1 - lh - 10)), (px1 + lw + 10, py1), (15, 23, 42), -1)
        cv2.putText(vis, label, (px1 + 5, max(15, py1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 1, cv2.LINE_AA)

        # Scale down evidence frame if larger than 1280 for fast web viewing
        if vis.shape[1] > 1280:
            scale_fac = 1280.0 / vis.shape[1]
            vis = cv2.resize(vis, (1280, int(vis.shape[0] * scale_fac)))

        cv2.imwrite(str(filepath), vis, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
        return f"/outputs/evidence/{filename}"

    def _calculate_iou(self, boxA: List[float], boxB: List[float]) -> float:
        xA = max(boxA[0], boxB[0])
        yA = max(boxA[1], boxB[1])
        xB = min(boxA[2], boxB[2])
        yB = min(boxA[3], boxB[3])

        interArea = max(0, xB - xA) * max(0, yB - yA)
        boxAArea = (boxA[2] - boxA[0]) * (boxA[3] - boxA[1])
        boxBArea = (boxB[2] - boxB[0]) * (boxB[3] - boxB[1])
        unionArea = boxAArea + boxBArea - interArea

        return interArea / unionArea if unionArea > 0 else 0.0
