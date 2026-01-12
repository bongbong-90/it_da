"""
ITDA AI Server - FastAPI Main
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.api.ai_routes import router as ai_router
from app.models.model_loader import model_loader
from app.core.logging import logger


# ========================================
# Lifespan Event Handler
# ========================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """서버 시작/종료 이벤트 핸들러"""
    # Startup
    logger.info("🚀 ITDA AI Server 시작")

    try:
        model_loader.load_all()
        logger.info("✅ 모든 모델 로딩 완료")
    except Exception as e:
        logger.error(f"❌ 모델 로딩 실패: {e}")
        raise

    yield  # 서버 실행 중

    # Shutdown
    logger.info("👋 ITDA AI Server 종료")


# FastAPI 앱 생성
app = FastAPI(
    title="ITDA AI Server",
    description="모임 추천 AI 서버 (SVD, LightGBM Ranker, KcELECTRA)",
    version="2.0.0",
    lifespan=lifespan
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Spring Boot 서버 주소
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 라우터 등록
app.include_router(ai_router)

@app.get("/")
async def root():
    """헬스 체크"""
    return {
        "status": "ok",
        "message": "ITDA AI Server is running",
        "version": "2.0.0",
        "models": model_loader.get_status()
    }

# ========================================
# 서버 실행
# ========================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )