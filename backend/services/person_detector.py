import os
from pathlib import Path
from typing import List, Dict, Any
import numpy as np
from ultralytics import YOLO

MODEL_PATH = Path(__file__).resolve().parent.parent.parent / "models" / "yolov8n.pt"

class PersonDetector:
    def __init__(self, model_path: str = str(MODEL_PATH), conf_threshold: float = 0.35):
        self.conf_threshold = conf_threshold
        # Ensure YOLO config directory is writable
        os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
        os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
        self.model = YOLO(model_path)

    def detect_persons_and_objects(self, frame: np.ndarray) -> Dict[str, List[Dict[str, Any]]]:
        """
        Runs detection on a single frame.
        Separates 'person' detections from potential retail objects/fixtures.
        """
        results = self.model(frame, conf=self.conf_threshold, verbose=False)[0]
        
        persons = []
        objects = []

        if results.boxes is not None:
            for box in results.boxes:
                cls_id = int(box.cls[0].item())
                cls_name = self.model.names[cls_id]
                conf = float(box.conf[0].item())
                xyxy = [float(coord) for coord in box.xyxy[0].tolist()]

                detection = {
                    "class_id": cls_id,
                    "class_name": cls_name,
                    "confidence": round(conf, 3),
                    "bbox": xyxy
                }

                if cls_name == "person":
                    persons.append(detection)
                else:
                    objects.append(detection)

        return {
            "persons": persons,
            "objects": objects
        }

