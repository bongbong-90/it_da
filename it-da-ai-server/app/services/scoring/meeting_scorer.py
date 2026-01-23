"""
Meeting Scorer
LightGBM 기반 점수 계산 + 보정
"""

import math
from typing import List, Dict, Optional
import numpy as np

from app.core.logging import logger
from app.core.scoring_utils import match_from_percentile
from app.core.keyword_utils import clean_keywords


class MeetingScorer:
    """AI 점수 계산 + 보정"""

    def __init__(self, model_loader, normalizer, intent_adjuster):
        """
        Args:
            model_loader: ModelLoader 인스턴스
            normalizer: QueryNormalizer 인스턴스
            intent_adjuster: IntentAdjuster 인스턴스
        """
        self.model_loader = model_loader
        self.normalizer = normalizer
        self.intent_adjuster = intent_adjuster

    async def score_meetings(
            self,
            user_id: int,
            user_context: dict,
            candidate_meetings: List[dict],
            parsed_query: dict,
            intent: str,
            user_prompt: str = "",
            query_terms: Optional[List[str]] = None
    ) -> List[dict]:
        """
        AI 점수 계산 - LightGBM + 보정

        Args:
            user_id: 유저 ID
            user_context: 유저 컨텍스트
            candidate_meetings: 후보 모임들
            parsed_query: 파싱된 쿼리
            intent: 감지된 의도
            user_prompt: 원본 프롬프트
            query_terms: 쿼리 키워드들

        Returns:
            점수가 계산된 모임 리스트
        """
        if not self.model_loader.ranker or not self.model_loader.ranker.is_loaded():
            raise RuntimeError("LightGBM Ranker 모델이 로드되지 않았습니다.")
        if not self.model_loader.feature_builder:
            raise RuntimeError("FeatureBuilder가 로드되지 않았습니다.")

        use_regressor = bool(self.model_loader.regressor and self.model_loader.regressor.is_loaded())

        conf = float(parsed_query.get("confidence", 0) or 0)

        # 1. User 정보 정규화
        user = self._build_user_dict(user_context, parsed_query)

        # 2. Feature 빌드
        rows, feats, valid_candidates = [], [], []
        for raw in candidate_meetings:
            try:
                m = self._normalize_meeting(raw)
                feat, x = self.model_loader.feature_builder.build(user, m)
                rows.append(x[0])
                feats.append(feat)
                valid_candidates.append(m)
            except Exception as e:
                logger.warning(f"⚠️ feature build 실패 meeting_id={raw.get('meeting_id')}: {e}")
                continue

        if not rows:
            return []

        # 3. LightGBM 예측
        X = np.vstack(rows)
        rank_raw = self.model_loader.ranker.predict(X)
        raw_list = [float(v) for v in rank_raw]
        n = len(raw_list)

        # 4. 동적 상한
        ceil = self._dynamic_ceil(n, conf)
        logger.info(f"[SCORE] n={n}, conf={conf:.2f}, ceil={ceil}")

        # 5. Regressor (선택)
        rating_list = None
        if use_regressor:
            try:
                preds = self.model_loader.regressor.predict(X)
                rating_list = [float(v) for v in preds]
            except Exception as e:
                logger.warning(f"⚠️ regressor rating 예측 실패: {e}")

        # 6. Percentile → Match Score
        match_scores = self._compute_match_scores(raw_list, n, conf, ceil, valid_candidates)

        # 7. 보정 적용
        results = []
        for idx, (m, feat, s) in enumerate(zip(valid_candidates, feats, raw_list)):
            ms = int(match_scores[idx])

            # 시간대 매칭
            ms = self._adjust_timeslot(ms, m, parsed_query)

            # location_query 보정
            ms = self._adjust_location_query(ms, m, parsed_query)

            # subcategory 보정
            ms = self._adjust_subcategory(ms, m, parsed_query, conf)

            # query_terms 보정
            ms += self._query_match_bonus(m, query_terms or [])

            # keywords 보정
            ms = self._adjust_keywords(ms, m, parsed_query)

            # intent 보정
            ms += float(self.intent_adjuster.adjust(intent, m, parsed_query))

            # meeting_id 기반 tie-break
            mid = int(m.get("meeting_id") or 0)
            ms += ((mid % 97) - 48) * 0.02

            # 최종 캡
            ms = min(ms, float(ceil))
            ms = max(0.0, min(100.0, ms))
            ms_int = int(round(ms))

            # 매칭 레벨
            if ms_int >= 85:
                lvl = "VERY_HIGH"
            elif ms_int >= 78:
                lvl = "HIGH"
            elif ms_int >= 65:
                lvl = "MEDIUM"
            else:
                lvl = "LOW"

            item = {
                **m,
                "rank_raw": round(float(s), 4),
                "match_score": ms_int,
                "meetingId": m.get("meeting_id"),
                "meeting_id": m.get("meeting_id"),
                "match_level": lvl,
                "key_points": self._build_key_points(feat),
                "score_meta": {
                    "n_candidates": n,
                    "confidence": round(conf, 3),
                    "ceil": int(ceil),
                }
            }

            if rating_list is not None:
                item["predicted_rating"] = round(float(rating_list[idx]), 3)

            results.append(item)

        results.sort(key=lambda x: x.get("match_score", 0), reverse=True)
        return results

    def _build_user_dict(self, user_ctx: dict, parsed_query: dict) -> dict:
        """User 정보 딕셔너리 생성"""

        def pick(d: dict, *keys, default=None):
            for k in keys:
                if k in d and d.get(k) is not None:
                    return d.get(k)
            return default

        user_time_pref = (
                parsed_query.get("user_time_preference")
                or pick(user_ctx, "time_preference", "timePreference", default=None)
        )

        return {
            "lat": pick(user_ctx, "lat", "latitude", default=None),
            "lng": pick(user_ctx, "lng", "longitude", default=None),
            "interests": pick(user_ctx, "interests", default=""),
            "time_preference": self.normalizer.normalize_timeslot(user_time_pref),
            "user_location_pref": pick(user_ctx, "user_location_pref", "userLocationPref", default=None),
            "budget_type": self.normalizer.normalize_budget_type(
                pick(user_ctx, "budget_type", "budgetType", default="value")
            ),
            "user_avg_rating": float(pick(user_ctx, "user_avg_rating", "userAvgRating", default=3.0)),
            "user_meeting_count": int(pick(user_ctx, "user_meeting_count", "userMeetingCount", default=0)),
            "user_rating_std": float(pick(user_ctx, "user_rating_std", "userRatingStd", default=0.5)),
        }

    def _normalize_meeting(self, m: dict) -> dict:
        """모임 정보 정규화"""
        title = (m.get("title") or "").strip()
        sub = (m.get("subcategory") or "").strip()
        cat = (m.get("category") or "").strip()

        # title 기반 스포츠 subcategory 자동 교정
        if cat == "스포츠" and title:
            t = title.lower()
            if "러닝" in t or "달리기" in t:
                sub = "러닝"
            elif "축구" in t or "풋살" in t:
                sub = "축구"
            elif "배드민턴" in t:
                sub = "배드민턴"
            elif "클라이밍" in t:
                sub = "클라이밍"

        return {
            "meeting_id": m.get("meeting_id") or m.get("meetingId"),
            "lat": m.get("latitude") or m.get("lat"),
            "lng": m.get("longitude") or m.get("lng"),
            "category": cat or "",
            "subcategory": sub or "",
            "time_slot": self.normalizer.normalize_timeslot(m.get("time_slot") or m.get("timeSlot")),
            "meeting_location_type": self.normalizer.normalize_location_type(
                m.get("location_type") or m.get("locationType")
            ),
            "vibe": m.get("vibe", "") or "",
            "meeting_participant_count": m.get("current_participants") or m.get("currentParticipants") or 0,
            "expected_cost": m.get("expected_cost") or m.get("expectedCost") or 0,
            "meeting_avg_rating": m.get("avg_rating") or m.get("avgRating") or 0.0,
            "meeting_rating_count": m.get("rating_count") or m.get("ratingCount") or 0,
            "distance_km": m.get("distance_km") or m.get("distanceKm"),
            "title": m.get("title"),
            "image_url": m.get("image_url") or m.get("imageUrl"),
            "location_name": m.get("location_name") or m.get("locationName"),
            "location_address": m.get("location_address") or m.get("locationAddress"),
            "meeting_time": m.get("meeting_time") or m.get("meetingTime"),
            "max_participants": m.get("max_participants") or m.get("maxParticipants") or 10,
            "current_participants": m.get("current_participants") or m.get("currentParticipants") or 0,
        }

    def _dynamic_ceil(self, n: int, conf: float) -> int:
        """동적 상한"""
        if n == 1:
            return 73
        elif n == 2:
            return 76
        elif n == 3:
            return 79
        elif n <= 5:
            return 82
        elif n <= 10:
            return 84
        elif n <= 30:
            return 85
        elif n <= 50:
            return 86
        else:
            return 87

    def _compute_match_scores(
            self,
            raw_list: List[float],
            n: int,
            conf: float,
            ceil: int,
            valid_candidates: List[dict]
    ) -> List[int]:
        """Percentile → Match Score 변환"""
        match_scores = [55] * n

        if n == 1:
            s = raw_list[0]
            base_score = 1.0 / (1.0 + math.exp(-s * 0.25))
            base_score = 58 + base_score * 15
            conf_bonus = conf * 3
            ms = base_score + conf_bonus
            ms = max(60, min(73, ms))
            match_scores[0] = int(round(ms))

        elif n <= 10:
            base = [78, 74, 70, 66, 63, 60, 57, 55, 53, 51]
            order = sorted(range(n), key=lambda i: raw_list[i], reverse=True)

            top = raw_list[order[0]]
            bottom = raw_list[order[-1]]
            span = (top - bottom) if (top - bottom) != 0 else 1.0

            for rank, i in enumerate(order):
                b = base[rank] if rank < len(base) else 52
                t = (raw_list[i] - bottom) / span
                adj = (t - 0.5) * 6.0
                ms = b + adj
                ms = max(50, min(82, ms))
                ms = min(ms, ceil)
                match_scores[i] = int(round(ms))

        else:
            sorted_vals = sorted(raw_list)

            def percentile_midrank(x: float) -> float:
                lt = sum(1 for v in sorted_vals if v < x)
                eq = sum(1 for v in sorted_vals if v == x)
                p = (lt + 0.5 * eq) / n
                eps = 0.5 / n
                if p < eps:
                    p = eps
                if p > 1 - eps:
                    p = 1 - eps
                return p

            for i, s in enumerate(raw_list):
                meeting_id = valid_candidates[i].get("meeting_id", i)

                p = percentile_midrank(float(s))

                # meeting_id 기반 noise
                id_noise = (meeting_id % 1000) * 0.00001
                order_noise = i * 0.0001

                p_adjusted = p + id_noise + order_noise
                p_adjusted = max(0.0, min(1.0, p_adjusted))

                # stretch + gamma
                p_final = max(0.0, min(1.0, 0.5 + (p_adjusted - 0.5) * 1.6))

                ms = match_from_percentile(p_final, floor=46, ceil=ceil, gamma=1.6)
                ms = min(ms, ceil)
                match_scores[i] = int(ms)

        return match_scores

    def _adjust_timeslot(self, ms: float, m: dict, parsed_query: dict) -> float:
        """시간대 매칭 보정"""
        requested_ts = parsed_query.get("time_slot") or parsed_query.get("timeSlot")
        meeting_ts = m.get("time_slot")

        if requested_ts and meeting_ts:
            req_normalized = self.normalizer.normalize_timeslot(requested_ts)
            meet_normalized = self.normalizer.normalize_timeslot(meeting_ts)

            if req_normalized == meet_normalized:
                ms += 10
            elif self._is_adjacent_timeslot(req_normalized, meet_normalized):
                ms += 2
            else:
                ms -= 15

        return ms

    def _adjust_location_query(self, ms: float, m: dict, parsed_query: dict) -> float:
        """location_query 보정"""
        location_query = parsed_query.get("location_query")
        if location_query:
            meeting_loc = str(m.get("location_name", "")).lower()
            query_loc = str(location_query).lower()
            query_keyword = query_loc.replace("근처", "").replace("주변", "").replace("집", "").strip()

            if query_keyword and query_keyword in meeting_loc:
                ms += 20
            elif any(keyword in meeting_loc for keyword in ["구", "역", "동"]):
                ms -= 5

        return ms

    def _adjust_subcategory(self, ms: float, m: dict, parsed_query: dict, conf: float) -> float:
        """subcategory 보정"""
        requested_sub = (parsed_query.get("subcategory") or "").strip()
        if requested_sub and conf >= 0.7:
            meet_sub = (m.get("subcategory") or "").strip()
            if meet_sub == requested_sub:
                ms += 18
            else:
                ms -= 25

        return ms

    def _adjust_keywords(self, ms: float, m: dict, parsed_query: dict) -> float:
        """keywords 보정"""
        keywords = clean_keywords(parsed_query.get("keywords") or [])
        if keywords:
            text = (
                f"{m.get('title', '')} {m.get('location_name', '')} {m.get('location_address', '')} "
                f"{m.get('subcategory', '')} {m.get('vibe', '')}"
            ).lower()

            hit = sum(1 for k in keywords if k in text)
            ms += min(hit * 2, 5)

        return ms

    def _query_match_bonus(self, m: dict, q_terms: List[str]) -> float:
        """query_terms 매칭 보너스"""
        if not q_terms:
            return 0.0

        title = (m.get("title") or "").lower()
        sub = (m.get("subcategory") or "").lower()
        cat = (m.get("category") or "").lower()
        loc = (m.get("location_name") or "").lower()

        hay = f"{title} {sub} {cat} {loc}"

        hit = sum(1 for t in q_terms if t and t.lower() in hay)

        if hit >= 2:
            return 30.0
        if hit == 1:
            return 22.0

        return -12.0

    def _build_key_points(self, feat: dict) -> List[str]:
        """핵심 포인트 생성"""
        points = []
        if feat.get("distance_km", 999) <= 3:
            points.append(f"가까운 거리({feat['distance_km']:.1f}km)")
        if feat.get("time_match") == 1.0:
            points.append("선호 시간대 일치")
        if feat.get("location_type_match") == 1.0:
            points.append("실내/야외 선호 일치")
        if feat.get("cost_match_score", 0) >= 0.7:
            points.append("예산에 잘 맞음")
        if feat.get("interest_match_score", 0) >= 0.5:
            points.append("관심사 매칭")
        return points[:3]

    def _is_adjacent_timeslot(self, slot1: str, slot2: str) -> bool:
        """인접 시간대 체크"""
        if not slot1 or not slot2:
            return False

        adjacency = {
            "MORNING": ["AFTERNOON"],
            "AFTERNOON": ["MORNING", "EVENING"],
            "EVENING": ["AFTERNOON", "NIGHT"],
            "NIGHT": ["EVENING"]
        }

        return slot2 in adjacency.get(slot1, [])