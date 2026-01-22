"""
AI Routes for Spring Boot Integration
"""
import random
import requests

from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional, Tuple

import time
import math

import app
from app.models.model_loader import model_loader
from app.core.logging import logger
from app.schemas.ai_schemas import AISearchRequest, AISearchResponse
from app.core.feature_builder import FeatureBuilder
from app.services.gpt_prompt_service import GPTPromptService
from app.services.AIRecommendationService import AIRecommendationService
import math
import uuid
import os

feature_builder = FeatureBuilder()

router = APIRouter(prefix="/api/ai/recommendations", tags=["AI"])

# ========================================
# Request/Response Models (Spring Boot 호환)
# ========================================

class MatchScoresRequest(BaseModel):
    user_id: int
    meeting_ids: List[int]   # 현재 화면 카드들

class CandidateMeetingRequest(BaseModel):
    """후보 모임 정보 - Spring Boot 완전 호환"""

    meetingId: int = Field(alias="meeting_id")
    latitude: float
    longitude: float
    category: str
    subcategory: str

    # snake_case와 camelCase 모두 지원
    timeSlot: str = Field(alias="time_slot")
    locationType: str = Field(alias="location_type")
    vibe: str
    maxParticipants: int = Field(alias="max_participants")
    expectedCost: int = Field(alias="expected_cost")

    # Optional 필드
    avgRating: Optional[float] = Field(None, alias="avg_rating")
    ratingCount: Optional[int] = Field(None, alias="rating_count")
    currentParticipants: int = Field(alias="current_participants")

    class Config:
        populate_by_name = True  # ⭐ 핵심 설정
        allow_population_by_field_name = True

class PersonalizedRecommendRequest(BaseModel):
    user_id: int
    user_lat: float
    user_lng: float
    user_interests: str
    user_time_preference: str
    user_location_pref: str
    user_budget_type: str
    user_energy_type: str = "EXTROVERT"
    user_leadership_type: str = "FOLLOWER"
    user_frequency_type: str = "REGULAR"
    user_purpose_type: str = "TASK"
    user_avg_rating: float
    user_meeting_count: int
    user_rating_std: float
    candidate_meetings: List[CandidateMeetingRequest]

class SatisfactionRequest(BaseModel):
    user_id: int
    meeting_id: int
    user_lat: float
    user_lng: float
    user_interests: str
    user_time_preference: str
    user_location_pref: str
    user_budget_type: str
    user_avg_rating: float
    user_meeting_count: int
    user_rating_std: float
    meeting_lat: float
    meeting_lng: float
    meeting_category: str
    meeting_subcategory: str
    meeting_time_slot: str
    meeting_location_type: str
    meeting_vibe: str
    meeting_max_participants: int
    meeting_expected_cost: int
    meeting_avg_rating: Optional[float] = 0.0
    meeting_rating_count: int = 0
    meeting_participant_count: int = 0

class SentimentRequest(BaseModel):
    text: str

class CentroidRequest(BaseModel):
    user_locations: List[Dict[str, float]]

class PlaceRecommendRequest(BaseModel):
    participants: List[Dict]
    category: Optional[str] = "카페"
    max_distance: Optional[float] = 3.0

# ========================================
# Utility Functions
# ========================================

def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))

def score_to_rating(score: float) -> float:
    """Raw score → 1~5 평점 변환"""
    s = 1.0 / (1.0 + math.exp(-score))
    return round(clamp(1.0 + 4.0 * s, 1.0, 5.0), 1)

def rating_to_stars(rating: float) -> str:
    """평점 → 별 문자열"""
    full_stars = int(rating)
    half_star = 1 if (rating - full_stars) >= 0.5 else 0
    return "⭐" * full_stars + ("⭐" if half_star else "")

def get_satisfaction_level(rating: float) -> str:
    """만족도 레벨"""
    if rating >= 4.5:
        return "VERY_HIGH"
    elif rating >= 3.5:
        return "HIGH"
    elif rating >= 2.5:
        return "MEDIUM"
    else:
        return "LOW"

def build_reasons(feat: dict) -> List[Dict]:
    """만족도 예측 이유 생성"""
    reasons = []

    if feat.get("distance_km", 999) <= 3:
        reasons.append({
            "icon": "📍",
            "text": f"집에서 {feat['distance_km']:.1f}km로 가까워요"
        })

    if feat.get("time_match", 0) == 1.0:
        reasons.append({
            "icon": "⏰",
            "text": "선호하는 시간대와 잘 맞아요"
        })

    if feat.get("location_type_match", 0) == 1.0:
        reasons.append({
            "icon": "🏠",
            "text": "실내/야외 선호와 일치해요"
        })

    if feat.get("cost_match_score", 0.5) >= 0.7:
        reasons.append({
            "icon": "💰",
            "text": "예산 성향에 잘 맞는 비용이에요"
        })

    if feat.get("interest_match_score", 0) >= 0.5:
        reasons.append({
            "icon": "✨",
            "text": "관심사와 카테고리가 잘 맞아요"
        })

    # 최소 3개 보장
    if len(reasons) < 3:
        reasons.extend([
            {"icon": "👥", "text": "적당한 인원이에요"},
            {"icon": "🌟", "text": "새로운 경험을 시작하기 좋아요"},
            {"icon": "😊", "text": "즐거운 시간이 될 거예요"},
        ])

    return reasons[:5]

def rank_score_to_rating(score: float, calib: Optional[dict] = None) -> float:
    """
    Ranker raw score(무제한) -> 1~5 평점으로 매핑.
    - calibration에 min/max가 있으면 min-max
    - 없으면 sigmoid 기반으로 완만하게
    """
    if calib and "min" in calib and "max" in calib and calib["max"] > calib["min"]:
        s = (score - calib["min"]) / (calib["max"] - calib["min"])
        s = clamp(s, 0.0, 1.0)
    else:
        # fallback: sigmoid
        s = 1.0 / (1.0 + math.exp(-score))

    rating = 1.0 + 4.0 * s
    return round(clamp(rating, 1.0, 5.0), 1)

def rating_to_match_score(rating: float) -> int:
    # 1~5 -> 0~100
    return int(clamp(round((rating - 1.0) / 4.0 * 100), 0, 100))

def rating_to_match_score_nonlinear(rating: float, center: float = 3.6, temp: float = 0.22) -> int:
    # rating(1~5)을 sigmoid로 0~100으로 펴기
    z = (rating - center) / temp
    s = 1 / (1 + math.exp(-z))
    return int(round(100 * s))

def rating_to_match_score_sigmoid(r, mid=3.5, temp=0.35):
    # r: 1~5
    z = (r - mid) / temp
    s = 1/(1+math.exp(-z))
    return int(clamp(round(s*100), 0, 100))

def sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))

def percentile_rank(value: float, values: List[float]) -> float:
    """
    0~1 범위 퍼센타일 (value가 values에서 상위 몇 %인지)
    - tie는 중간값 느낌으로 처리
    """
    if not values:
        return 0.5
    values_sorted = sorted(values)
    n = len(values_sorted)
    # <= 개수 / n : 0~1
    le = sum(v <= value for v in values_sorted)
    return le / n

def match_from_percentile(p: float, floor: int = 25, ceil: int = 99, gamma: float = 1.35) -> int:
    """
    퍼센타일(0~1) -> 0~100 점수
    - floor~ceil 사이로 제한
    - gamma > 1 : 상위권이 더 치솟게(드라마틱)
    """
    p = max(0.0, min(1.0, p))
    # 상위권 강조
    shaped = p ** gamma
    score = floor + (ceil - floor) * shaped
    return int(round(max(0, min(100, score))))

_MATCH_DIST_CACHE: Dict[int, Tuple[float, List[float]]] = {}  # user_id -> (ts, dist_ratings)
_MATCH_CACHE_TTL_SEC = 30  # 30초만 캐시

def get_cached_dist(user_id: int) -> List[float] | None:
    hit = _MATCH_DIST_CACHE.get(user_id)
    if not hit:
        return None
    ts, dist = hit
    if time.time() - ts > _MATCH_CACHE_TTL_SEC:
        _MATCH_DIST_CACHE.pop(user_id, None)
        return None
    return dist

def set_cached_dist(user_id: int, dist: List[float]):
    _MATCH_DIST_CACHE[user_id] = (time.time(), dist)

def stretch(p: float, k: float = 1.8) -> float:
    # k > 1 : 0.5 기준으로 양끝으로 벌림
    return max(0.0, min(1.0, 0.5 + (p - 0.5) * k))

# ========================================
# Dependency Injection
# ========================================

def get_gpt_service() -> GPTPromptService:
    """GPT 서비스 의존성"""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="OPENAI_API_KEY not configured")
    return GPTPromptService(api_key=api_key)

def get_ai_recommendation_service(
    gpt_service: GPTPromptService = Depends(get_gpt_service)
) -> AIRecommendationService:
    """AI 추천 서비스 의존성"""
    spring_boot_url = os.getenv("SPRING_BOOT_URL", "http://localhost:8080")
    return AIRecommendationService(gpt_service, spring_boot_url)

# ========================================
# API Endpoints
# ========================================

@router.post("/personalized-recommendation")
async def get_personalized_recommendation(request: PersonalizedRecommendRequest):
    """개인화 AI 추천 - 사용자 성향 반영"""
    try:
        logger.info(
            f"🎯 개인화 추천: user_id={request.user_id}, energy={request.user_energy_type}, leadership={request.user_leadership_type}")

        if not model_loader.regressor or not model_loader.regressor.is_loaded():
            raise HTTPException(status_code=503, detail="Regressor 모델 미로드")

        # 사용자 정보
        user = {
            "lat": request.user_lat,
            "lng": request.user_lng,
            "interests": request.user_interests,
            "time_preference": request.user_time_preference,
            "user_location_pref": request.user_location_pref,
            "budget_type": request.user_budget_type,
            "user_avg_rating": request.user_avg_rating,
            "user_meeting_count": request.user_meeting_count,
            "user_rating_std": request.user_rating_std,

            # ⭐ 성향 정보
            "energy_type": request.user_energy_type,
            "leadership_type": request.user_leadership_type,
            "frequency_type": request.user_frequency_type,
            "purpose_type": request.user_purpose_type,
        }

        scored_meetings = []

        logger.info(f"[DBG] regressor wrapper class = {model_loader.regressor.__class__.__name__}")

        inner = getattr(model_loader.regressor, "model", None)
        logger.info(f"[DBG] regressor inner model type = {type(inner)}")

        for meeting_data in request.candidate_meetings:
            try:
                # ⭐ .get() 대신 직접 속성 접근
                meeting = {
                    "lat": meeting_data.latitude,
                    "lng": meeting_data.longitude,
                    "category": meeting_data.category,
                    "subcategory": meeting_data.subcategory,
                    "time_slot": meeting_data.timeSlot,
                    "meeting_location_type": meeting_data.locationType,
                    "vibe": meeting_data.vibe,
                    "max_participants": meeting_data.maxParticipants,
                    "expected_cost": meeting_data.expectedCost,
                    "meeting_avg_rating": meeting_data.avgRating or 0.0,
                    "meeting_rating_count": meeting_data.ratingCount or 0,
                    "meeting_participant_count": meeting_data.currentParticipants,
                }

                # Feature 추출
                feat, x = model_loader.feature_builder.build(user, meeting)

                # ⭐ 성향 기반 보너스 점수
                bonus_score = calculate_personality_bonus(user, meeting)

                # Regressor 예측
                import numpy as np
                predicted_rating = model_loader.regressor.predict(x)[0]
                predicted_rating = float(np.clip(predicted_rating + bonus_score, 1.0, 5.0))

                scored_meetings.append({
                    "meeting_id": meeting_data.meetingId,  # ⭐ 직접 접근
                    "predicted_rating": round(predicted_rating, 2),
                    "bonus_score": round(bonus_score, 2),
                    "meeting_data": meeting_data
                })

            except Exception as e:
                logger.warning(f"⚠️ 모임 {meeting_data.meetingId} 점수 계산 실패: {e}")  # ⭐ 직접 접근
                continue

        if not scored_meetings:
            return {"success": False, "message": "추천 불가", "recommendation": None}

        # 점수 높은 순 정렬
        scored_meetings.sort(key=lambda x: x["predicted_rating"], reverse=True)

        top_k = 10
        top_list = scored_meetings[:top_k]

        # seed가 있으면 seed로, 없으면 랜덤
        seed = getattr(request, "seed", None)
        rng = random.Random(seed) if seed is not None else random.Random()

        # 1등만 고르지 말고 top_k 중에서 뽑기 (확률 가중도 가능)
        picked = rng.choice(top_list)

        best = picked

        logger.info(f"✅ 추천완료: id={best['meeting_id']}, rating={best['predicted_rating']}, bonus={best['bonus_score']}")

        return {
            "success": True,
            "recommendation": {
                "meetingId": best["meeting_data"].meetingId,
                "latitude": best["meeting_data"].latitude,
                "longitude": best["meeting_data"].longitude,
                "category": best["meeting_data"].category,
                "subcategory": best["meeting_data"].subcategory,
                "timeSlot": best["meeting_data"].timeSlot,
                "locationType": best["meeting_data"].locationType,
                "vibe": best["meeting_data"].vibe,
                "maxParticipants": best["meeting_data"].maxParticipants,
                "expectedCost": best["meeting_data"].expectedCost,
                "avgRating": best["meeting_data"].avgRating,
                "ratingCount": best["meeting_data"].ratingCount,
                "currentParticipants": best["meeting_data"].currentParticipants,
            },
            "predicted_rating": best["predicted_rating"],
            "bonus_score": best["bonus_score"],
            "top_candidates": [
                {"meetingId": x["meeting_id"], "rating": x["predicted_rating"]}
                for x in top_list
            ],
            "total_candidates": len(request.candidate_meetings),
            "scored_count": len(scored_meetings)
        }

    except Exception as e:
        logger.error(f"❌ 추천 실패: {e}", exc_info=True)
        return {"success": False, "message": str(e), "recommendation": None}


def calculate_personality_bonus(user: dict, meeting: dict) -> float:
    """⭐ 사용자 성향 기반 보너스 점수 (DB Enum 기준)"""
    bonus = 0.0

    # 1. EnergyType (외향형/내향형)
    max_parts = meeting.get("max_participants", 5)  # ✅ 이건 dict이므로 .get() 사용
    energy = user.get("energy_type", "").upper()

    if energy == "EXTROVERT" and max_parts >= 6:
        bonus += 0.35
    elif energy == "INTROVERT" and max_parts <= 4:
        bonus += 0.35

    # 2. LeadershipType
    leadership = user.get("leadership_type", "").upper()
    if leadership == "LEADER":
        bonus += 0.15

    # 3. PurposeType
    purpose = user.get("purpose_type", "").upper()
    vibe = meeting.get("vibe", "").lower()

    if purpose == "RELATIONSHIP" and vibe in ["friendly", "social", "chill"]:
        bonus += 0.3
    elif purpose == "TASK" and vibe in ["focused", "productive", "energetic"]:
        bonus += 0.3

    # 4. FrequencyType
    frequency = user.get("frequency_type", "").upper()
    if frequency == "REGULAR":
        bonus += 0.1

    # 5. 관심사 매칭
    raw = user.get("interests", "") or ""
    interest_set = {x.strip().lower() for x in str(raw).replace("[", "").replace("]", "").replace('"', '').split(",") if
                    x.strip()}
    cat = (meeting.get("category", "") or "").strip().lower()
    sub = (meeting.get("subcategory", "") or "").strip().lower()

    if cat in interest_set or sub in interest_set:
        bonus += 0.25

    return min(bonus, 1.2)

@router.get("/health")
async def health_check():
    """
    AI 서버 헬스체크
    GET /api/ai/recommendations/health
    """
    return {
        "status": "ok",
        "message": "ITDA AI Server is running",
        "models": model_loader.get_status()
    }

@router.get("/models")
async def get_models_info():
    return {
        "models": model_loader.get_status(),
        "svd": {
            "loaded": model_loader.svd.is_loaded() if model_loader.svd else False,
            "user_count": len(model_loader.svd.user_ids) if model_loader.svd and model_loader.svd.user_ids else 0,
            "meeting_count": len(model_loader.svd.meeting_ids) if model_loader.svd and model_loader.svd.meeting_ids else 0
        } if model_loader.svd else {},
        "lightgbm": {
            "ranker_loaded": model_loader.ranker.is_loaded() if model_loader.ranker else False,
            "regressor_loaded": model_loader.regressor.is_loaded() if model_loader.regressor else False,
            "feature_count": len(model_loader.feature_builder.get_feature_names()) if model_loader.feature_builder else 0
        } if (model_loader.ranker or model_loader.regressor) else {},
        "kcelectra": {
            "loaded": model_loader.kcelectra.is_loaded() if model_loader.kcelectra else False,
            "device": model_loader.kcelectra.device if model_loader.kcelectra else "unknown"
        } if model_loader.kcelectra else {}
    }

# ========================================
# SVD 모임 추천
# ========================================

@router.get("/meetings")
async def recommend_meetings(user_id: int, top_n: int = 10):
    """
    SVD 협업 필터링 모임 추천
    GET /api/ai/recommendations/meetings?user_id=121&top_n=20
    """
    try:
        logger.info(f"🤖 AI 추천 요청: user_id={user_id}, top_n={top_n}")

        if not model_loader.svd or not model_loader.svd.is_loaded():
            logger.error("❌ SVD 모델이 로드되지 않았습니다")
            raise HTTPException(status_code=503, detail="SVD 모델이 로드되지 않았습니다")

        if top_n > 50:
            top_n = 50

        recommendations = await model_loader.svd.recommend(user_id=user_id, top_n=top_n)
        logger.info(f"✅ SVD 추천 완료: {len(recommendations)}개")

        rec_list = [
            {
                "meeting_id": int(meeting_id),
                "score": round(float(score), 4),
                "rank": idx + 1
            }
            for idx, (meeting_id, score) in enumerate(recommendations)
        ]

        return {
            "success": True,
            "user_id": user_id,
            "recommendations": rec_list,
            "total_count": len(rec_list),
            "model_info": {
                "rmse": None,
                "mae": None,
                "accuracy": None
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ 추천 실패: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"추천 실패: {str(e)}")

# ========================================
# 만족도 예측 (GET + POST 둘 다 지원)
# ========================================

@router.get("/satisfaction")
async def predict_satisfaction_get(userId: int, meetingId: int):
    """
    LightGBM 만족도 예측 (GET - Spring Boot 호환)
    GET /api/ai/recommendations/satisfaction?userId=121&meetingId=102

    ⚠️ Spring Boot Service가 필요한 데이터를 모두 조회해서 POST로 호출해야 함
    이 GET은 간단한 Mock 응답 반환
    """
    logger.warning(f"⚠️ GET /satisfaction 호출됨 (userId={userId}, meetingId={meetingId})")
    logger.warning("⚠️ Spring Boot Service에서 POST /satisfaction을 사용하세요")

    # Mock 응답 반환 (실제로는 POST 사용 권장)
    return {
        "success": False,
        "message": "만족도 예측 실패",
        "userId": userId,
        "meetingId": meetingId,
        "predictedRating": None,
        "ratingStars": None,
        "reasons": None,
        "recommended": None,
        "satisfactionLevel": None
    }


@router.post("/satisfaction")
async def predict_satisfaction_post(request: SatisfactionRequest):
    """
    LightGBM Regressor 기반 만족도 예측
    POST /api/ai/recommendations/satisfaction
    """
    try:
        logger.info(f"🔍 만족도 예측 요청: user_id={request.user_id}, meeting_id={request.meeting_id}")

        # ✅ Regressor 사용 (개인 성향 반영)
        if not model_loader.regressor or not model_loader.regressor.is_loaded():
            raise HTTPException(status_code=503, detail="LightGBM Regressor 모델이 로드되지 않았습니다")

        if not model_loader.feature_builder:
            raise HTTPException(status_code=503, detail="FeatureBuilder가 로드되지 않았습니다")

        # 사용자 정보 구성
        user = {
            "lat": request.user_lat,
            "lng": request.user_lng,
            "interests": request.user_interests,
            "time_preference": request.user_time_preference,
            "user_location_pref": request.user_location_pref,
            "budget_type": request.user_budget_type,
            "user_avg_rating": request.user_avg_rating,
            "user_meeting_count": request.user_meeting_count,
            "user_rating_std": request.user_rating_std,
        }

        # 모임 정보 구성
        meeting = {
            "lat": request.meeting_lat,
            "lng": request.meeting_lng,
            "category": request.meeting_category,
            "subcategory": request.meeting_subcategory,
            "time_slot": request.meeting_time_slot,
            "meeting_location_type": request.meeting_location_type,
            "vibe": request.meeting_vibe,
            "max_participants": request.meeting_max_participants,
            "expected_cost": request.meeting_expected_cost,
            "meeting_avg_rating": request.meeting_avg_rating or 0.0,
            "meeting_rating_count": request.meeting_rating_count,
            "meeting_participant_count": request.meeting_participant_count,
        }

        # 특징 추출
        feat, x = model_loader.feature_builder.build(user, meeting)

        # ✅ Regressor로 직접 평점 예측 (1~5)
        import numpy as np
        predicted_rating = model_loader.regressor.predict(x)[0]
        predicted_rating = float(np.clip(predicted_rating, 1.0, 5.0))
        predicted_rating = round(predicted_rating, 1)

        logger.info(f"✅ 만족도 예측 완료: {predicted_rating}/5.0")

        return {
            "success": True,
            "message": "만족도 예측 성공",
            "userId": request.user_id,
            "meetingId": request.meeting_id,
            "predictedRating": predicted_rating,
            "ratingStars": rating_to_stars(predicted_rating),
            "satisfactionLevel": get_satisfaction_level(predicted_rating),
            "recommended": predicted_rating >= 3.5,
            "reasons": build_reasons(feat)
        }

    except Exception as e:
        logger.error(f"❌ 만족도 예측 실패: {e}", exc_info=True)
        return {
            "success": False,
            "message": str(e),
            "userId": request.user_id,
            "meetingId": request.meeting_id,
            "predictedRating": None,
            "ratingStars": None,
            "satisfactionLevel": None,
            "recommended": False,
            "reasons": []
        }


# ========================================
# 감성 분석
# ========================================

@router.post("/sentiment")
async def analyze_sentiment(request: SentimentRequest):
    """
    KcELECTRA 감성 분석
    POST /api/ai/recommendations/sentiment
    """
    try:
        if not model_loader.kcelectra or not model_loader.kcelectra.is_loaded():
            raise HTTPException(status_code=503, detail="KcELECTRA 모델이 로드되지 않았습니다")

        result = model_loader.kcelectra.predict(request.text)
        return result

    except Exception as e:
        logger.error(f"감성 분석 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# 중간지점 계산
# ========================================

@router.post("/centroid")
async def calculate_centroid(request: CentroidRequest):
    """
    중간지점 계산
    POST /api/ai/recommendations/centroid
    """
    try:
        locations = request.user_locations

        if not locations:
            raise HTTPException(status_code=400, detail="위치 목록이 비어있습니다")

        avg_lat = sum(loc["latitude"] for loc in locations) / len(locations)
        avg_lng = sum(loc["longitude"] for loc in locations) / len(locations)

        return {
            "centroid": {
                "latitude": round(avg_lat, 6),
                "longitude": round(avg_lng, 6)
            },
            "address": None
        }

    except Exception as e:
        logger.error(f"중간지점 계산 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# 장소 추천
# ========================================

@router.post("/place")
async def recommend_place(request: PlaceRecommendRequest):
    """
    장소 추천 (Kakao Maps 연동 필요)
    POST /api/ai/recommendations/place
    """
    try:
        locations = [
            {"latitude": p["latitude"], "longitude": p["longitude"]}
            for p in request.participants
        ]

        avg_lat = sum(loc["latitude"] for loc in locations) / len(locations)
        avg_lng = sum(loc["longitude"] for loc in locations) / len(locations)

        centroid = {"latitude": round(avg_lat, 6), "longitude": round(avg_lng, 6)}

        return {
            "success": True,
            "centroid": centroid,
            "search_radius": request.max_distance * 1000,
            "recommendations": [],
            "filtered_count": {"total": 0, "within_radius": 0, "returned": 0},
            "processing_time_ms": 0
        }

    except Exception as e:
        logger.error(f"장소 추천 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ========================================
# AI 검색 (GPT)
# ========================================

@router.post("/search", response_model=AISearchResponse)
async def ai_search(
    request: AISearchRequest,
    ai_service: AIRecommendationService = Depends(get_ai_recommendation_service)
):
    """
    GPT 기반 AI 검색 및 추천
    POST /api/ai/recommendations/search
    """
    rid = str(uuid.uuid4())[:8]
    logger.info(f"[RID={rid}] 🔍 AI 검색 요청: user_id={request.user_id}, prompt='{request.user_prompt}'")

    print("🔥🔥🔥 /search 엔드포인트 호출됨!")
    logger.info(f"🔥🔥🔥 /search 엔드포인트 호출!")
    logger.info(f"[RID={rid}] 🔍 AI 검색 요청: user_id={request.user_id}, prompt='{request.user_prompt}'")

    try:
        # ✅ 여기도 추가
        print(f"🔥🔥🔥 ai_service.get_ai_recommendations 호출 직전!")
        logger.info(f"🔥🔥🔥 ai_service.get_ai_recommendations 호출 직전!")

        result = await ai_service.get_ai_recommendations(
            user_prompt=request.user_prompt,
            user_id=request.user_id,
            top_n=request.top_n
        )


        logger.info(f"✅ AI 검색 완료: {len(result['recommendations'])}개 추천")
        # ✅ 완료 후에도
        print(f"🔥🔥🔥 결과 받음: {len(result.get('recommendations', []))}개")
        logger.info(f"✅ AI 검색 완료: {len(result['recommendations'])}개 추천")

        return result

    except Exception as e:
        logger.error(f"❌ AI 검색 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/parse-prompt")
async def parse_prompt(
    prompt: str,
    gpt_service: GPTPromptService = Depends(get_gpt_service)
):
    """
    GPT 프롬프트 파싱 테스트
    GET /api/ai/recommendations/parse-prompt?prompt=오늘 저녁 강남에서 러닝
    """
    try:
        parsed = await gpt_service.parse_search_query(prompt)
        return {
            "prompt": prompt,
            "parsed": parsed
        }
    except Exception as e:
        logger.error(f"❌ 프롬프트 파싱 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))


# ai_routes.py에 추가할 코드

# ========================================
# AI 매칭률 계산 (SVD 기반)
# ========================================
@router.post("/match-scores")
async def get_match_scores(req: MatchScoresRequest):
    user_id = req.user_id
    meeting_ids = [int(x) for x in req.meeting_ids if x is not None]

    if not meeting_ids:
        return {"success": True, "userId": user_id, "items": []}

    if not model_loader.svd or not model_loader.svd.is_loaded():
        return {
            "success": True,
            "userId": user_id,
            "items": [{"meetingId": mid, "predictedRating": 3.7, "matchPercentage": 75, "matchLevel": "MEDIUM"} for mid
                      in meeting_ids]
        }

    # 1) SVD 예측
    preds = await model_loader.svd.predict_for_user_meetings(user_id, meeting_ids)
    print(f"🔍 SVD 예측값: {preds}")

    # 2) 실제 DB에서 데이터 가져오기
    user_info = await get_user_info_from_db(user_id)
    meetings_info = await get_meetings_info_from_db(meeting_ids)

    if not meetings_info:
        print("⚠️ 모임 정보를 가져올 수 없음")
        return {"success": True, "userId": user_id, "items": []}

    # 3) 매칭률 계산
    items = []

    for mid, rating in preds.items():
        rating = float(rating)
        meeting = meetings_info.get(mid)

        if not meeting:
            print(f"⚠️ 모임 {mid} 정보 없음")
            continue

        # FeatureBuilder로 특징 계산
        try:
            features, _ = feature_builder.build_vector(user_info, meeting)
        except Exception as e:
            print(f"❌ Feature 계산 실패 (meeting {mid}): {e}")
            features = {}

        # 기본 점수
        base_score = rating_to_match_score_sigmoid(rating, mid=3.55, temp=0.45)

        # 보너스 계산
        bonus = 0

        # 거리
        distance_km = features.get("distance_km", 10.0)
        if distance_km <= 1:
            bonus += 15
        elif distance_km <= 3:
            bonus += 10
        elif distance_km <= 5:
            bonus += 5
        elif distance_km <= 10:
            bonus += 0
        elif distance_km <= 20:
            bonus -= 10
        else:
            bonus -= 20

        # 관심사
        interest_match = features.get("interest_match_score", 0.0)
        bonus += int(interest_match * 20)

        # 비용
        cost_match = features.get("cost_match_score", 0.5)
        bonus += int((cost_match - 0.5) * 20)

        # 시간대
        if features.get("time_match", 0.0) > 0.5:
            bonus += 5

        # 실내/실외
        if features.get("location_type_match", 0.0) > 0.5:
            bonus += 5

        print(f"🎯 모임 {mid}: base={base_score}, bonus={bonus}, distance={distance_km:.2f}km")

        # 최종 점수
        final_score = base_score + bonus
        final_score = max(30, min(95, int(final_score)))

        if final_score >= 85:
            level = "HIGH"
        elif final_score >= 65:
            level = "MEDIUM"
        else:
            level = "LOW"

        items.append({
            "meetingId": mid,
            "predictedRating": round(rating, 3),
            "matchPercentage": final_score,
            "matchLevel": level,
        })

    items.sort(key=lambda x: x["matchPercentage"], reverse=True)

    print(f"📊 최종 결과: {items}")

    return {"success": True, "userId": user_id, "items": items}

# ===== 헬퍼 함수 =====
async def get_user_info(user_id: int) -> dict:
    """DB에서 사용자 정보 가져오기 (FeatureBuilder 형식)"""
    # SELECT users.*, user_preferences.* FROM users
    # LEFT JOIN user_preferences ON users.id = user_preferences.user_id
    # WHERE users.id = ?

    # 예시 (실제로는 DB 쿼리):
    return {
        "lat": 37.5665,
        "lng": 126.9780,
        "time_preference": "EVENING",
        "user_location_pref": "INDOOR",
        "interests": "맛집, 카페, 문화예술",
        "budget_type": "value",
        "user_avg_rating": 4.2,
        "user_meeting_count": 15,
        "user_rating_std": 0.8,
    }


async def get_meetings_info(meeting_ids: list) -> dict:
    """DB에서 모임 정보 배치 조회 (FeatureBuilder 형식)"""
    # SELECT id, category, vibe, lat, lng, time_slot,
    #        meeting_location_type, expected_cost, max_participants,
    #        meeting_avg_rating, meeting_rating_count, meeting_participant_count
    # FROM meetings WHERE id IN (...)

    # 예시:
    return {
        123: {
            "category": "맛집",
            "vibe": "여유로운",
            "lat": 37.5700,
            "lng": 126.9800,
            "time_slot": "EVENING",
            "meeting_location_type": "INDOOR",
            "expected_cost": 25000,
            "max_participants": 10,
            "meeting_avg_rating": 4.5,
            "meeting_rating_count": 8,
            "meeting_participant_count": 6,
        },
        124: {
            "category": "스포츠",
            "vibe": "활기찬",
            "lat": 37.6000,
            "lng": 127.0500,
            "time_slot": "AFTERNOON",
            "meeting_location_type": "OUTDOOR",
            "expected_cost": 15000,
            "max_participants": 20,
            "meeting_avg_rating": 4.0,
            "meeting_rating_count": 3,
            "meeting_participant_count": 12,
        }
    }


async def get_user_info_from_db(user_id: int) -> dict:
    """Spring Boot에서 사용자 정보 가져오기"""
    try:
        resp = requests.get(
            f"http://localhost:8080/api/users/{user_id}/preferences2",
            timeout=5
        )

        if resp.status_code != 200:
            print(f"❌ HTTP {resp.status_code}: {resp.text}")
            return {}

        data = resp.json()

        return {
            "lat": data.get("latitude", 37.5665),
            "lng": data.get("longitude", 126.9780),
            "time_preference": data.get("timePreference"),
            "user_location_pref": data.get("locationType"),
            "interests": data.get("interests", ""),
            "budget_type": data.get("budgetType", "value"),
            "user_avg_rating": data.get("avgRating", 3.0),
            "user_meeting_count": data.get("meetingCount", 0),
            "user_rating_std": data.get("ratingStd", 0.5),
        }
    except Exception as e:
        print(f"❌ 사용자 정보 조회 실패: {e}")
        return {
            "lat": 37.5665,
            "lng": 126.9780,
            "time_preference": "EVENING",
            "user_location_pref": "INDOOR",
            "interests": "",
            "budget_type": "value",
            "user_avg_rating": 3.0,
            "user_meeting_count": 0,
            "user_rating_std": 0.5,
        }

async def get_meetings_info_from_db(meeting_ids: list) -> dict:
    """Spring Boot에서 모임 정보 배치 조회"""
    try:
        resp = requests.post(
            "http://localhost:8080/api/meetings/batch",
            json={"meetingIds": meeting_ids},
            timeout=10
        )

        if resp.status_code != 200:
            print(f"❌ HTTP {resp.status_code}: {resp.text}")
            return {}

        data = resp.json()

        result = {}

        # 응답 형식: {"meetings": [...], "totalCount": N}
        meetings_list = data.get("meetings", [])

        for m in meetings_list:
            # ✅ 'id' → 'meeting_id'
            meeting_id = m.get("meeting_id")

            if not meeting_id:
                print(f"⚠️ meeting_id 없음: {m.keys()}")
                continue

            result[meeting_id] = {
                "category": m.get("category"),
                "vibe": m.get("vibe"),
                "lat": m.get("latitude"),
                "lng": m.get("longitude"),
                "time_slot": m.get("time_slot"),
                "meeting_location_type": m.get("location_type"),
                "expected_cost": m.get("expected_cost", 0),
                "max_participants": m.get("max_participants", 10),
                "meeting_avg_rating": m.get("avg_rating", 3.0),
                "meeting_rating_count": m.get("rating_count", 0),
                "meeting_participant_count": m.get("current_participants", 0),
            }

        print(f"✅ 파싱 완료: {len(result)}개 모임")
        return result

    except Exception as e:
        print(f"❌ 모임 정보 조회 실패: {e}")
        import traceback
        traceback.print_exc()
        return {}

def calculate_percentile(score: int, all_scores: list) -> int:
    """현재 점수가 전체 중 상위 몇%인지"""
    if not all_scores or len(all_scores) < 2:
        return 50

    sorted_scores = sorted(all_scores)
    rank = sorted_scores.index(score) if score in sorted_scores else 0
    percentile = int((rank / len(sorted_scores)) * 100)

    return 100 - percentile  # 상위 %로 변환


    sorted_vals = sorted(values)

    def percentile_midrank(x: float) -> float:
        lt = 0
        eq = 0
        for v in sorted_vals:
            if v < x:
                lt += 1
            elif v == x:
                eq += 1
        p = (lt + 0.5 * eq) / n
        eps = 0.5 / n
        if p < eps: p = eps
        if p > 1 - eps: p = 1 - eps
        return p

    items = []
    for mid, r in preds.items():
        r = float(r)
        p = percentile_midrank(r)

        # stretch 약하게 (2.2 -> 1.5 정도)
        p = max(0.0, min(1.0, 0.5 + (p - 0.5) * 1.5))

        # gamma도 완만하게 (3.0 -> 1.4)
        match_pct = match_from_percentile(p, floor=floor, ceil=ceil, gamma=1.4)

        if match_pct >= 88:
            lvl = "VERY_HIGH"
        elif match_pct >= 80:
            lvl = "HIGH"
        elif match_pct >= 65:
            lvl = "MEDIUM"
        else:
            lvl = "LOW"

        items.append({
            "meetingId": mid,
            "predictedRating": round(r, 3),
            "percentile": round(p, 3),
            "matchPercentage": int(match_pct),
            "matchLevel": lvl,
        })

    # 높은 순으로 정렬(프론트에서 그대로 쓰기 좋게)
    items.sort(key=lambda x: x["matchPercentage"], reverse=True)
    return {"success": True, "userId": user_id, "items": items}

