import os
import io
import pandas as pd
from pathlib import Path
from typing import Dict, Any, List, Optional
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image, KeepTogether, HRFlowable

class ReportGenerator:
    """
    Generates enterprise-grade PDF and CSV reports for retail intelligence sessions
    using ReportLab and Pandas.
    """

    def generate_pdf_report(
        self,
        session: Dict[str, Any],
        shelves: List[Dict[str, Any]],
        customers: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        heatmap_file_path: Optional[str],
        output_pdf_path: Path
    ) -> str:
        output_pdf_path.parent.mkdir(parents=True, exist_ok=True)
        doc = SimpleDocTemplate(
            str(output_pdf_path),
            pagesize=letter,
            rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40
        )

        styles = getSampleStyleSheet()
        # Custom palette
        c_primary = colors.HexColor("#0B0F17")
        c_accent = colors.HexColor("#2563EB")
        c_muted = colors.HexColor("#64748B")
        c_bg_subtle = colors.HexColor("#F1F5F9")

        # Custom typography styles
        title_style = ParagraphStyle(
            'DocTitle',
            parent=styles['Heading1'],
            fontName='Helvetica-Bold',
            fontSize=22,
            leading=26,
            textColor=c_primary
        )
        subtitle_style = ParagraphStyle(
            'DocSub',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=c_muted
        )
        h2_style = ParagraphStyle(
            'SectionH2',
            parent=styles['Heading2'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=c_accent,
            spaceBefore=14,
            spaceAfter=6
        )
        body_style = ParagraphStyle(
            'Body',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=9.5,
            leading=13,
            textColor=colors.HexColor("#1E293B")
        )
        bullet_style = ParagraphStyle(
            'Bullet',
            parent=body_style,
            leftIndent=15,
            bulletIndent=5,
            spaceAfter=4
        )

        elements = []

        # Header Title
        elements.append(Paragraph("RetailVision AI — Retail Intelligence Report", title_style))
        elements.append(Paragraph(
            f"Session ID: <b>{session.get('id')}</b> | Source File: <b>{session.get('filename')}</b> | Generated: <b>{session.get('completed_at', 'N/A')}</b>",
            subtitle_style
        ))
        elements.append(Spacer(1, 10))
        elements.append(HRFlowable(width="100%", thickness=1.5, color=c_accent, spaceBefore=4, spaceAfter=14))

        # Executive Metrics Summary Table
        summary = session.get("summary", {})
        metrics_data = [
            ["Metric", "Value", "Metric", "Value"],
            ["Total Customers Tracked", str(summary.get("total_customers", len(customers))), "Shelves Recognized", str(len(shelves))],
            ["Total Shelf Interactions", str(summary.get("total_interactions", 0)), "Avg Shelf Dwell Time", f"{summary.get('avg_shelf_dwell_time', 0.0)} s"],
            ["Possible Pickups", str(summary.get("possible_product_pickups", 0)), "Possible Examinations", str(summary.get("possible_examinations", 0))],
            ["Video Duration", f"{session.get('duration_seconds', 0.0):.1f} s", "Video Resolution", f"{session.get('width', 0)} x {session.get('height', 0)}"]
        ]

        t_metrics = Table(metrics_data, colWidths=[140, 120, 140, 120])
        t_metrics.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), c_primary),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_subtle]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ALIGN', (1, 0), (1, -1), 'CENTER'),
            ('ALIGN', (3, 0), (3, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 5),
            ('TOPPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(t_metrics)
        elements.append(Spacer(1, 14))

        # Heatmap Image Section if available
        if heatmap_file_path and os.path.exists(heatmap_file_path):
            elements.append(Paragraph("1. Spatial Traffic Heatmap", h2_style))
            elements.append(Paragraph(
                "Overlay visualization of cumulative customer foot traffic trajectories generated dynamically for this video session.",
                body_style
            ))
            elements.append(Spacer(1, 6))
            try:
                elements.append(Image(heatmap_file_path, width=480, height=270))
            except Exception as e:
                elements.append(Paragraph(f"(Heatmap image display note: {e})", subtitle_style))
            elements.append(Spacer(1, 10))

        # Shelf Performance Table
        elements.append(Paragraph("2. Shelf Structure Engagement Ranking", h2_style))
        shelf_headers = ["Shelf ID & Label", "Confidence", "Visits", "Avg Dwell (s)", "Interactions", "Products"]
        shelf_rows = [shelf_headers]
        for s in shelves:
            products_str = ", ".join(s.get("products", [])) if s.get("products") else "General Shelf"
            shelf_rows.append([
                s.get("label", s["shelf_id"]),
                f"{s.get('detection_confidence', 0.85):.2f}",
                str(s.get("visit_count", 0)),
                f"{s.get('avg_dwell_time', 0.0):.1f} s",
                str(s.get("interaction_count", 0)),
                products_str[:25]
            ])

        t_shelves = Table(shelf_rows, colWidths=[130, 60, 50, 75, 75, 130])
        t_shelves.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), c_accent),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 8.5),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_subtle]),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('ALIGN', (1, 1), (4, -1), 'CENTER'),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_shelves)
        elements.append(Spacer(1, 14))

        # Customer Intelligence Summary
        elements.append(Paragraph("3. Customer Journey Analysis", h2_style))
        if customers:
            cust_headers = ["Track ID", "Entry (s)", "Exit (s)", "Duration (s)", "Shelves Visited"]
            cust_rows = [cust_headers]
            for c in customers[:15]:  # Top 15 in summary table
                visited = ", ".join([v.get("shelf_id", "") for v in c.get("shelves_visited", [])]) or "Walkthrough"
                cust_rows.append([
                    f"Customer #{c['customer_track_id']:02d}",
                    f"{c['entry_timestamp']:.1f}",
                    f"{c['exit_timestamp']:.1f}",
                    f"{c['total_time_seconds']:.1f}",
                    visited
                ])

            t_cust = Table(cust_rows, colWidths=[90, 80, 80, 90, 180])
            t_cust.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), c_primary),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 8.5),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, c_bg_subtle]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('ALIGN', (1, 1), (3, -1), 'CENTER'),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(t_cust)
        else:
            elements.append(Paragraph("No customer journeys recorded.", body_style))
        elements.append(Spacer(1, 14))

        # AI Insights & Layout Recommendations
        elements.append(Paragraph("4. AI Retail Observations & Decision-Support Recommendations", h2_style))
        detailed_recs = summary.get("recommendations_detail", [])
        if detailed_recs:
            for rec in detailed_recs:
                p_color = "#E11D48" if rec.get("priority") == "High" else "#D97706" if rec.get("priority") == "Medium" else "#0284C7"
                rec_title = f"<font color='{p_color}'><b>[{rec.get('priority', 'Medium').upper()}]</b></font> <b>{rec.get('title', '')}</b> ({rec.get('category_label', '')})"
                elements.append(Paragraph(rec_title, body_style))
                elements.append(Paragraph(f"• <b>Observation:</b> {rec.get('observation', '')}", bullet_style))
                elements.append(Paragraph(f"• <b>Retail Reason:</b> {rec.get('reason', '')}", bullet_style))
                elements.append(Paragraph(f"• <b>Suggested Action:</b> {rec.get('action', '')}", bullet_style))
                
                # Metrics & Evidence
                m_str = ", ".join([f"{k.replace('_', ' ').capitalize()}: {v}" for k, v in rec.get("metrics", {}).items()])
                ev = rec.get("evidence", {})
                ts_str = ", ".join(ev.get("timestamps", [])) if ev.get("timestamps") else "N/A"
                elements.append(Paragraph(f"• <b>Supporting Telemetry:</b> {m_str} | Timestamps: {ts_str}", bullet_style))
                elements.append(Spacer(1, 4))
        else:
            observations = summary.get("observations", [])
            for obs in observations:
                elements.append(Paragraph(f"• <b>Observation:</b> {obs}", bullet_style))
            recommendations = summary.get("recommendations", [])
            for rec in recommendations:
                elements.append(Paragraph(f"• <b>Strategy:</b> {rec}", bullet_style))

        elements.append(Spacer(1, 10))

        # Model Limitations & Compliance Disclaimer
        elements.append(Paragraph("5. AI Model Transparency & Limitations", h2_style))
        elements.append(Paragraph(
            "<b>Mandatory CCTV Compliance Disclaimer:</b> CCTV computer vision algorithms track visual movement patterns, proximity, and estimated hand-object interactions. "
            "Vision models cannot ascertain financial settlement, barcode scanning, or legal ownership transfer. POS integration is required for commercial purchase verification.",
            body_style
        ))

        doc.build(elements)
        return str(output_pdf_path)

    def generate_csv_analytics(
        self,
        session: Dict[str, Any],
        shelves: List[Dict[str, Any]],
        customers: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        output_csv_path: Path
    ) -> str:
        """
        Creates a multi-section structured CSV archive containing full quantitative logs.
        """
        output_csv_path.parent.mkdir(parents=True, exist_ok=True)
        
        # Prepare Events DataFrame
        event_records = []
        for e in events:
            event_records.append({
                "Session_ID": session.get("id"),
                "Customer_ID": e.get("customer_track_id"),
                "Shelf_ID": e.get("shelf_id", "N/A"),
                "Event_Type": e.get("event_type"),
                "Timestamp_Sec": e.get("timestamp"),
                "Frame_Number": e.get("frame_number"),
                "Confidence": e.get("confidence")
            })

        df_events = pd.DataFrame(event_records)
        df_events.to_csv(output_csv_path, index=False)
        return str(output_csv_path)
