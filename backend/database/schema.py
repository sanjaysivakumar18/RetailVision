CREATE_TABLES_SQL = """
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    filename TEXT NOT NULL,
    original_video_path TEXT NOT NULL,
    annotated_video_path TEXT,
    heatmap_path TEXT,
    fps REAL DEFAULT 0,
    width INTEGER DEFAULT 0,
    height INTEGER DEFAULT 0,
    total_frames INTEGER DEFAULT 0,
    duration_seconds REAL DEFAULT 0,
    status TEXT DEFAULT 'uploaded',
    progress REAL DEFAULT 0.0,
    stage TEXT DEFAULT 'Uploaded',
    error_message TEXT,
    created_at TEXT NOT NULL,
    completed_at TEXT,
    summary_json TEXT
);

CREATE TABLE IF NOT EXISTS shelves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    shelf_id TEXT NOT NULL,
    label TEXT NOT NULL,
    bbox_x1 REAL NOT NULL,
    bbox_y1 REAL NOT NULL,
    bbox_x2 REAL NOT NULL,
    bbox_y2 REAL NOT NULL,
    detection_confidence REAL DEFAULT 0.0,
    visit_count INTEGER DEFAULT 0,
    total_dwell_time REAL DEFAULT 0.0,
    avg_dwell_time REAL DEFAULT 0.0,
    interaction_count INTEGER DEFAULT 0,
    products_json TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS customers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    customer_track_id INTEGER NOT NULL,
    entry_timestamp REAL NOT NULL,
    exit_timestamp REAL NOT NULL,
    total_time_seconds REAL NOT NULL,
    shelves_visited_json TEXT,
    movement_trail_json TEXT,
    interaction_summary_json TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    customer_track_id INTEGER NOT NULL,
    shelf_id TEXT,
    event_type TEXT NOT NULL,
    timestamp REAL NOT NULL,
    frame_number INTEGER NOT NULL,
    confidence REAL DEFAULT 0.0,
    evidence_frame_path TEXT,
    details_json TEXT,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_shelves_session ON shelves(session_id);
CREATE INDEX IF NOT EXISTS idx_customers_session ON customers(session_id);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);
"""

