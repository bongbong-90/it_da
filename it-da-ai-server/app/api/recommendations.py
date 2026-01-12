# app/api/recommendations.py
from fastapi import APIRouter, HTTPException
from app.schemas.place import PlaceRecommendRequest, PlaceRecommendResponse
from app.services.geolocation_service import GeolocationService
from app.core.logging import logger

router = APIRouter(prefix="/api/ai", tags=["AI Recommendations"])


@router.post("/recommend-place", response_model=PlaceRecommendResponse)
async def recommend_place(request: PlaceRecommendRequest):
    """
    장소 추천 API
    """
    try:
        # 간단한 구현 (나중에 확장)
        geo_service = GeolocationService()
        centroid = await geo_service.calculate_centroid(request.participants)

        return PlaceRecommendResponse(
            success=True,
            centroid=centroid,
            search_radius=3000,
            recommendations=[],
            filtered_count={},
            processing_time_ms=100
        )

    except Exception as e:
        logger.error(f"장소 추천 실패: {e}")
        raise HTTPException(status_code=500, detail=str(e))