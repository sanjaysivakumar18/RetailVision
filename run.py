#!/usr/bin/env python3
import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

# Add project root to path
ROOT_DIR = Path(__file__).resolve().parent
if str(ROOT_DIR) not in sys.path:
    sys.path.insert(0, str(ROOT_DIR))

# Ensure writable cache dirs for Ultralytics & Matplotlib
os.environ["YOLO_CONFIG_DIR"] = "/tmp/ultralytics"
os.environ["MPLCONFIGDIR"] = "/tmp/matplotlib"

def main():
    print("=" * 60)
    print("       RetailVision AI — Platform Launcher            ")
    print("=" * 60)

    # 1. Verify models exist
    models_dir = ROOT_DIR / "models"
    yolo_model = models_dir / "yolov8n.pt"
    pose_model = models_dir / "yolov8n-pose.pt"

    if not yolo_model.exists() or not pose_model.exists():
        print("⚠️  Warning: Pretrained weights missing in models/. Downloading...")
        import urllib.request
        models_dir.mkdir(parents=True, exist_ok=True)
        if not yolo_model.exists():
            print("Downloading yolov8n.pt...")
            urllib.request.urlretrieve('https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n.pt', str(yolo_model))
        if not pose_model.exists():
            print("Downloading yolov8n-pose.pt...")
            urllib.request.urlretrieve('https://github.com/ultralytics/assets/releases/download/v8.4.0/yolov8n-pose.pt', str(pose_model))
        print("✅ Models ready.")

    # 2. Check frontend dependencies
    node_modules = ROOT_DIR / "frontend" / "node_modules"
    if not node_modules.exists():
        print("📦 Installing frontend npm dependencies...")
        subprocess.run(["npm", "install"], cwd=str(ROOT_DIR / "frontend"), check=True)

    # 3. Start FastAPI Backend in background
    print("\n🚀 Starting FastAPI Backend on http://127.0.0.1:8000 ...")
    backend_cmd = [
        sys.executable, "-m", "uvicorn", "backend.main:app",
        "--host", "0.0.0.0", "--port", "8000"
    ]
    backend_proc = subprocess.Popen(
        backend_cmd,
        cwd=str(ROOT_DIR)
    )

    # 4. Start Vite React Frontend
    print("🌐 Starting Vite React Dashboard on http://127.0.0.1:5173 ...")
    frontend_cmd = ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"]
    frontend_proc = subprocess.Popen(
        frontend_cmd,
        cwd=str(ROOT_DIR / "frontend")
    )

    time.sleep(2)
    print("\n" + "=" * 60)
    print(" ✅ RetailVision AI is RUNNING!")
    print("    • Frontend UI: http://127.0.0.1:5173  (or http://localhost:5173)")
    print("    • API Docs:    http://127.0.0.1:8000/docs")
    print("=" * 60)
    print("Opening web dashboard in your default browser...")
    try:
        webbrowser.open("http://127.0.0.1:5173")
    except Exception:
        pass

    print("\nPress Ctrl+C to stop both servers.\n")

    try:
        while True:
            time.sleep(1)
            # If any process terminated prematurely
            if backend_proc.poll() is not None:
                print(f"Backend exited unexpectedly with code {backend_proc.returncode}")
                break
            if frontend_proc.poll() is not None:
                print(f"Frontend exited unexpectedly with code {frontend_proc.returncode}")
                break
    except KeyboardInterrupt:
        print("\nStopping servers...")
    finally:
        backend_proc.terminate()
        frontend_proc.terminate()
        try:
            backend_proc.wait(timeout=3)
            frontend_proc.wait(timeout=3)
        except Exception:
            backend_proc.kill()
            frontend_proc.kill()
        print("RetailVision AI terminated cleanly.")

if __name__ == "__main__":
    main()

