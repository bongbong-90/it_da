# app/services/place_recommendation_service.py
"""
장소 추천 통합 서비스
"""

import re
from typing import List, Dict
from app.schemas.place import (
    PlaceRecommendRequest,
    PlaceRecommendResponse,
    PlaceRecommendation,
    Centroid
)
from app.services.geolocation_service import GeolocationService
from app.services.kakao_map_service import KakaoMapService
from app.services.meeting_analyzer_service import MeetingAnalyzerService
from app.core.logging import logger
import time


class PlaceRecommendationService:
    """장소 추천 서비스"""

    def __init__(self):
        self.geo_service = GeolocationService()
        self.kakao_service = KakaoMapService()
        self.analyzer_service = MeetingAnalyzerService()

    async def recommend_places(
            self,
            participants: List[Dict],
            meeting_title: str,
            meeting_description: str = "",
            category: str = "",
            subcategory: str = "",
            max_distance: float = 3.0,
            top_n: int = 3
    ) -> PlaceRecommendResponse:
        """
        참가자 위치와 모임 정보를 기반으로 장소 추천

        Args:
            participants: 참가자 위치 리스트 [{"user_id": 1, "latitude": 37.5, "longitude": 127.0}, ...]
            meeting_title: 모임 제목
            meeting_description: 모임 설명
            category: 모임 카테고리
            max_distance: 최대 검색 거리 (km)
            top_n: 추천 개수

        Returns:
            PlaceRecommendResponse
        """
        start_time = time.time()

        try:
            # 1. 중간 지점 계산
            centroid = await self.geo_service.calculate_centroid(participants)
            centroid_lat, centroid_lng = centroid
            logger.info(f"중간 지점: ({centroid_lat}, {centroid_lng})")

            # 2. 모임 성격 분석 → 검색 키워드 추출
            keywords = await self.analyzer_service.extract_place_keywords(
                meeting_title,
                meeting_description,
                category,
                subcategory
            )
            logger.info(f"추출된 키워드: {keywords}")

            # 3. 각 키워드로 카카오맵 검색
            all_places = []
            for keyword in keywords:
                places = await self.kakao_service.search_places_by_keyword(
                    keyword=keyword,
                    latitude=centroid_lat,
                    longitude=centroid_lng,
                    radius=int(max_distance * 1000),  # km → m
                    size=15
                )
                all_places.extend(places)

            # 4. 중복 제거 (place_id 기준)
            unique_places = list({p["id"]: p for p in all_places}.values())

            # ✅ 추가: 카테고리/서브카테고리 + 제목 기반 필터+랭킹
            ranked_places = self._filter_and_rank_places(
                unique_places,
                category,
                subcategory,
                keywords,
                meeting_title  # ✅ 제목 전달
            )

            # ✅ 5. 상위 N개 선택 (다시 거리로 sort 하지 말 것!)
            sorted_places = ranked_places[:top_n]

            # recommend_places에서 ranked_places 만든 직후:
            for p in ranked_places[:15]:
                logger.info(f"[RANK] {p.get('place_name')} | {p.get('category_name')} | dist={p.get('distance')}m")

            # 6. 응답 데이터 변환
            recommendations = [
                PlaceRecommendation(
                    place_id=p["id"],
                    name=p["place_name"],
                    category=p.get("category_name", "기타"),
                    address=p.get("address_name", ""),
                    latitude=float(p["y"]),
                    longitude=float(p["x"]),
                    distance_from_centroid=int(p.get("distance", 0)) / 1000,  # m → km
                    phone=p.get("phone"),
                    url=p.get("place_url")
                )
                for p in sorted_places
            ]

            processing_time = int((time.time() - start_time) * 1000)

            return PlaceRecommendResponse(
                success=True,
                centroid=Centroid(latitude=centroid_lat, longitude=centroid_lng),
                search_radius=max_distance * 1000,
                recommendations=recommendations,
                filtered_count={
                    "total": len(all_places),
                    "unique": len(unique_places),
                    "returned": len(recommendations)
                },
                processing_time_ms=processing_time
            )
        except Exception as e:
            logger.error(f"장소 추천 실패: {e}")
            raise

    def _normalize(self, s: str) -> str:
        return re.sub(r"\s+", "", (s or "").lower())

    def _filter_and_rank_places(
            self,
            places: List[Dict],
            category: str,
            subcategory: str,
            keywords: List[str],
            meeting_title: str = "",  # ✅ 추가
    ) -> List[Dict]:
        """
        카카오 검색 결과를 모임 카테고리/서브카테고리에 맞게
        1) 강제 필터(화이트리스트/블랙리스트)
        2) 점수화 (제목 정합성 추가)
        3) 점수 우선 + 거리 보조로 재정렬
        """

        sub = (subcategory or "").strip()
        cat = (category or "").strip()
        title_lower = (meeting_title or "").lower()  # ✅ 제목 소문자화

        # ---------- helpers ----------
        def n(s: str) -> str:
            return self._normalize(s)

        def text_blob(p: Dict) -> str:
            name = n(p.get("place_name", ""))
            cat_name = n(p.get("category_name", ""))
            addr = n(p.get("address_name", ""))
            return f"{name} {cat_name} {addr}"

        def dist_m(p: Dict) -> int:
            try:
                return int(p.get("distance", 999999) or 999999)
            except Exception:
                return 999999

        def is_food_cafe(p: Dict) -> bool:
            # "음식점 > 카페" 같은 것만 컷 (방탈출카페는 살림)
            c = p.get("category_name", "") or ""
            return ("음식점" in c and "카페" in c)

        def is_escape(p: Dict) -> bool:
            t = (p.get("place_name", "") or "") + " " + (p.get("category_name", "") or "")
            return "방탈출" in t or "이스케이프" in t

        def is_board(p: Dict) -> bool:
            t = (p.get("place_name", "") or "") + " " + (p.get("category_name", "") or "")
            return ("보드" in t and "카페" in t) or ("보드카페" in t) or ("보드카페" in (p.get("category_name", "") or ""))

        def is_bowling(p: Dict) -> bool:
            t = (p.get("place_name", "") or "") + " " + (p.get("category_name", "") or "")
            return "볼링" in t

        def is_billiard(p: Dict) -> bool:
            t = (p.get("place_name", "") or "") + " " + (p.get("category_name", "") or "")
            return ("당구" in t) or ("billiard" in t.lower()) or ("pool" in t.lower())

        # ---------- strong/ban tables ----------
        SUB_WHITELIST_FN = {
            "방탈출": is_escape,
            "보드게임": is_board,
            "볼링": is_bowling,
            "당구": is_billiard,
        }

        # "방탈출"에 카페 단어 금지 넣지 말 것(방탈출카페가 같이 죽음)
        SUB_HARD_BAN_FN = {
            "방탈출": is_food_cafe,  # 음식점>카페만 강제 제외
        }

        # 키워드(보조) - 약한 가산
        kw_norms = [n(k) for k in (keywords or []) if (k or "").strip()]

        # ---------- 1) 강제 필터 먼저 ----------
        # (A) 서브카테고리 화이트리스트가 있으면 가능한 한 그쪽만 남김
        wl_fn = SUB_WHITELIST_FN.get(sub)
        if wl_fn:
            wl = [p for p in places if wl_fn(p)]
            # 결과가 너무 적으면 완전 컷하지 말고 원본 유지 (fallback)
            if len(wl) >= 3:
                places = wl

        # (B) 하드 블랙리스트 적용 (방탈출이면 음식점카페 제거)
        ban_fn = SUB_HARD_BAN_FN.get(sub)
        if ban_fn:
            places2 = [p for p in places if not ban_fn(p)]
            if len(places2) >= 3:
                places = places2

        # ---------- 2) score ----------
        def score_place(p: Dict) -> float:
            t = text_blob(p)
            d = dist_m(p)

            score = 0.0

            # ✅ (0) 제목과 장소명 정합성 체크 (최우선)
            place_name_lower = (p.get("place_name", "") or "").lower()

            # 제목에 "방탈출"이 있으면 방탈출 장소에 큰 가산점
            if "방탈출" in title_lower:
                if is_escape(p):
                    score += 30.0  # 방탈출 강력 우선
                elif is_board(p):
                    score += 5.0  # 보드게임은 낮은 점수

            # 제목에 "보드게임"이 있으면 보드게임 우선
            elif "보드" in title_lower or "보드게임" in title_lower:
                if is_board(p):
                    score += 25.0
                elif is_escape(p):
                    score += 10.0

            # ✅ (0.5) 첫 번째 키워드와 매칭 시 추가 가산점
            if keywords and len(keywords) > 0:
                first_kw = self._normalize(keywords[0])
                if first_kw in t:
                    score += 15.0  # 첫 키워드 매칭 시 높은 점수

            # (1) 서브카테고리 정합성 가산
            if sub == "방탈출":
                if is_escape(p): score += 20.0
                if is_food_cafe(p): score -= 999.0
            elif sub == "보드게임":
                if is_board(p): score += 18.0
                if is_escape(p): score -= 5.0  # 방탈출은 약간 감점
            elif sub == "볼링":
                if is_bowling(p): score += 18.0
            elif sub == "당구":
                if is_billiard(p): score += 18.0

            # (2) 키워드 포함 보조 가산
            for nk in kw_norms:
                if nk and nk in t:
                    score += 2.0

            # (3) 거리 보조
            if d <= 300:
                score += 2.0
            elif d <= 800:
                score += 1.0

            return score

        scored = [(p, score_place(p)) for p in places]
        scored.sort(key=lambda x: x[1], reverse=True)

        # ---------- 3) threshold 컷(너무 잡다한거 제거) ----------
        # sub가 있으면 최소 점수 컷, 다 날아가면 fallback
        if wl_fn:
            filtered = [p for (p, s) in scored if s >= 2.0]
            if len(filtered) >= 3:
                places = filtered
            else:
                places = [p for (p, s) in scored]

        # ---------- 4) 최종 정렬: score desc, distance asc ----------
        places_sorted = sorted(
            places,
            key=lambda p: (-score_place(p), dist_m(p))
        )

        return places_sorted
