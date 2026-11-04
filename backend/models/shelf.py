from pydantic import BaseModel
from typing import List, Optional

class Shelf(BaseModel):
    shelf_id: str  # e.g. "Shelf A", "Shelf B"
    label: str
    bbox: List[float]  # [x1, y1, x2, y2]
    confidence: float = 0.85
    visit_count: int = 0
    total_dwell_time: float = 0.0
    avg_dwell_time: float = 0.0
    interaction_count: int = 0
    products: List[str] = []

