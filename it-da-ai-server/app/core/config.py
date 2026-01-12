from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000

    # CORS - 문자열로 받아서 split ⭐
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://localhost:8080"

    # Kakao API
    KAKAO_REST_API_KEY: str = "your_key_here"
    KAKAO_LOCAL_API_URL: str = "https://dapi.kakao.com/v2/local"

    # Model Paths
    SVD_MODEL_PATH: str = "./models/svd_model.pkl"
    LIGHTGBM_MODEL_PATH: str = "./models/lightgbm_model.pkl"
    KCELECTRA_MODEL_NAME: str = "beomi/KcELECTRA-base"

    # Recommendations
    DEFAULT_SEARCH_RADIUS: int = 3000
    MAX_SEARCH_RADIUS: int = 5000
    MIN_RATING: float = 4.0
    TOP_N_RECOMMENDATIONS: int = 3

    # Database (선택)
    DATABASE_URL: str = "postgresql://user:pass@localhost/db"

    class Config:
        env_file = ".env"
        case_sensitive = True

    @property
    def get_allowed_origins(self) -> List[str]:
        """CORS origins를 리스트로 반환"""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()