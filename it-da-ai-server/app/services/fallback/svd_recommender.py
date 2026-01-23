"""
SVD Recommender
협업 필터링 기반 fallback 추천
"""

import httpx
from typing import List, Dict
from app.core.logging import logger


class SVDRecommender:
    """SVD 협업 필터링 기반 추천"""

    def __init__(self, model_loader, spring_boot_url: str):
        """
        Args:
            model_loader: ModelLoader 인스턴스
            spring_boot_url: Spring Boot API URL
        """
        self.model_loader = model_loader
        self.spring_boot_url = spring_boot_url

    async def recommend(
            self,
            user_id: int,
            user_prompt: str,
            parsed_query: Dict,
            top_n: int,
            user_context: Dict,
    ) -> Dict:
        """
        SVD 기반 추천

        Args:
            user_id: 유저 ID
            user_prompt: 원본 프롬프트
            parsed_query: 파싱된 쿼리
            top_n: 추천 개수
            user_context: 유저 컨텍스트

        Returns:
            추천 결과
        """
        if not self.model_loader.svd or not self.model_loader.svd.is_loaded():
            raise RuntimeError("SVD 모델 로드되지 않음")

        logger.info(f"[SVD] user_id={user_id}, top_n={top_n}")

        # SVD 추천
        svd_recommendations = await self.model_loader.svd.recommend(
            user_id=user_id,
            top_n=top_n * 2
        )

        meeting_ids = [int(mid) for mid, _ in svd_recommendations]
        meetings = await self._get_meetings_by_ids(meeting_ids)

        # 거리 계산 주입
        meetings = self._inject_distance_km(meetings, user_context)

        # 점수 변환
        scored = []
        for meeting in meetings:
            m_id = meeting.get("meeting_id") or meeting.get("meetingId")
            svd_score = next(
                (score for mid, score in svd_recommendations if int(mid) == int(m_id)),
                3.5
            )

            scored.append({
                **meeting,
                "match_score": min(100, int(float(svd_score) * 20)),
                "predicted_rating": round(float(svd_score), 1),
                "svd_score": round(float(svd_score), 2),
                "key_points": ["SVD 협업 필터링 기반 추천"],
                "reasoning": "과거 참여 이력을 바탕으로 추천된 모임입니다."
            })

        return {
            "user_prompt": user_prompt,
            "parsed_query": parsed_query,
            "total_candidates": len(scored),
            "recommendations": scored[:top_n],
            "fallback": True
        }

    async def _get_meetings_by_ids(self, meeting_ids: List[int]) -> List[Dict]:
        """모임 정보 배치 조회"""
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.spring_boot_url}/api/meetings/batch",
                    json={"meetingIds": meeting_ids}
                )
            if response.status_code == 200:
                return response.json().get("meetings", [])
            return []
        except Exception as e:
            logger.error(f"⚠️ 모임 정보 조회 실패: {e}")
            return []

    def _inject_distance_km(self, meetings: List[Dict], user_ctx: Dict) -> List[Dict]:
        """거리 계산 주입"""
        u_lat = user_ctx.get("latitude") or user_ctx.get("lat")
        u_lng = user_ctx.get("longitude") or user_ctx.get("lng")

        if u_lat is None or u_lng is None:
            return meetings

        out = []
        for m in meetings or []:
            # 이미 거리가 있으면 유지
            if m.get("distance_km") is not None or m.get("distanceKm") is not None:
                out.append(m)
                continue

            m_lat = m.get("latitude") or m.get("lat")
            m_lng = m.get("longitude") or m.get("lng")

            if m_lat is None or m_lng is None:
                out.append(m)
                continue

            try:
                d = self._haversine_km(float(u_lat), float(u_lng), float(m_lat), float(m_lng))
                mm = dict(m)
                mm["distance_km"] = round(float(d), 3)
                out.append(mm)
            except Exception:
                out.append(m)

        return out

    def _haversine_km(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """두 좌표 간 거리(km)"""
        import math

        R = 6371.0
        p1, p2 = math.radians(lat1), math.radians(lat2)
        d1 = math.radians(lat2 - lat1)
        d2 = math.radians(lon2 - lon1)
        a = (math.sin(d1 / 2) ** 2) + math.cos(p1) * math.cos(p2) * (math.sin(d2 / 2) ** 2)
        return 2 * R * math.asin(math.sqrt(a))