"""
Recommendation Schemas
"""

from pydantic import BaseModel, Field
from typing import List, Optional, Dict


class MeetingRecommendation(BaseModel):
    """모임 추천"""
    meeting_id: int
    predicted_score: float
    rank: int


class RecommendRequest(BaseModel):
    """추천 요청"""
    user_id: int
    top_n: int = Field(default=10, ge=1, le=50)
    filter_category: Optional[str] = None


class RecommendResponse(BaseModel):
    """추천 응답"""
    success: bool
    user_id: int
    recommendations: List[MeetingRecommendation]
    total_count: int


class SatisfactionPredictionRequest(BaseModel):
    """만족도 예측 요청"""
    user_id: int
    meeting_id: int


class SatisfactionReason(BaseModel):
    """만족도 이유"""
    icon: str
    text: str


class SatisfactionPredictionResponse(BaseModel):
    """만족도 예측 응답"""
    success: bool
    raw_score: float
    predicted_rating: float
    reasons: List[SatisfactionReason]


class SentimentAnalysisRequest(BaseModel):
    """감성 분석 요청"""
    text: str = Field(..., min_length=1, max_length=1000)


class SentimentAnalysisResponse(BaseModel):
    """감성 분석 응답"""
    text: str
    sentiment: str  # POSITIVE/NEUTRAL/NEGATIVE
    score: float
    probabilities: Dict[str, float]