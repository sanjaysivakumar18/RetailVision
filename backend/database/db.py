import sqlite3
import os
import sys
import json
from pathlib import Path
from typing import Any, Dict, List, Optional

# Ensure project root is in sys.path
ROOT_DIR = Path(__file__).resolve().parent.parent.parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

try:
    from backend.database.schema import CREATE_TABLES_SQL
except ModuleNotFoundError:
    from schema import CREATE_TABLES_SQL

DB_PATH = Path(__file__).resolve().parent.parent / "retailvision.db"

def get_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn

def init_db():
    conn = get_connection()
    try:
        with conn:
            conn.executescript(CREATE_TABLES_SQL)
    finally:
        conn.close()

# Database Helper Functions
def execute_query(query: str, params: tuple = ()) -> List[Dict[str, Any]]:
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute(query, params)
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def execute_insert(query: str, params: tuple = ()) -> int:
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            cursor.execute(query, params)
            return cursor.lastrowid
    finally:
        conn.close()

def execute_update(query: str, params: tuple = ()):
    conn = get_connection()
    try:
        with conn:
            conn.execute(query, params)
    finally:
        conn.close()

# Session Queries
def create_session(session_data: Dict[str, Any]):
    query = """
    INSERT INTO sessions (id, filename, original_video_path, status, progress, stage, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """
    execute_insert(query, (
        session_data["id"],
        session_data["filename"],
        session_data["original_video_path"],
        session_data.get("status", "uploaded"),
        session_data.get("progress", 0.0),
        session_data.get("stage", "Uploaded"),
        session_data["created_at"]
    ))

def update_session_progress(session_id: str, progress: float, stage: str):
    query = "UPDATE sessions SET progress = ?, stage = ? WHERE id = ?"
    execute_update(query, (progress, stage, session_id))

def update_session_metadata(session_id: str, metadata: Dict[str, Any]):
    query = """
    UPDATE sessions
    SET fps = ?, width = ?, height = ?, total_frames = ?, duration_seconds = ?
    WHERE id = ?
    """
    execute_update(query, (
        metadata.get("fps", 0),
        metadata.get("width", 0),
        metadata.get("height", 0),
        metadata.get("total_frames", 0),
        metadata.get("duration_seconds", 0),
        session_id
    ))

def complete_session(session_id: str, annotated_video_path: str, heatmap_path: str, completed_at: str, summary: Dict[str, Any]):
    query = """
    UPDATE sessions
    SET status = 'completed', progress = 100.0, stage = 'Analysis Complete',
        annotated_video_path = ?, heatmap_path = ?, completed_at = ?, summary_json = ?
    WHERE id = ?
    """
    execute_update(query, (
        annotated_video_path,
        heatmap_path,
        completed_at,
        json.dumps(summary),
        session_id
    ))

def fail_session(session_id: str, error_message: str):
    query = "UPDATE sessions SET status = 'failed', stage = 'Failed', error_message = ? WHERE id = ?"
    execute_update(query, (error_message, session_id))

def get_session_by_id(session_id: str) -> Optional[Dict[str, Any]]:
    rows = execute_query("SELECT * FROM sessions WHERE id = ?", (session_id,))
    if not rows:
        return None
    session = rows[0]
    if session.get("summary_json"):
        try:
            session["summary"] = json.loads(session["summary_json"])
        except Exception:
            session["summary"] = {}
    else:
        session["summary"] = {}
    return session

def get_all_sessions() -> List[Dict[str, Any]]:
    rows = execute_query("SELECT * FROM sessions ORDER BY created_at DESC")
    for session in rows:
        if session.get("summary_json"):
            try:
                session["summary"] = json.loads(session["summary_json"])
            except Exception:
                session["summary"] = {}
        else:
            session["summary"] = {}
    return rows

# Shelves Queries
def insert_shelves(session_id: str, shelves: List[Dict[str, Any]]):
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            for s in shelves:
                cursor.execute("""
                INSERT INTO shelves (
                    session_id, shelf_id, label, bbox_x1, bbox_y1, bbox_x2, bbox_y2,
                    detection_confidence, visit_count, total_dwell_time, avg_dwell_time,
                    interaction_count, products_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    s["shelf_id"],
                    s.get("label", s["shelf_id"]),
                    s["bbox"][0],
                    s["bbox"][1],
                    s["bbox"][2],
                    s["bbox"][3],
                    s.get("confidence", 0.85),
                    s.get("visit_count", 0),
                    s.get("total_dwell_time", 0.0),
                    s.get("avg_dwell_time", 0.0),
                    s.get("interaction_count", 0),
                    json.dumps(s.get("products", []))
                ))
    finally:
        conn.close()

def get_shelves_by_session(session_id: str) -> List[Dict[str, Any]]:
    rows = execute_query("SELECT * FROM shelves WHERE session_id = ? ORDER BY shelf_id ASC", (session_id,))
    for row in rows:
        row["bbox"] = [row["bbox_x1"], row["bbox_y1"], row["bbox_x2"], row["bbox_y2"]]
        if row.get("products_json"):
            try:
                row["products"] = json.loads(row["products_json"])
            except Exception:
                row["products"] = []
    return rows

# Customers Queries
def insert_customers(session_id: str, customers: List[Dict[str, Any]]):
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            for c in customers:
                cursor.execute("""
                INSERT INTO customers (
                    session_id, customer_track_id, entry_timestamp, exit_timestamp,
                    total_time_seconds, shelves_visited_json, movement_trail_json, interaction_summary_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    c["customer_track_id"],
                    c["entry_timestamp"],
                    c["exit_timestamp"],
                    c["total_time_seconds"],
                    json.dumps(c.get("shelves_visited", [])),
                    json.dumps(c.get("movement_trail", [])),
                    json.dumps(c.get("interaction_summary", {}))
                ))
    finally:
        conn.close()

def get_customers_by_session(session_id: str) -> List[Dict[str, Any]]:
    rows = execute_query("SELECT * FROM customers WHERE session_id = ? ORDER BY customer_track_id ASC", (session_id,))
    for row in rows:
        if row.get("shelves_visited_json"):
            try:
                row["shelves_visited"] = json.loads(row["shelves_visited_json"])
            except Exception:
                row["shelves_visited"] = []
        if row.get("movement_trail_json"):
            try:
                row["movement_trail"] = json.loads(row["movement_trail_json"])
            except Exception:
                row["movement_trail"] = []
        if row.get("interaction_summary_json"):
            try:
                row["interaction_summary"] = json.loads(row["interaction_summary_json"])
            except Exception:
                row["interaction_summary"] = {}
    return rows

# Events Queries
def insert_events(session_id: str, events: List[Dict[str, Any]]):
    conn = get_connection()
    try:
        with conn:
            cursor = conn.cursor()
            for e in events:
                cursor.execute("""
                INSERT INTO events (
                    session_id, customer_track_id, shelf_id, event_type,
                    timestamp, frame_number, confidence, evidence_frame_path, details_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    session_id,
                    e["customer_track_id"],
                    e.get("shelf_id"),
                    e["event_type"],
                    e["timestamp"],
                    e["frame_number"],
                    e.get("confidence", 0.0),
                    e.get("evidence_frame_path"),
                    json.dumps(e.get("details", {}))
                ))
    finally:
        conn.close()

def get_events_by_session(session_id: str, customer_id: Optional[int] = None) -> List[Dict[str, Any]]:
    if customer_id is not None:
        rows = execute_query(
            "SELECT * FROM events WHERE session_id = ? AND customer_track_id = ? ORDER BY timestamp ASC",
            (session_id, customer_id)
        )
    else:
        rows = execute_query(
            "SELECT * FROM events WHERE session_id = ? ORDER BY timestamp ASC",
            (session_id,)
        )
    for row in rows:
        if row.get("details_json"):
            try:
                row["details"] = json.loads(row["details_json"])
            except Exception:
                row["details"] = {}
    return rows

