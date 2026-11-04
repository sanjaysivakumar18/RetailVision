import os
os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from backend.routes.video_routes import generate_sample_cctv
from backend.services.video_processor import VideoProcessor
from backend.database import db
from fastapi import BackgroundTasks
import asyncio
import time

def run_test():
    print("=== Testing RetailVision AI End-to-End Pipeline ===")
    db.init_db()
    
    # 1. Trigger generate sample cctv
    bg = BackgroundTasks()
    res = asyncio.run(generate_sample_cctv(bg))
    session_id = res["session_id"]
    print(f"Sample video created for session: {session_id}")
    
    # 2. Run the background task directly
    task = bg.tasks[0]
    func = task.func
    kwargs = task.kwargs
    print(f"Executing video processing pipeline for session {session_id}...")
    func(**kwargs)
    
    # 3. Verify Database Records
    session = db.get_session_by_id(session_id)
    print("\n--- Session Result ---")
    print(f"Status: {session['status']}")
    print(f"Total Frames: {session['total_frames']} (Duration: {session['duration_seconds']}s)")
    print(f"Annotated Video: {session['annotated_video_path']}")
    print(f"Heatmap: {session['heatmap_path']}")
    
    shelves = db.get_shelves_by_session(session_id)
    print(f"\nRecognized Shelves ({len(shelves)}):")
    for s in shelves:
        print(f"  • {s['shelf_id']}: {s['label']} | Visits: {s['visit_count']}, Dwell: {s['avg_dwell_time']}s, BBox: {s['bbox']}")

    customers = db.get_customers_by_session(session_id)
    print(f"\nTracked Customers ({len(customers)}):")
    for c in customers:
        print(f"  • Customer #{c['customer_track_id']}: Stay {c['total_time_seconds']}s, Shelves Visited: {c['shelves_visited']}, Trail Points: {len(c['movement_trail'])}")

    events = db.get_events_by_session(session_id)
    print(f"\nInteraction Events ({len(events)}):")
    for e in events[:8]:
        print(f"  • Frame {e['frame_number']} @ {e['timestamp']}s: Cust #{e['customer_track_id']} -> {e['event_type']} (Conf: {e['confidence']}) Evidence: {e['evidence_frame_path']}")

    # Verify Output Files
    outputs_dir = Path(__file__).resolve().parent / "outputs" / session_id
    pdf_file = outputs_dir / "retail_report.pdf"
    csv_file = outputs_dir / "analytics_data.csv"
    heatmap_file = outputs_dir / "heatmap.jpg"
    annotated_file = outputs_dir / "annotated.mp4"

    print("\n--- Artifact Verification ---")
    print(f"PDF Report Exists: {pdf_file.exists()} ({pdf_file.stat().st_size if pdf_file.exists() else 0} bytes)")
    print(f"CSV Analytics Exists: {csv_file.exists()} ({csv_file.stat().st_size if csv_file.exists() else 0} bytes)")
    print(f"Heatmap Image Exists: {heatmap_file.exists()} ({heatmap_file.stat().st_size if heatmap_file.exists() else 0} bytes)")
    print(f"Annotated MP4 Exists: {annotated_file.exists()} ({annotated_file.stat().st_size if annotated_file.exists() else 0} bytes)")

    assert session['status'] == 'completed', "Session did not complete successfully"
    assert pdf_file.exists(), "PDF report was not generated"
    assert csv_file.exists(), "CSV analytics was not generated"
    assert heatmap_file.exists(), "Heatmap was not generated"
    assert len(shelves) > 0, "No shelves were recognized"
    print("\n ALL VERIFICATIONS PASSED! RetailVision AI pipeline is fully functional!")

if __name__ == "__main__":
    run_test()
