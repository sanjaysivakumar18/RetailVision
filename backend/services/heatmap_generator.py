import cv2
import numpy as np
from pathlib import Path
from typing import List, Dict, Any

class HeatmapGenerator:
    def __init__(self, base_blur_sigma: int = 35):
        self.base_blur_sigma = base_blur_sigma

    def generate_heatmap(
        self,
        base_frame: np.ndarray,
        all_tracks: List[Dict[str, Any]],
        output_path: Path
    ) -> Dict[str, Any]:
        """
        Generates a video-specific movement heatmap based strictly on real customer movement.
        Features resolution-adaptive scaling and trajectory interpolation so heatmaps
        are vibrant, clear, and prominent on standard, HD, and 4K CCTV recordings.
        """
        h, w = base_frame.shape[:2]
        accum = np.zeros((h, w), dtype=np.float32)

        # Scale parameters proportionally to video resolution (relative to 1080p base)
        scale = max(w, h) / 1080.0
        radius = max(16, int(26 * scale))
        blur_sigma = max(20, int(self.base_blur_sigma * scale))

        total_points = 0
        # Accumulate movement points and interpolate trajectories
        for customer in all_tracks:
            trail = customer.get("movement_trail", [])
            if not trail:
                continue

            prev_pt = None
            for pt in trail:
                x, y = int(pt[0]), int(pt[1])
                if 0 <= x < w and 0 <= y < h:
                    # Draw foot position splat
                    cv2.circle(accum, (x, y), radius=radius, color=1.0, thickness=-1)
                    total_points += 1

                    # Interpolate line between consecutive points to ensure unbroken movement flow
                    if prev_pt is not None:
                        px, py = prev_pt
                        if 0 <= px < w and 0 <= py < h:
                            cv2.line(accum, (px, py), (x, y), color=1.0, thickness=radius * 2)

                    prev_pt = (x, y)

        output_path.parent.mkdir(parents=True, exist_ok=True)

        if total_points == 0:
            vis_empty = base_frame.copy()
            text_scale = max(0.7, 0.8 * scale)
            thick = max(1, int(2 * scale))
            cv2.putText(
                vis_empty, "No customer movement detected in session",
                (w // 4, h // 2), cv2.FONT_HERSHEY_SIMPLEX, text_scale, (200, 200, 200), thick, cv2.LINE_AA
            )
            cv2.imwrite(str(output_path), vis_empty)
            return {
                "heatmap_image_path": str(output_path.name),
                "total_movement_points": 0,
                "high_traffic_zones": [],
                "low_traffic_zones": ["Entire Camera View"],
                "zone_distribution": []
            }

        # Apply smooth Gaussian blur
        ksize = int(blur_sigma * 2) | 1  # ensure odd
        blurred = cv2.GaussianBlur(accum, (ksize, ksize), blur_sigma)

        # Normalize to 0-255
        max_val = np.max(blurred)
        if max_val > 0:
            normalized = (blurred / max_val * 255.0).astype(np.uint8)
        else:
            normalized = np.zeros((h, w), dtype=np.uint8)

        # Apply JET thermal colormap (Dark Blue -> Cyan -> Yellow -> Red)
        heatmap_color = cv2.applyColorMap(normalized, cv2.COLORMAP_JET)

        # Smooth alpha blend onto base CCTV background
        # Pixels with intensity > 8 get thermal color with soft transparency
        mask = normalized > 8
        alpha = (normalized[mask].astype(np.float32) / 255.0) * 0.55 + 0.25  # alpha between 0.25 and 0.80
        alpha = np.clip(alpha, 0.2, 0.75)[:, np.newaxis]

        blended = base_frame.copy()
        bg_pixels = blended[mask].astype(np.float32)
        hm_pixels = heatmap_color[mask].astype(np.float32)
        blended[mask] = (bg_pixels * (1.0 - alpha) + hm_pixels * alpha).astype(np.uint8)

        # Adaptive HUD Banner
        hud_w = int(320 * scale)
        hud_h = int(68 * scale)
        cv2.rectangle(blended, (int(16 * scale), int(16 * scale)), (int(16 * scale) + hud_w, int(16 * scale) + hud_h), (15, 23, 42), -1)
        cv2.rectangle(blended, (int(16 * scale), int(16 * scale)), (int(16 * scale) + hud_w, int(16 * scale) + hud_h), (59, 130, 246), max(1, int(scale)))

        font_scale = 0.52 * scale
        font_scale_sm = 0.40 * scale
        font_thick = max(1, int(scale))

        cv2.putText(
            blended, "RETAIL TRAFFIC HEATMAP",
            (int(28 * scale), int(42 * scale)),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), font_thick, cv2.LINE_AA
        )
        cv2.putText(
            blended, f"Cumulative Trajectory Points: {total_points}",
            (int(28 * scale), int(64 * scale)),
            cv2.FONT_HERSHEY_SIMPLEX, font_scale_sm, (148, 163, 184), max(1, int(font_thick * 0.8)), cv2.LINE_AA
        )

        # Add Thermal Legend Bar in bottom right
        legend_w = int(220 * scale)
        legend_h = int(20 * scale)
        leg_x = w - legend_w - int(24 * scale)
        leg_y = h - legend_h - int(36 * scale)

        # Draw gradient bar
        gradient = np.linspace(0, 255, legend_w, dtype=np.uint8)
        gradient = np.tile(gradient, (legend_h, 1))
        gradient_color = cv2.applyColorMap(gradient, cv2.COLORMAP_JET)
        
        cv2.rectangle(blended, (leg_x - 10, leg_y - int(20 * scale)), (leg_x + legend_w + 10, leg_y + legend_h + int(10 * scale)), (15, 23, 42), -1)
        blended[leg_y:leg_y + legend_h, leg_x:leg_x + legend_w] = gradient_color
        cv2.putText(blended, "Low Traffic", (leg_x, leg_y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.38 * scale, (148, 163, 184), 1, cv2.LINE_AA)
        cv2.putText(blended, "High Hotspot", (leg_x + legend_w - int(80 * scale), leg_y - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.38 * scale, (248, 113, 113), 1, cv2.LINE_AA)

        cv2.imwrite(str(output_path), blended)

        # Spatial Traffic Grid Analysis (3x3 grid)
        grid_rows, grid_cols = 3, 3
        cell_h, cell_w = h // grid_rows, w // grid_cols
        zone_names = [
            ["Top-Left Shelf Aisle", "Back-Center Display", "Top-Right Wall Shelf"],
            ["Mid-Left Aisle", "Central Walkway / Island", "Mid-Right Display"],
            ["Store Entrance / Left", "Front Checkout Passage", "Store Exit / Right"]
        ]

        zone_densities = []
        for r in range(grid_rows):
            for c in range(grid_cols):
                cell_sum = float(np.sum(normalized[r * cell_h:(r + 1) * cell_h, c * cell_w:(c + 1) * cell_w]))
                zone_densities.append({
                    "zone_name": zone_names[r][c],
                    "row": r,
                    "col": c,
                    "density": cell_sum
                })

        total_density = sum(z["density"] for z in zone_densities) or 1.0
        for z in zone_densities:
            z["percentage"] = round((z["density"] / total_density) * 100, 1)

        sorted_zones = sorted(zone_densities, key=lambda x: x["density"], reverse=True)
        high_traffic_zones = [z["zone_name"] for z in sorted_zones if z["percentage"] >= 15.0][:3]
        low_traffic_zones = [z["zone_name"] for z in sorted_zones if z["percentage"] <= 5.0][:3]

        return {
            "heatmap_image_path": str(output_path.name),
            "total_movement_points": total_points,
            "high_traffic_zones": high_traffic_zones,
            "low_traffic_zones": low_traffic_zones,
            "zone_distribution": zone_densities
        }
