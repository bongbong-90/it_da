"""
Feature Builder for LightGBM Model
사용자와 모임 정보를 받아서 특징 벡터 생성
"""

import numpy as np
import math
from typing import Dict, Tuple, List


class FeatureBuilder:
    """LightGBM 모델을 위한 특징 추출기"""

    def __init__(self):
        # 카테고리 매핑 (7개)
        self.categories = [
            "스포츠", "맛집", "카페", "문화예술", "스터디", "취미활동", "소셜"
        ]

        # Vibe 매핑 (업데이트)
        self.vibes = [
            "활기찬", "여유로운", "진지한", "즐거운", "감성적인",
            "에너지 넘치는", "힐링", "창의적인"
        ]

        self.time_slots = ["morning", "afternoon", "evening", "night"]
        self.location_types = ["indoor", "outdoor"]

    def haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Haversine 공식으로 거리 계산 (km)"""
        R = 6371
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        a = (math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) *
             math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def calculate_interest_match(self, user_interests: str, meeting_category: str) -> float:
        """사용자 관심사와 모임 카테고리 매칭 점수"""
        if not user_interests:
            return 0.0
        user_keywords = set(user_interests.lower().split(", "))
        meeting_keywords = set(meeting_category.lower().split())
        if len(user_keywords) == 0:
            return 0.0
        match_count = len(user_keywords & meeting_keywords)
        return match_count / len(user_keywords)

    def calculate_cost_match(self, user_budget_type: str, meeting_cost: int) -> float:
        """예산 성향 매칭 점수"""
        cost_ranges = {
            "low": (0, 10000), "value": (10000, 30000), "medium": (30000, 50000),
            "high": (50000, 100000), "premium": (100000, float('inf'))
        }
        if user_budget_type not in cost_ranges:
            return 0.5
        min_cost, max_cost = cost_ranges[user_budget_type]
        if min_cost <= meeting_cost <= max_cost:
            return 1.0
        elif meeting_cost < min_cost:
            diff = min_cost - meeting_cost
            return max(0.0, 1.0 - diff / min_cost)
        else:
            diff = meeting_cost - max_cost
            return max(0.0, 1.0 - diff / max_cost)

    def one_hot_encode(self, value: str, categories: List[str]) -> List[int]:
        """원핫 인코딩"""
        return [1 if value == cat else 0 for cat in categories]

    def build(self, user: Dict, meeting: Dict) -> Tuple[Dict, np.ndarray]:
        """특징 벡터 생성"""
        distance_km = self.haversine_distance(
            user.get("lat", 37.5), user.get("lng", 127.0),
            meeting.get("lat", 37.5), meeting.get("lng", 127.0)
        )
        time_match = 1.0 if user.get("time_preference") == meeting.get("time_slot") else 0.0
        location_type_match = 1.0 if user.get("user_location_pref") == meeting.get("meeting_location_type") else 0.0
        interest_match_score = self.calculate_interest_match(user.get("interests", ""), meeting.get("category", ""))
        cost_match_score = self.calculate_cost_match(user.get("budget_type", "value"), meeting.get("expected_cost", 20000))

        user_avg_rating = user.get("user_avg_rating", 3.0)
        user_meeting_count = user.get("user_meeting_count", 0)
        user_rating_std = user.get("user_rating_std", 0.5)
        meeting_avg_rating = meeting.get("meeting_avg_rating", 3.0)
        meeting_rating_count = meeting.get("meeting_rating_count", 0)
        meeting_participant_count = meeting.get("meeting_participant_count", 0)
        meeting_max_participants = meeting.get("max_participants", 10)

        category_onehot = self.one_hot_encode(meeting.get("category", ""), self.categories)
        vibe_onehot = self.one_hot_encode(meeting.get("vibe", ""), self.vibes)

        features = {
            "distance_km": distance_km, "time_match": time_match, "location_type_match": location_type_match,
            "interest_match_score": interest_match_score, "cost_match_score": cost_match_score,
            "user_avg_rating": user_avg_rating, "user_meeting_count": user_meeting_count, "user_rating_std": user_rating_std,
            "meeting_avg_rating": meeting_avg_rating, "meeting_rating_count": meeting_rating_count,
            "meeting_participant_count": meeting_participant_count, "meeting_max_participants": meeting_max_participants,
        }

        feature_vector = [
            distance_km, time_match, location_type_match, interest_match_score, cost_match_score,
            user_avg_rating, user_meeting_count, user_rating_std,
            meeting_avg_rating, meeting_rating_count, meeting_participant_count, meeting_max_participants,
            *category_onehot, *vibe_onehot,
        ]

        return features, np.array([feature_vector])

    def get_feature_names(self) -> List[str]:
        """특징 이름 리스트"""
        base_features = [
            "distance_km", "time_match", "location_type_match", "interest_match_score", "cost_match_score",
            "user_avg_rating", "user_meeting_count", "user_rating_std",
            "meeting_avg_rating", "meeting_rating_count", "meeting_participant_count", "meeting_max_participants",
        ]
        category_features = [f"category_{cat}" for cat in self.categories]
        vibe_features = [f"vibe_{vibe}" for vibe in self.vibes]
        return base_features + category_features + vibe_features