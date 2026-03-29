from __future__ import annotations

import base64
import os
from dataclasses import dataclass
from functools import lru_cache
from typing import Any

KNOWN_CROP_PROMPTS = {
    "wheat": "a photo of a wheat crop plant in a farm field",
    "rice": "a photo of a rice paddy crop plant in a farm field",
    "soybean": "a photo of a soybean crop plant in a farm field",
    "gram": "a photo of a gram or chana crop plant in a farm field",
    "mustard": "a photo of a mustard crop plant in a farm field",
    "maize": "a photo of a maize or corn crop plant in a farm field",
    "tomato": "a photo of a tomato crop plant in a farm field",
    "lentil": "a photo of a lentil or masoor crop plant in a farm field",
}

CROP_VALIDATION_LABELS = [
    "a real photo of a crop plant in a field",
    "a real close-up photo of leaves on a farm crop",
    "a real agriculture plant disease photo",
    "a cartoon or anime character",
    "a person selfie or portrait",
    "a screenshot, poster, or digital graphic",
    "a household object or indoor scene",
    "an animal photo",
]

CROP_POSITIVE_LABELS = {
    "a real photo of a crop plant in a field",
    "a real close-up photo of leaves on a farm crop",
    "a real agriculture plant disease photo",
}


@dataclass
class LocalInspectionResult:
    is_crop_image: bool
    image_clear: bool
    detected_crop: str
    confidence: str
    reason: str
    user_message: str
    user_message_hi: str
    action_steps: list[str]

    def to_dict(self) -> dict[str, Any]:
        return {
            "is_crop_image": self.is_crop_image,
            "image_clear": self.image_clear,
            "detected_crop": self.detected_crop,
            "confidence": self.confidence,
            "reason": self.reason,
            "user_message": self.user_message,
            "user_message_hi": self.user_message_hi,
            "action_steps": self.action_steps,
        }


class OpenSourceImageInspector:
    def __init__(self) -> None:
        self.model_name = os.environ.get("IMAGE_INSPECTOR_MODEL", "openai/clip-vit-base-patch32")
        self.cache_dir = os.environ.get("IMAGE_INSPECTOR_CACHE_DIR", "") or None

    def inspect(self, image_b64: str, crop_hint: str = "", language: str = "hi") -> dict[str, Any]:
        try:
            image = self._decode_image(image_b64)
        except Exception:
            return self._build_invalid_response(
                reason="Uploaded file could not be read as an image.",
                user_message="The uploaded file could not be read as an image. Please try another crop photo.",
                user_message_hi="अपलोड की गई फाइल इमेज के रूप में पढ़ी नहीं जा सकी। कृपया दूसरी फसल की फोटो आजमाएं।",
                confidence="low",
            )

        clarity = self._check_image_clarity(image)
        if not clarity["image_clear"]:
            return self._build_invalid_response(
                reason=clarity["reason"],
                user_message="The image is too dark, too bright, or not sharp enough for analysis. Please upload a clearer crop photo.",
                user_message_hi="इमेज विश्लेषण के लिए साफ नहीं है। कृपया रोशनी में एक और साफ फसल फोटो अपलोड करें।",
                confidence="medium",
                is_crop_image=True,
            )

        classifier = self._get_zero_shot_classifier()
        if classifier is None:
            return self._build_invalid_response(
                reason="Open-source image model is not available locally.",
                user_message="Local image model is not ready yet. Please install the vision dependencies and try again.",
                user_message_hi="लोकल इमेज मॉडल अभी तैयार नहीं है। कृपया vision dependencies install करके फिर कोशिश करें।",
                confidence="low",
            )

        validation = self._normalize_classifier_output(classifier(image, candidate_labels=CROP_VALIDATION_LABELS))
        labels = validation["labels"]
        scores = validation["scores"]
        score_map = {label: float(score) for label, score in zip(labels, scores)}
        crop_score = sum(score_map.get(label, 0.0) for label in CROP_POSITIVE_LABELS)
        non_crop_best = max((score for label, score in score_map.items() if label not in CROP_POSITIVE_LABELS), default=0.0)

        if crop_score < max(0.55, non_crop_best + 0.05):
            return self._build_invalid_response(
                reason="Image does not look like a real crop or plant photo.",
                user_message="The uploaded image does not appear to be a crop or plant photo. Please upload your crop image for analysis.",
                user_message_hi="अपलोड की गई इमेज फसल या पौधे की फोटो नहीं लग रही। कृपया अपनी फसल की सही फोटो दें।",
                confidence=self._score_to_confidence(max(crop_score, non_crop_best)),
            )

        crop_candidates = list(KNOWN_CROP_PROMPTS.values())
        crop_result = self._normalize_classifier_output(classifier(image, candidate_labels=crop_candidates))
        crop_labels = crop_result["labels"]
        crop_scores = crop_result["scores"]
        reverse_map = {prompt: crop for crop, prompt in KNOWN_CROP_PROMPTS.items()}

        detected_crop = "unknown"
        top_score = 0.0
        if crop_labels:
            top_prompt = crop_labels[0]
            detected_crop = reverse_map.get(top_prompt, "unknown")
            top_score = float(crop_scores[0]) if crop_scores else 0.0

        if crop_hint and crop_hint in KNOWN_CROP_PROMPTS and top_score < 0.38:
            detected_crop = crop_hint

        crop_label = detected_crop if detected_crop != "unknown" else (crop_hint or "crop")
        confidence = self._score_to_confidence(max(crop_score, top_score))
        return LocalInspectionResult(
            is_crop_image=True,
            image_clear=True,
            detected_crop=detected_crop,
            confidence=confidence,
            reason=f"Local open-source vision model detected a likely crop image. Detected crop: {crop_label}.",
            user_message=f"Image verified successfully. Detected crop: {crop_label}.",
            user_message_hi=f"इमेज सफलतापूर्वक जांची गई। पहचानी गई फसल: {crop_label}.",
            action_steps=[
                "Review the detected crop before submitting.",
                "If needed, change the crop manually from the dropdown.",
            ],
        ).to_dict()

    def _decode_image(self, image_b64: str):
        from io import BytesIO
        from PIL import Image, ImageOps

        image = Image.open(BytesIO(base64.b64decode(image_b64)))
        image = ImageOps.exif_transpose(image)
        return image.convert("RGB")

    def _check_image_clarity(self, image) -> dict[str, Any]:
        from PIL import ImageFilter, ImageStat

        gray = image.convert("L")
        brightness = ImageStat.Stat(gray).mean[0]
        edge_img = gray.filter(ImageFilter.FIND_EDGES)
        edge_variance = ImageStat.Stat(edge_img).var[0]

        if brightness < 35:
            return {"image_clear": False, "reason": "Image is too dark for analysis."}
        if brightness > 245:
            return {"image_clear": False, "reason": "Image is too bright or washed out for analysis."}
        if edge_variance < 150:
            return {"image_clear": False, "reason": "Image appears blurry or lacks visible plant detail."}
        return {"image_clear": True, "reason": "Image clarity looks acceptable."}

    @staticmethod
    @lru_cache(maxsize=1)
    def _get_zero_shot_classifier():
        try:
            from transformers import pipeline
        except Exception:
            return None

        model_name = os.environ.get("IMAGE_INSPECTOR_MODEL", "openai/clip-vit-base-patch32")
        cache_dir = os.environ.get("IMAGE_INSPECTOR_CACHE_DIR", "") or None
        try:
            return pipeline(
                task="zero-shot-image-classification",
                model=model_name,
                device=-1,
                cache_dir=cache_dir,
            )
        except Exception:
            return None

    @staticmethod
    def _normalize_classifier_output(result: Any) -> dict[str, list[Any]]:
        if isinstance(result, dict):
            return {
                "labels": list(result.get("labels", [])),
                "scores": list(result.get("scores", [])),
            }
        if isinstance(result, list):
            labels: list[Any] = []
            scores: list[Any] = []
            for item in result:
                if isinstance(item, dict):
                    labels.append(item.get("label", ""))
                    scores.append(item.get("score", 0.0))
            return {"labels": labels, "scores": scores}
        return {"labels": [], "scores": []}

    def _build_invalid_response(
        self,
        reason: str,
        user_message: str,
        user_message_hi: str,
        confidence: str,
        is_crop_image: bool = False,
    ) -> dict[str, Any]:
        return LocalInspectionResult(
            is_crop_image=is_crop_image,
            image_clear=False,
            detected_crop="",
            confidence=confidence,
            reason=reason,
            user_message=user_message,
            user_message_hi=user_message_hi,
            action_steps=[
                "Upload a clear crop or plant photo.",
                "Make sure leaves, stem, or the affected area is visible.",
            ],
        ).to_dict()

    @staticmethod
    def _score_to_confidence(score: float) -> str:
        if score >= 0.72:
            return "high"
        if score >= 0.5:
            return "medium"
        return "low"


