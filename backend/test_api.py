import os
import sys
from pathlib import Path
os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_api():
    print("Testing /api/health...")
    r = client.get("/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    print("Health check response:", r.json())

    print("\nTesting /api/sessions...")
    r = client.get("/api/sessions")
    assert r.status_code == 200, f"Sessions failed: {r.text}"
    sessions = r.json()
    print(f"Retrieved {len(sessions)} session(s)")
    if sessions:
        s_id = sessions[0]["id"]
        print(f"\nTesting /api/sessions/{s_id}...")
        r = client.get(f"/api/sessions/{s_id}")
        assert r.status_code == 200
        print("Session data loaded successfully!")

        print(f"\nTesting /api/analysis/{s_id}/shelves...")
        r = client.get(f"/api/analysis/{s_id}/shelves")
        assert r.status_code == 200
        print(f"Shelves count: {r.json()['count']}")

        print(f"\nTesting /api/analysis/{s_id}/customers...")
        r = client.get(f"/api/analysis/{s_id}/customers")
        assert r.status_code == 200
        print(f"Customers count: {r.json()['count']}")

        print(f"\nTesting /api/analysis/{s_id}/events...")
        r = client.get(f"/api/analysis/{s_id}/events")
        assert r.status_code == 200
        print(f"Events count: {r.json()['count']}")

        print(f"\nTesting /api/reports/{s_id}/pdf...")
        r = client.get(f"/api/reports/{s_id}/pdf")
        assert r.status_code == 200
        print(f"PDF download route successful ({len(r.content)} bytes)")

        print(f"\nTesting /api/reports/{s_id}/csv...")
        r = client.get(f"/api/reports/{s_id}/csv")
        assert r.status_code == 200
        print(f"CSV download route successful ({len(r.content)} bytes)")

    print("\nALL API ENDPOINTS TESTED AND VERIFIED SUCCESSFULLY!")

if __name__ == "__main__":
    test_api()
