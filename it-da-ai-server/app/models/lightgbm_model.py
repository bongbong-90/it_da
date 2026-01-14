"""
LightGBM Ranker Model Wrapper
"""

import pickle
import numpy as np
from pathlib import Path
from typing import Optional, Union, Dict
import lightgbm as lgb


class LightGBMRankerModel:
    """LightGBM Ranker 모델"""

    def __init__(self, model_path: str = "models/lightgbm_model.pkl"):
        self.model_path = Path(model_path)
        self.model: Optional[Union[lgb.Booster, lgb.LGBMRanker, Dict]] = None
        self.model_type: Optional[str] = None

    def load(self):
        """모델 로드"""
        if not self.model_path.exists():
            raise FileNotFoundError(f"Model not found: {self.model_path}")

        with open(self.model_path, "rb") as f:
            loaded = pickle.load(f)

        # 모델 타입 확인
        if isinstance(loaded, dict):
            # 딕셔너리에서 모델 추출
            if 'model' in loaded:
                self.model = loaded['model']
                self.model_type = "dict_wrapped"
            elif 'ranker' in loaded:
                self.model = loaded['ranker']
                self.model_type = "dict_wrapped"
            else:
                raise ValueError(f"딕셔너리에 모델이 없습니다. 키: {list(loaded.keys())}")
        elif hasattr(loaded, 'predict'):
            # 직접 모델
            self.model = loaded
            self.model_type = "direct"
        else:
            raise ValueError(f"지원하지 않는 모델 타입: {type(loaded)}")

        print(f"✅ LightGBM Ranker 로드 완료: {self.model_path} (타입: {self.model_type})")

    def predict(self, X: np.ndarray) -> np.ndarray:
        """예측"""
        if self.model is None:
            raise ValueError("Model not loaded. Call load() first.")

        return self.model.predict(X)

    def predict_single(self, features: np.ndarray) -> float:
        """단일 예측"""
        if features.ndim == 1:
            features = features.reshape(1, -1)

        pred = self.predict(features)
        return float(pred[0])

    def is_loaded(self) -> bool:
        """로드 여부 확인"""
        return self.model is not None