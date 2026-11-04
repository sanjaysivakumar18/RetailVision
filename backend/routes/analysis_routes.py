import json
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from backend.database import db
from backend.services.recommendation_engine import RecommendationEngine

router = APIRouter(prefix="/api", tags=["Analysis"])
recommendation_engine = RecommendationEngine()

@router.get("/sessions")
def list_sessions():
    """Returns all analysis sessions ordered by most recent."""
    return db.get_all_sessions()

@router.get("/sessions/{session_id}")
def get_session(session_id: str):
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")
    return session

@router.get("/analysis/{session_id}/status")
def get_analysis_status(session_id: str):
    """Lightweight polling endpoint for real-time progress updates."""
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return {
        "session_id": session["id"],
        "status": session["status"],
        "progress": session["progress"],
        "stage": session["stage"],
        "error_message": session.get("error_message")
    }

@router.get("/analysis/{session_id}/shelves")
def get_session_shelves(session_id: str):
    shelves = db.get_shelves_by_session(session_id)
    return {
        "session_id": session_id,
        "count": len(shelves),
        "shelves": shelves
    }

@router.get("/analysis/{session_id}/customers")
def get_session_customers(session_id: str):
    customers = db.get_customers_by_session(session_id)
    return {
        "session_id": session_id,
        "count": len(customers),
        "customers": customers
    }

@router.get("/analysis/{session_id}/events")
def get_session_events(
    session_id: str,
    customer_id: Optional[int] = Query(None, description="Filter by customer track ID")
):
    events = db.get_events_by_session(session_id, customer_id=customer_id)
    return {
        "session_id": session_id,
        "count": len(events),
        "events": events
    }

@router.get("/analysis/{session_id}/recommendations")
def get_session_recommendations(
    session_id: str,
    category: Optional[str] = Query(None, description="Filter by recommendation category"),
    priority: Optional[str] = Query(None, description="Filter by priority (High, Medium, Low)")
):
    """
    AI-Powered Retail Decision-Support & Actionable Merchandising Recommendations
    strictly grounded in actual CCTV customer and shelf analysis.
    """
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail=f"Session {session_id} not found")

    summary = session.get("summary", {})
    recs = summary.get("recommendations_detail")

    if not recs:
        shelves = db.get_shelves_by_session(session_id)
        customers = db.get_customers_by_session(session_id)
        events = db.get_events_by_session(session_id)
        traffic_info = {
            "high_traffic_zones": summary.get("high_traffic_zones", []),
            "low_traffic_zones": summary.get("low_traffic_zones", []),
            "zone_distribution": summary.get("zone_distribution", [])
        }
        recs = recommendation_engine.generate_recommendations(
            customers=customers,
            shelves=shelves,
            events=events,
            traffic_info=traffic_info,
            video_metadata={"duration": session.get("duration_seconds", 0.0)}
        )
        summary["recommendations_detail"] = recs
        db.execute_update(
            "UPDATE sessions SET summary_json = ? WHERE id = ?",
            (json.dumps(summary), session_id)
        )

    filtered = recs
    if category and category.lower() != "all":
        filtered = [r for r in filtered if r.get("category") == category]
    if priority and priority.lower() != "all":
        filtered = [r for r in filtered if r.get("priority", "").lower() == priority.lower()]

    counts = {
        "total": len(recs),
        "high": sum(1 for r in recs if r.get("priority") == "High"),
        "medium": sum(1 for r in recs if r.get("priority") == "Medium"),
        "low": sum(1 for r in recs if r.get("priority") == "Low"),
        "with_evidence": sum(1 for r in recs if r.get("evidence", {}).get("has_evidence"))
    }

    return {
        "session_id": session_id,
        "counts": counts,
        "recommendations": filtered
    }

@router.get("/sessions/compare")
def compare_sessions(
    session1: str = Query(..., description="First session ID"),
    session2: str = Query(..., description="Second session ID")
):
    """Compare two retail video analysis sessions side-by-side."""
    s1 = db.get_session_by_id(session1)
    s2 = db.get_session_by_id(session2)

    if not s1 or not s2:
        raise HTTPException(status_code=404, detail="One or both sessions not found")

    shelves1 = db.get_shelves_by_session(session1)
    shelves2 = db.get_shelves_by_session(session2)

    return {
        "session1": {
            "id": s1["id"],
            "filename": s1["filename"],
            "summary": s1.get("summary", {}),
            "shelves": shelves1
        },
        "session2": {
            "id": s2["id"],
            "filename": s2["filename"],
            "summary": s2.get("summary", {}),
            "shelves": shelves2
        }
    }
