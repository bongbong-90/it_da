"""
Intent Adjuster
Intent 기반 점수 보정
"""

from typing import Optional
from app.core.logging import logger


class IntentAdjuster:
    """Intent 기반 점수 보정"""

    def __init__(self, normalizer):
        """
        Args:
            normalizer: QueryNormalizer 인스턴스
        """
        self.normalizer = normalizer

    def adjust(
            self,
            intent: str,
            meeting: dict,
            parsed_query: Optional[dict] = None
    ) -> float:
        """
        Intent 기반 점수 보정

        Args:
            intent: 감지된 의도
            meeting: 모임 정보
            parsed_query: 파싱된 쿼리 (location_type 체크용)

        Returns:
            보정 점수 (양수/음수)
        """
        cat = meeting.get("category") or ""
        sub = meeting.get("subcategory") or ""

        adjustment = 0.0

        # NEUTRAL은 가산/감산 없이 0
        if not intent or intent == "NEUTRAL":
            # location_type 약한 반영
            if parsed_query:
                requested_type = parsed_query.get("location_type")
                meeting_type = meeting.get("meeting_location_type") or meeting.get("location_type")
                if requested_type and meeting_type:
                    if requested_type.upper() == meeting_type.upper():
                        adjustment += 3.0
                    else:
                        adjustment -= 3.0

            return adjustment

        # ACTIVE intent
        if intent == "ACTIVE":
            if cat == "스포츠":
                if sub == "축구":
                    adjustment += 18.0
                elif sub in ["러닝", "클라이밍", "배드민턴"]:
                    adjustment += 10.0
                else:
                    adjustment += 8.0
            else:
                adjustment -= 6.0

            # 카페/문화예술 패널티
            if cat in ["카페", "문화예술"]:
                adjustment -= 6.0

            # 소셜도 약간 패널티
            if cat == "소셜":
                if sub in ["볼링", "당구", "탁구"]:
                    adjustment += 3.0
                else:
                    adjustment -= 6.0

        # HANDS_ON intent
        if intent == "HANDS_ON":
            if cat == "취미활동":
                adjustment += 12.0
            if cat == "문화예술":
                adjustment += 6.0
            if cat == "소셜" and sub in ["당구", "볼링", "기타", "노래방", "보드게임"]:
                adjustment -= 18.0

        # BRAIN intent
        if intent == "BRAIN":
            # 보드게임/방탈출 최우선
            if cat == "소셜" and sub in ["보드게임", "방탈출"]:
                adjustment += 22.0
            # 당구/볼링/와인바 하향
            if cat == "소셜" and sub in ["당구", "볼링", "와인바", "노래방"]:
                adjustment -= 18.0
            # 카페/문화예술은 중립
            if cat in ["카페", "문화예술"]:
                adjustment += 0.0

        # QUIET intent
        if intent == "QUIET":
            if cat == "스포츠":
                adjustment -= 30.0
            elif cat == "카페":
                adjustment += 15.0
            elif cat == "문화예술":
                adjustment += 12.0

        # 공놀이 키워드 특별 처리
        if parsed_query:
            keywords = parsed_query.get("keywords") or []
            if "공놀이" in keywords:
                if cat == "스포츠" and sub == "러닝":
                    adjustment -= 20.0
                if cat == "스포츠" and sub in ["축구", "배드민턴"]:
                    adjustment += 10.0

        # location_type 보정
        if parsed_query:
            requested_type = parsed_query.get("location_type")
            meeting_type = meeting.get("meeting_location_type") or meeting.get("location_type")

            if requested_type and meeting_type:
                if requested_type.upper() == meeting_type.upper():
                    adjustment += 6.0
                else:
                    adjustment -= 10.0

        return adjustment