from pydantic import BaseModel
from typing import List, Optional

class BoundingBox(BaseModel):
    x1: float
    y1: float
    x2: float
    y2: float

class Detection(BaseModel):
    class_id: int
    class_name: str
    confidence: float
    bbox: List[float]  # [x1, y1, x2, y2]
    track_id: Optional[int] = None

class FrameDetections(BaseModel):
    frame_number: int
    timestamp: float
    detections: List[Detection]

