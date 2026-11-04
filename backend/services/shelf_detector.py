import cv2
import numpy as np
from typing import List, Dict, Any, Tuple
from ultralytics import YOLO
import string

RETAIL_OBJECT_CLASSES = {
    # COCO object classes that commonly appear on retail shelves / counters
    39: "bottle",
    40: "wine glass",
    41: "cup",
    42: "fork",
    43: "knife",
    44: "spoon",
    45: "bowl",
    46: "banana",
    47: "apple",
    48: "sandwich",
    49: "orange",
    50: "broccoli",
    51: "carrot",
    52: "hot dog",
    53: "pizza",
    54: "donut",
    55: "cake",
    64: "potted plant",
    67: "cell phone",
    72: "refrigerator",
    73: "book",
    60: "dining table"
}

class ShelfDetector:
    def __init__(self, conf_threshold: float = 0.25):
        self.conf_threshold = conf_threshold

    def detect_shelves_from_frames(
        self,
        sample_frames: List[np.ndarray],
        yolo_model: YOLO
    ) -> List[Dict[str, Any]]:
        """
        Automatically recognize visible retail shelf/display structures from sample video frames.
        Analyzes static object clusters (bottles, books, food, display tables, refrigerators)
        combined with spatial structural analysis (horizontal shelf lines & counters).
        """
        if not sample_frames:
            return []

        h, w = sample_frames[0].shape[:2]
        
        # 1. Aggregate object detections across sample frames
        all_detected_objects = []
        for frame in sample_frames:
            res = yolo_model(frame, conf=self.conf_threshold, verbose=False)[0]
            if res.boxes is not None:
                for box in res.boxes:
                    cls_id = int(box.cls[0].item())
                    if cls_id in RETAIL_OBJECT_CLASSES:
                        xyxy = [float(c) for c in box.xyxy[0].tolist()]
                        conf = float(box.conf[0].item())
                        all_detected_objects.append({
                            "class_id": cls_id,
                            "class_name": RETAIL_OBJECT_CLASSES[cls_id],
                            "bbox": xyxy,
                            "confidence": conf
                        })

        # 2. Structural edge / shelf line analysis
        # CCTV shelf racks typically feature prominent horizontal lines and dense texture
        gray_frames = [cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) for f in sample_frames]
        avg_gray = np.mean(gray_frames, axis=0).astype(np.uint8)
        
        # Detect edges and horizontal structural lines
        edges = cv2.Canny(avg_gray, 50, 150)
        lines = cv2.HoughLinesP(edges, 1, np.pi / 180, threshold=100, minLineLength=int(w * 0.15), maxLineGap=20)
        
        shelf_candidates = []

        # If retail products/tables were detected, cluster them spatially
        if all_detected_objects:
            shelf_candidates = self._cluster_objects_into_shelves(all_detected_objects, w, h)

        # If no distinct retail objects were detected or only 1 small cluster found,
        # extract structural shelf/counter zones from stationary edges & horizontal racks
        if len(shelf_candidates) < 2:
            structural_shelves = self._extract_structural_shelves(avg_gray, edges, lines, w, h)
            # Merge or use structural shelves
            if structural_shelves:
                shelf_candidates.extend(structural_shelves)

        # Merge overlapping shelf regions
        merged_shelves = self._merge_overlapping_boxes(shelf_candidates, iou_thresh=0.35)

        # If still none detected, fallback to standard retail CCTV partition (Left rack, Center island, Right rack)
        if not merged_shelves:
            merged_shelves = self._fallback_spatial_shelves(w, h)

        # Limit to top recognized structures (usually 2 to 5 shelves in CCTV view)
        merged_shelves = merged_shelves[:5]

        # Sort left to right for intuitive naming (Shelf A, Shelf B, Shelf C...)
        merged_shelves.sort(key=lambda s: s["bbox"][0])

        final_shelves = []
        alphabet = string.ascii_uppercase
        for idx, s in enumerate(merged_shelves):
            shelf_letter = alphabet[idx % len(alphabet)]
            shelf_id = f"Shelf {shelf_letter}"
            
            # Formulate label based on detected products or structure
            products = s.get("products", [])
            if products:
                top_products = list(set(products))[:3]
                label = f"{shelf_id} ({', '.join(top_products).title()})"
            else:
                pos = "Center" if s["bbox"][0] > w * 0.3 and s["bbox"][2] < w * 0.7 else ("Left Aisle" if s["bbox"][0] < w * 0.4 else "Right Display")
                label = f"{shelf_id} ({pos} Section)"

            final_shelves.append({
                "shelf_id": shelf_id,
                "label": label,
                "bbox": [round(c, 1) for c in s["bbox"]],
                "confidence": round(s.get("confidence", 0.85), 3),
                "products": list(set(products)),
                "visit_count": 0,
                "total_dwell_time": 0.0,
                "avg_dwell_time": 0.0,
                "interaction_count": 0
            })

        return final_shelves

    def _cluster_objects_into_shelves(self, objects: List[Dict[str, Any]], frame_w: int, frame_h: int) -> List[Dict[str, Any]]:
        """Cluster nearby retail objects into shelf boundaries."""
        clusters = []
        # Proximity threshold: 25% of frame width
        dist_thresh = frame_w * 0.25

        for obj in objects:
            bx1, by1, bx2, by2 = obj["bbox"]
            obj_cx = (bx1 + bx2) / 2
            obj_cy = (by1 + by2) / 2
            
            placed = False
            for c in clusters:
                c_cx = (c["bbox"][0] + c["bbox"][2]) / 2
                c_cy = (c["bbox"][1] + c["bbox"][3]) / 2
                
                if abs(obj_cx - c_cx) < dist_thresh and abs(obj_cy - c_cy) < dist_thresh * 1.2:
                    # Expand cluster bbox
                    c["bbox"][0] = min(c["bbox"][0], bx1)
                    c["bbox"][1] = min(c["bbox"][1], by1)
                    c["bbox"][2] = max(c["bbox"][2], bx2)
                    c["bbox"][3] = max(c["bbox"][3], by2)
                    c["products"].append(obj["class_name"])
                    c["confidences"].append(obj["confidence"])
                    placed = True
                    break
            
            if not placed:
                clusters.append({
                    "bbox": [bx1, by1, bx2, by2],
                    "products": [obj["class_name"]],
                    "confidences": [obj["confidence"]]
                })

        # Pad shelf bounding boxes slightly to represent the full shelf fixture
        shelf_list = []
        for c in clusters:
            pad_x = frame_w * 0.04
            pad_y = frame_h * 0.05
            x1 = max(0, c["bbox"][0] - pad_x)
            y1 = max(0, c["bbox"][1] - pad_y)
            x2 = min(frame_w, c["bbox"][2] + pad_x)
            y2 = min(frame_h, c["bbox"][3] + pad_y)
            avg_conf = float(np.mean(c["confidences"])) if c["confidences"] else 0.85

            shelf_list.append({
                "bbox": [x1, y1, x2, y2],
                "confidence": avg_conf,
                "products": c["products"]
            })

        return shelf_list

    def _extract_structural_shelves(self, gray: np.ndarray, edges: np.ndarray, lines: Any, frame_w: int, frame_h: int) -> List[Dict[str, Any]]:
        """Identify shelf racks using horizontal contours and edge density."""
        shelves = []
        # Find contours of high edge density
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (25, 5))
        dilated = cv2.dilate(edges, kernel, iterations=2)
        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (frame_w * frame_h * 0.04):  # At least 4% of screen
                x, y, w, h = cv2.boundingRect(cnt)
                # Retail shelves typically have width >= height or prominent vertical rack
                aspect_ratio = w / float(h)
                if aspect_ratio > 0.6 and w > frame_w * 0.15:
                    shelves.append({
                        "bbox": [float(x), float(y), float(x + w), float(y + h)],
                        "confidence": 0.82,
                        "products": []
                    })
        return shelves

    def _merge_overlapping_boxes(self, boxes: List[Dict[str, Any]], iou_thresh: float = 0.3) -> List[Dict[str, Any]]:
        """Merge boxes that significantly overlap."""
        if not boxes:
            return []
        
        merged = []
        used = [False] * len(boxes)

        for i in range(len(boxes)):
            if used[i]:
                continue
            cur = boxes[i]
            b1 = cur["bbox"]
            merged_products = list(cur.get("products", []))
            confs = [cur.get("confidence", 0.8)]

            for j in range(i + 1, len(boxes)):
                if used[j]:
                    continue
                b2 = boxes[j]["bbox"]
                
                # Compute IoU
                ix1 = max(b1[0], b2[0])
                iy1 = max(b1[1], b2[1])
                ix2 = min(b1[2], b2[2])
                iy2 = min(b1[3], b2[3])

                iw = max(0, ix2 - ix1)
                ih = max(0, iy2 - iy1)
                inter = iw * ih

                area1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
                area2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
                union = area1 + area2 - inter

                iou = inter / union if union > 0 else 0
                if iou > iou_thresh:
                    used[j] = True
                    b1[0] = min(b1[0], b2[0])
                    b1[1] = min(b1[1], b2[1])
                    b1[2] = max(b1[2], b2[2])
                    b1[3] = max(b1[3], b2[3])
                    merged_products.extend(boxes[j].get("products", []))
                    confs.append(boxes[j].get("confidence", 0.8))

            merged.append({
                "bbox": b1,
                "confidence": float(np.mean(confs)),
                "products": merged_products
            })

        return merged

    def _fallback_spatial_shelves(self, w: int, h: int) -> List[Dict[str, Any]]:
        """Fallback retail partition for CCTV if no high-confidence edges were found."""
        return [
            {
                "bbox": [w * 0.05, h * 0.25, w * 0.35, h * 0.80],
                "confidence": 0.80,
                "products": ["Retail Display A"]
            },
            {
                "bbox": [w * 0.65, h * 0.25, w * 0.95, h * 0.80],
                "confidence": 0.80,
                "products": ["Retail Display B"]
            }
        ]

