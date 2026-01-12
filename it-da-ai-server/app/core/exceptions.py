# app/core/exceptions.py
class AIServerException(Exception):
    """Base exception"""
    pass

class ModelNotLoadedException(AIServerException):
    """모델이 로드되지 않음"""
    pass

class KakaoAPIException(AIServerException):
    """카카오 API 오류"""
    pass

class RecommendationException(AIServerException):
    """추천 실패"""
    pass