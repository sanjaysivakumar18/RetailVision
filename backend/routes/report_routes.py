from pathlib import Path
from fastapi import APIRouter, HTTPException
from fastapi.responses import FileResponse
from backend.database import db

router = APIRouter(prefix="/api/reports", tags=["Reports"])

BASE_DIR = Path(__file__).resolve().parent.parent
OUTPUTS_DIR = BASE_DIR / "outputs"

@router.get("/{session_id}/pdf")
def download_pdf_report(session_id: str):
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    pdf_path = OUTPUTS_DIR / session_id / "retail_report.pdf"
    if not pdf_path.exists():
        raise HTTPException(status_code=404, detail="PDF report not found or processing incomplete")

    filename = f"RetailVision_Report_{session['filename']}_{session_id}.pdf"
    return FileResponse(
        path=str(pdf_path),
        media_type="application/pdf",
        filename=filename
    )

@router.get("/{session_id}/csv")
def download_csv_analytics(session_id: str):
    session = db.get_session_by_id(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    csv_path = OUTPUTS_DIR / session_id / "analytics_data.csv"
    if not csv_path.exists():
        raise HTTPException(status_code=404, detail="CSV analytics not found or processing incomplete")

    filename = f"RetailVision_Events_{session_id}.csv"
    return FileResponse(
        path=str(csv_path),
        media_type="text/csv",
        filename=filename
    )

