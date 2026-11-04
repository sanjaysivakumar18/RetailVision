from typing import List, Dict, Any, Optional
import numpy as np
from backend.services.recommendation_engine import RecommendationEngine

class AnalyticsEngine:
    """
    Computes retail business intelligence, shelf engagement rankings,
    dwell time averages, customer traffic breakdown, and AI observations
    strictly derived from actual video detection results.
    """

    def __init__(self):
        self.recommendation_engine = RecommendationEngine()

    def compute_session_analytics(
        self,
        customers: List[Dict[str, Any]],
        shelves: List[Dict[str, Any]],
        events: List[Dict[str, Any]],
        traffic_info: Dict[str, Any],
        video_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        total_customers = len(customers)
        total_shelves = len(shelves)

        # Count event types
        pickup_count = sum(1 for e in events if e.get("event_type") == "possible_product_pickup")
        return_count = sum(1 for e in events if e.get("event_type") == "possible_product_return")
        exam_count = sum(1 for e in events if e.get("event_type") == "possible_product_examination")
        approach_count = sum(1 for e in events if e.get("event_type") == "approached_shelf")
        dwell_count = sum(1 for e in events if e.get("event_type") == "spent_time_near_shelf")
        
        total_interactions = pickup_count + return_count + exam_count + approach_count

        # Shelf engagement calculations
        shelf_stats = []
        for shelf in shelves:
            s_id = shelf["shelf_id"]
            
            # Visits: number of customers who approached this shelf
            visitors = set()
            total_dwell = 0.0

            for cust in customers:
                dwell_map = cust.get("interaction_summary", {}).get("shelf_dwell", {})
                if s_id in dwell_map:
                    visitors.add(cust["customer_track_id"])
                    total_dwell += dwell_map[s_id]

            visit_cnt = len(visitors)
            avg_dwell = round(total_dwell / visit_cnt, 1) if visit_cnt > 0 else 0.0
            
            # Count shelf specific interactions
            shelf_interactions = sum(
                1 for e in events 
                if e.get("shelf_id") == s_id and e.get("event_type") in [
                    "possible_product_pickup", "possible_product_examination", "possible_product_return"
                ]
            )

            shelf_stats.append({
                "shelf_id": s_id,
                "label": shelf.get("label", s_id),
                "bbox": shelf.get("bbox", []),
                "visit_count": visit_cnt,
                "total_dwell_time": round(total_dwell, 1),
                "avg_dwell_time": avg_dwell,
                "interaction_count": shelf_interactions,
                "products": shelf.get("products", [])
            })

        # Calculate overall average dwell time across all shelves
        all_dwells = [s["avg_dwell_time"] for s in shelf_stats if s["avg_dwell_time"] > 0]
        avg_shelf_dwell = round(float(np.mean(all_dwells)), 1) if all_dwells else 0.0

        # Sort shelves by visits for engagement ranking
        shelf_ranking = sorted(shelf_stats, key=lambda s: (s["visit_count"], s["total_dwell_time"]), reverse=True)

        most_visited = shelf_ranking[0] if shelf_ranking and shelf_ranking[0]["visit_count"] > 0 else None
        least_visited = shelf_ranking[-1] if shelf_ranking else None
        
        # Shelf with highest dwell time
        highest_dwell_shelf = max(shelf_stats, key=lambda s: s["avg_dwell_time"]) if shelf_stats and max(s["avg_dwell_time"] for s in shelf_stats) > 0 else None

        # Customer visit duration stats
        durations = [c.get("total_time_seconds", 0) for c in customers]
        avg_store_time = round(float(np.mean(durations)), 1) if durations else 0.0

        # AI-generated observations strictly derived from data
        observations = []
        recommendations = []

        if total_customers == 0:
            observations.append("No active customers were detected in the visible camera area during this footage.")
            recommendations.append("Ensure CCTV camera angle has an unobstructed view of the retail shopping floor.")
        else:
            observations.append(
                f"Tracked {total_customers} customer journey(s) with an average in-store stay of {avg_store_time} seconds."
            )

            if most_visited:
                observations.append(
                    f"{most_visited['label']} achieved highest foot traffic with {most_visited['visit_count']} unique visits."
                )

            if highest_dwell_shelf and highest_dwell_shelf["avg_dwell_time"] > 5.0:
                observations.append(
                    f"Highest customer consideration occurred at {highest_dwell_shelf['label']} (average dwell {highest_dwell_shelf['avg_dwell_time']}s)."
                )

            if pickup_count > 0:
                observations.append(
                    f"Observed {pickup_count} possible product pickup gestures and {exam_count} detailed examination behaviors."
                )
            else:
                observations.append("No direct product pickup motions detected; customers primarily browsed without physical handling.")

            # Low traffic & layout recommendations
            low_traffic = traffic_info.get("low_traffic_zones", [])
            if low_traffic:
                observations.append(f"Identified low customer activity in: {', '.join(low_traffic)}.")
                recommendations.append(
                    f"Consider relocating high-margin products from underperforming zones ({low_traffic[0]}) toward {most_visited['label'] if most_visited else 'higher traffic aisles'}."
                )

            if least_visited and most_visited and least_visited['shelf_id'] != most_visited['shelf_id']:
                if least_visited['visit_count'] == 0:
                    recommendations.append(
                        f"{least_visited['label']} received 0 visits during this period. Review aisle lighting, end-cap signage, or aisle accessibility."
                    )

            recommendations.append(
                "Cross-reference CCTV possible pickup timestamps with electronic Point of Sale (POS) receipts for conversion reconciliation."
            )

        # Generate structured, prioritized decision-support recommendations
        detailed_recommendations = self.recommendation_engine.generate_recommendations(
            customers=customers,
            shelves=shelves,
            events=events,
            traffic_info=traffic_info,
            video_metadata=video_metadata
        )

        summary = {
            "total_customers": total_customers,
            "total_interactions": total_interactions,
            "total_shelves": total_shelves,
            "avg_shelf_dwell_time": avg_shelf_dwell,
            "avg_store_time": avg_store_time,
            "possible_product_pickups": pickup_count,
            "possible_product_returns": return_count,
            "possible_examinations": exam_count,
            "shelf_ranking": shelf_ranking,
            "most_visited_shelf": most_visited["label"] if most_visited else "None",
            "least_visited_shelf": least_visited["label"] if least_visited else "None",
            "highest_dwell_shelf": highest_dwell_shelf["label"] if highest_dwell_shelf else "None",
            "high_traffic_zones": traffic_info.get("high_traffic_zones", []),
            "low_traffic_zones": traffic_info.get("low_traffic_zones", []),
            "zone_distribution": traffic_info.get("zone_distribution", []),
            "observations": observations,
            "recommendations": recommendations,
            "recommendations_detail": detailed_recommendations,
            "disclaimer": "All product interaction events are AI-estimated behaviors based on spatial and temporal computer vision analysis. CCTV cannot confirm financial purchase transactions without POS integration."
        }

        return {
            "summary": summary,
            "shelf_stats": shelf_stats
        }

