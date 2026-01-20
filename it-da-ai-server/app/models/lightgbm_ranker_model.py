"""
LightGBM Ranker Model Wrapper - Fixed Version
pickle 파일 구조를 올바르게 처리
"""

import json
import pickle
from pathlib import Path
from typing import Optional, Any

import numpy as np


class LightGBMRankerModel:
    def __init__(self, model_path: str = "models/lightgbm_ranker.pkl", calib_path: Optional[str] = None):
        self.model_path = Path(model_path)
        self.calib_path = Path(calib_path) if calib_path else None

        self.model: Optional[Any] = None
        self.calibration: Optional[dict] = None
        self.scaler = None
        self.feature_names = []
        self.model_type: Optional[str] = None
        self.schema_version: Optional[str] = None

    def load(self):
        """모델 로드 - 다양한 pickle 형식 지원"""
        # 1) 모델 파일 존재 확인
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {self.model_path}")

        print(f"📦 LightGBM Ranker 로딩 중: {self.model_path}")

        # 2) 모델 로드
        with open(self.model_path, "rb") as f:
            loaded = pickle.load(f)

        # ✅ 새 형식 (방금 학습한 모델): {"model": LGBMRanker, "feature_names": [...], ...}
        if isinstance(loaded, dict) and "model" in loaded:
            self.model = loaded["model"]  # ← 핵심: dict["model"]에서 실제 모델 추출!
            self.feature_names = loaded.get("feature_names", [])
            self.schema_version = loaded.get("schema_version")
            self.scaler = loaded.get("scaler")  # 있으면
            self.model_type = "dict_model_bundle"
            print(f"  ✅ 새 형식 모델 로드 (schema: {self.schema_version})")

        # ✅ 구 형식: {"ranker": ..., "scaler": ..., "feature_names": ...}
        elif isinstance(loaded, dict) and "ranker" in loaded:
            self.model = loaded["ranker"]
            self.scaler = loaded.get("scaler")
            self.feature_names = loaded.get("feature_names", [])
            self.model_type = "dict_ranker_bundle"
            print(f"  ✅ 구 형식 모델 로드")

        # ✅ 모델만 저장된 경우
        else:
            self.model = loaded
            self.model_type = "direct_model"
            print(f"  ✅ 직접 모델 로드")

        # 3) calibration 로드 (있으면)
        if self.calib_path and self.calib_path.exists():
            with open(self.calib_path, "r", encoding="utf-8") as f:
                self.calibration = json.load(f)
            print(f"  ✅ Calibration 로드: {self.calib_path}")

        print(
            f"✅ LightGBM Ranker 로드 완료! "
            f"(type={self.model_type}, features={len(self.feature_names)}, "
            f"calib={'yes' if self.calibration else 'no'})"
        )

    def predict(self, X: np.ndarray) -> np.ndarray:
        """예측 수행"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load() first.")

        # Scaler 적용 (있으면)
        if self.scaler is not None:
            X = self.scaler.transform(X)

        return self.model.predict(X)

    def predict_single(self, features: np.ndarray) -> float:
        """단일 샘플 예측"""
        if features.ndim == 1:
            features = features.reshape(1, -1)
        return float(self.predict(features)[0])

    def is_loaded(self) -> bool:
        """모델 로드 여부 확인"""
        return self.model is not None

    def get_info(self) -> dict:
        """모델 정보 반환"""
        return {
            "loaded": self.is_loaded(),
            "model_type": self.model_type,
            "schema_version": self.schema_version,
            "n_features": len(self.feature_names),
            "feature_names": self.feature_names[:10] if self.feature_names else [],
            "has_scaler": self.scaler is not None,
            "has_calibration": self.calibration is not None,
        }