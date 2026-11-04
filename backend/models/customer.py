from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class CustomerJourney(BaseModel):
    customer_track_id: int
    entry_timestamp: float
    exit_timestamp: float
    total_time_seconds: float
    shelves_visited: List[Dict[str, Any]] = []
    movement_trail: List[List[float]] = []  # [[x, y, timestamp], ...]
    interaction_summary: Dict[str, Any] = {}

