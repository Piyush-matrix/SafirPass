from __future__ import annotations

import base64
import json
import os
from pathlib import Path
from typing import Any

import cv2
import numpy as np


class DocumentFeatureExtractor:
    """Extracts structural and visual features from document images using OpenCV."""

    FEATURE_NAMES = [
        "aspect_ratio",
        "blur_score",
        "brightness",
        "contrast",
        "edge_density",
        "face_count",
        "contour_count",
    ]

    @classmethod
    def extract_from_base64(cls, base64_str: str) -> dict[str, Any]:
        cleaned = base64_str.strip()
        if "," in cleaned:
            cleaned = cleaned.split(",", 1)[1]

        try:
            image_bytes = base64.b64decode(cleaned, validate=True)
            np_arr = np.frombuffer(image_bytes, dtype=np.uint8)
            image = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        except Exception:
            image = None

        if image is None:
            return {
                "valid_image": False,
                "aspect_ratio": 0.0,
                "blur_score": 0.0,
                "brightness": 0.0,
                "contrast": 0.0,
                "edge_density": 0.0,
                "face_count": 0,
                "contour_count": 0,
                "vector": [0.0] * len(cls.FEATURE_NAMES),
            }

        h, w = image.shape[:2]
        aspect_ratio = round(float(w) / max(1.0, float(h)), 3)

        gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
        blur_score = round(float(cv2.Laplacian(gray, cv2.CV_64F).var()), 2)
        brightness = round(float(np.mean(gray)), 2)
        contrast = round(float(np.std(gray)), 2)

        edges = cv2.Canny(gray, 50, 150)
        edge_density = round(float(np.count_nonzero(edges)) / max(1.0, float(h * w)), 4)

        face_cascade = cv2.CascadeClassifier(
            cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
        )
        faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=4)
        face_count = len(faces)

        contours, _ = cv2.findContours(edges, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE)
        contour_count = len(contours)

        vector = [
            aspect_ratio,
            blur_score,
            brightness,
            contrast,
            edge_density,
            float(face_count),
            float(contour_count),
        ]

        return {
            "valid_image": True,
            "width": w,
            "height": h,
            "aspect_ratio": aspect_ratio,
            "blur_score": blur_score,
            "brightness": brightness,
            "contrast": contrast,
            "edge_density": edge_density,
            "face_count": face_count,
            "contour_count": contour_count,
            "vector": vector,
        }


class DocumentMlModel:
    """Manages heuristic verification (cold-start) and scikit-learn model inference & training."""

    def __init__(self, model_dir: str | Path | None = None) -> None:
        self.model_dir = Path(model_dir or Path(__file__).resolve().parent.parent / "data")
        self.model_path = self.model_dir / "document_model.joblib"
        self._model = None
        self._load_model()

    def _load_model(self) -> None:
        if self.model_path.exists():
            try:
                import joblib

                self._model = joblib.load(self.model_path)
            except Exception as err:
                print(f"[DocumentMlModel] Could not load saved model: {err}")
                self._model = None

    def evaluate(self, doc_type: str, features: dict[str, Any]) -> dict[str, Any]:
        """Evaluates document authenticity using trained ML model if available, else cold-start heuristics."""
        if not features.get("valid_image", False):
            return {
                "approved": False,
                "confidence": 0.0,
                "model_type": "validation_guard",
                "message": "Invalid or unreadable image data.",
                "quality_passed": False,
            }

        vector = features["vector"]
        blur = features["blur_score"]
        brightness = features["brightness"]
        aspect = features["aspect_ratio"]
        faces = features["face_count"]
        density = features["edge_density"]

        # Check basic legibility across all types
        is_sharp = blur >= 35.0
        is_well_lit = 35.0 <= brightness <= 225.0
        quality_passed = is_sharp and is_well_lit

        # If a trained Random Forest classifier exists and has predict_proba
        if self._model is not None:
            try:
                X = np.array([vector])
                prob = float(self._model.predict_proba(X)[0][1])
                approved = prob >= 0.5 and quality_passed
                return {
                    "approved": bool(approved),
                    "confidence": round(prob, 4),
                    "model_type": "trained_random_forest",
                    "message": "Evaluated by trained Random Forest document model.",
                    "quality_passed": quality_passed,
                }
            except Exception:
                pass

        # Phase 1: Cold-Start Heuristic Rules Engine
        doc_type_lower = doc_type.lower()
        if "passport" in doc_type_lower:
            # Passport bio page expects a portrait photo, structured landscape aspect ratio, and good sharpness
            has_photo = faces >= 1
            has_standard_ratio = 1.1 <= aspect <= 1.8
            is_valid = quality_passed and has_standard_ratio
            confidence = 0.88 if (is_valid and has_photo) else 0.65 if is_valid else 0.35
            msg = "Passport format validated." if is_valid else "Passport image blurry, poorly lit, or wrong framing."
            return {
                "approved": is_valid,
                "confidence": confidence,
                "model_type": "cold_start_heuristics",
                "message": msg,
                "quality_passed": quality_passed,
                "details": {"face_detected": has_photo, "sharpness_acceptable": is_sharp},
            }

        if "visa" in doc_type_lower:
            # Visa grant usually has high text and border contour density
            has_text_content = density >= 0.015 and features["contour_count"] >= 30
            is_valid = quality_passed and has_text_content
            confidence = 0.85 if is_valid else 0.40
            msg = "Visa document structure verified." if is_valid else "Visa text or seal details unclear."
            return {
                "approved": is_valid,
                "confidence": confidence,
                "model_type": "cold_start_heuristics",
                "message": msg,
                "quality_passed": quality_passed,
            }

        # Hotel stay proof or flight tickets
        is_valid = quality_passed and features["contour_count"] >= 15
        return {
            "approved": is_valid,
            "confidence": 0.80 if is_valid else 0.45,
            "model_type": "cold_start_heuristics",
            "message": "Supporting document format accepted." if is_valid else "Document unreadable.",
            "quality_passed": quality_passed,
        }

    def train(self, samples: list[tuple[list[float], int]]) -> dict[str, Any]:
        """Trains the Random Forest classifier on human-labeled dataset samples."""
        if len(samples) < 4:
            return {
                "success": False,
                "message": f"Need at least 4 labeled samples to train. Currently have {len(samples)}.",
                "trained": False,
            }

        from sklearn.ensemble import RandomForestClassifier
        import joblib

        X = [s[0] for s in samples]
        y = [s[1] for s in samples]

        # Require at least one positive and one negative sample, or dummy-augment for early dataset
        unique_classes = set(y)
        if len(unique_classes) < 2:
            # Add synthetic contrast baseline for single-class cold start
            synthetic_negative = [0.1, 10.0, 20.0, 5.0, 0.001, 0.0, 2.0]
            X.append(synthetic_negative)
            y.append(0 if 1 in unique_classes else 1)

        clf = RandomForestClassifier(n_estimators=50, max_depth=5, random_state=42)
        clf.fit(X, y)

        self.model_dir.mkdir(parents=True, exist_ok=True)
        joblib.dump(clf, self.model_path)
        self._model = clf

        importances = {
            name: round(float(imp), 4)
            for name, imp in zip(DocumentFeatureExtractor.FEATURE_NAMES, clf.feature_importances_)
        }

        return {
            "success": True,
            "message": f"Model successfully retrained on {len(samples)} document samples.",
            "samples_count": len(samples),
            "feature_importances": importances,
            "trained": True,
        }
