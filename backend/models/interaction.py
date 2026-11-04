from pydantic import BaseModel
from typing import Dict, Any, Optional

class InteractionEvent(BaseModel):
    customer_track_id: int
    shelf_id: Optional[str] = None
    event_type: str  # 'entered_view', 'approached_shelf', 'spent_time_near_shelf', 'possible_product_pickup', 'possible_product_examination', 'possible_product_return', 'left_view'
    timestamp: float
    frame_number: int
    confidence: float
    evidence_frame_path: Optional[str] = None
    details: Dict[str, Any] = {}

