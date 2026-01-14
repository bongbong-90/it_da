"""
AI Recommendation Integration Service
GPT 파싱 → DB 검색 → AI 모델 추천 통합
"""

import httpx
import math
import uuid
from typing import List, Dict, Optional

import numpy as np

from app.services.gpt_prompt_service import GPTPromptService
from app.models.model_loader import model_loader
from app.core.logging import logger


class AIRecommendationService:
    """AI 추천 통합 서비스"""

    def __init__(
        self,
        gpt_service: GPTPromptService,
        spring_boot_url: str = "http://localhost:8080"
    ):
        self.gpt_service = gpt_service
        self.spring_boot_url = spring_boot_url

    # -------------------------
    # Normalizers (Spring Enum/DB 값 호환)
    # -------------------------
    def _normalize_timeslot(self, ts: Optional[str]) -> Optional[str]:
        """Spring Enum: MORNING/AFTERNOON/EVENING/NIGHT"""
        if not ts:
            return None
        raw = str(ts).strip()
        lower = raw.lower()
        mapping = {
            "morning": "MORNING",
            "afternoon": "AFTERNOON",
            "evening": "EVENING",
            "night": "NIGHT",
            "오전": "MORNING",
            "아침": "MORNING",
            "점심": "AFTERNOON",
            "오후": "AFTERNOON",
            "저녁": "EVENING",
            "밤": "NIGHT",
            "야간": "NIGHT",
        }
        return mapping.get(lower, raw.upper())

    def _normalize_location_type(self, lt: Optional[str]) -> Optional[str]:
        """Spring Enum: INDOOR/OUTDOOR"""
        if not lt:
            return None
        raw = str(lt).strip()
        lower = raw.lower()
        mapping = {
            "indoor": "INDOOR",
            "outdoor": "OUTDOOR",
            "실내": "INDOOR",
            "실외": "OUTDOOR",
            "야외": "OUTDOOR",
        }
        return mapping.get(lower, raw.upper())

    def _normalize_budget_for_model(self, bt: Optional[str]) -> str:
        """모델 입력은 소문자로 통일 (value/quality)"""
        if not bt:
            return "value"
        raw = str(bt).strip()
        mapping = {
            "VALUE": "value", "value": "value", "가성비": "value", "합리": "value",
            "QUALITY": "quality", "quality": "quality", "품질": "quality",
        }
        return mapping.get(raw, mapping.get(raw.upper(), mapping.get(raw.lower(), "value")))

    # -------------------------
    # Intent (문장 의도)
    # -------------------------
    def _detect_intent(self, user_prompt: str, parsed_query: dict) -> str:
        t = (user_prompt or "").lower()

        quiet_words = ["조용", "쉬", "힐링", "편하게", "여유", "카페", "대화", "산책", "전시", "독서", "쉬고"]
        active_words = ["러닝", "운동", "뛰", "배드민턴", "축구", "헬스", "등산", "클라이밍"]

        if any(w in t for w in quiet_words):
            return "QUIET"
        if any(w in t for w in active_words):
            return "ACTIVE"

        vibe = parsed_query.get("vibe")
        if vibe in ["힐링", "여유로운"]:
            return "QUIET"
        return "NEUTRAL"

    def _apply_intent_adjustment(self, intent: str, meeting: dict) -> float:
        """
        match_score에 더해지는 보정값.
        너희 카테고리 체계에 맞춰 튜닝하면 됨.
        """
        cat = (meeting.get("category") or "")
        sub = (meeting.get("subcategory") or "")

        if intent == "QUIET":
            # 스포츠는 강하게 패널티
            if cat == "스포츠":
                return -25.0
            # 조용할만한 것들 보너스(너희 데이터에 맞춰 수정)
            if cat in ["카페", "문화", "취미"] or sub in ["독서", "보드게임", "전시", "스터디"]:
                return +15.0

        if intent == "ACTIVE":
            if cat == "스포츠":
                return +15.0
            if cat in ["카페", "문화"]:
                return -10.0

        return 0.0

    # -------------------------
    # Search payload builder (중요)
    # -------------------------
    def _should_apply_time_slot(self, q: dict) -> bool:
        # time_slot은 추측이 섞이므로 confidence 높을 때만 필터로 사용
        return q.get("time_slot") is not None and q.get("confidence", 0) >= 0.9

    def _should_apply_vibe(self, q: dict) -> bool:
        return q.get("vibe") is not None and q.get("confidence", 0) >= 0.9

    def _infer_location_type(self, q: dict) -> Optional[str]:
        kws = q.get("keywords") or []
        text = " ".join(kws)
        if "실내" in text:
            return "INDOOR"
        if "야외" in text or "실외" in text:
            return "OUTDOOR"
        return None

    def _to_spring_search_request(self, enriched_query: dict, user_ctx: dict) -> dict:
        """
        Spring /api/meetings/search 로 보낼 payload 생성
        - timeSlot/vibe는 "필터로 쓸 때만" 들어오도록 enriched_query에서 이미 정리해줌
        """
        # keyword: keywords를 합쳐서 String으로
        keyword = enriched_query.get("keyword")
        if not keyword:
            kws = enriched_query.get("keywords") or []
            keyword = " ".join(kws) if kws else None

        raw_location_type = (
            enriched_query.get("locationType")
            or enriched_query.get("location_type")
            or self._infer_location_type(enriched_query)
        )
        location_type = self._normalize_location_type(raw_location_type)

        raw_time_slot = enriched_query.get("time_slot") or enriched_query.get("timeSlot")
        time_slot = self._normalize_timeslot(raw_time_slot)

        lat = user_ctx.get("lat") or user_ctx.get("latitude")
        lng = user_ctx.get("lng") or user_ctx.get("longitude")

        payload = {
            "keyword": keyword,
            "category": enriched_query.get("category"),
            "subcategory": enriched_query.get("subcategory"),

            "latitude": lat,
            "longitude": lng,
            "radius": enriched_query.get("radius", 5.0),

            "locationType": location_type,
            "vibe": enriched_query.get("vibe"),
            "timeSlot": time_slot,

            "page": 0,
            "size": 200,
            "sortBy": "createdAt",
            "sortDirection": "desc",
        }

        return {k: v for k, v in payload.items() if v is not None and v != ""}

    # -------------------------
    # Step 4: candidate search + relaxation
    # -------------------------
    async def _search_meetings(self, enriched_query: dict, user_context: dict) -> list[dict]:
        try:
            payload = self._to_spring_search_request(enriched_query, user_context)
            logger.info(f"🔎 Spring MeetingSearchRequest payload = {payload}")

            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    f"{self.spring_boot_url}/api/meetings/search",
                    json=payload
                )

            if response.status_code == 200:
                result = response.json()
                return result.get("meetings", [])
            else:
                logger.warning(f"⚠️ 모임 검색 실패: {response.status_code} body={response.text}")
                return []
        except Exception as e:
            logger.error(f"⚠️ 모임 검색 API 호출 실패: {e}")
            return []

    async def _search_with_relaxation(self, base_query: dict, user_context: dict, trace_steps: list) -> list[dict]:
        async def _try(label: str, q: dict, level: int):
            meetings = await self._search_meetings(q, user_context)
            trace_steps.append({
                "level": level,
                "label": label,
                "payload": self._to_spring_search_request(q, user_context),
                "count": len(meetings or [])
            })
            return meetings or []

        # L0: 원본
        cands = await _try("L0 원본", base_query, 0)
        if cands:
            return cands

        # L1: vibe 제거
        q1 = dict(base_query)
        q1.pop("vibe", None)
        cands = await _try("L1 vibe 제거", q1, 1)
        if cands:
            return cands

        # L2: timeSlot 제거
        q2 = dict(q1)
        q2.pop("time_slot", None)
        q2.pop("timeSlot", None)
        cands = await _try("L2 timeSlot 제거", q2, 2)
        if cands:
            return cands

        # L3: subcategory 제거
        q3 = dict(q2)
        q3.pop("subcategory", None)
        cands = await _try("L3 subcategory 제거", q3, 3)
        if cands:
            return cands

        # L4: category 제거 (정말 마지막)
        q4 = dict(q3)
        q4.pop("category", None)
        cands = await _try("L4 category 제거", q4, 4)
        return cands

    # -------------------------
    # Main pipeline
    # -------------------------
    async def get_ai_recommendations(self, user_prompt: str, user_id: int, top_n: int = 5) -> Dict:
        rid = str(uuid.uuid4())[:8]
        logger.info(f"[RID={rid}] 🔍 AI 검색 요청: user_id={user_id}, prompt='{user_prompt}'")

        try:
            # Step 1
            logger.info(f"[Step 1] GPT 프롬프트 파싱: {user_prompt}")
            parsed_query = await self.gpt_service.parse_search_query(user_prompt)

            # Step 2
            logger.info(f"[Step 2] 사용자 컨텍스트 조회: user_id={user_id}")
            user_context = await self._get_user_context(user_id)

            # Step 3
            enriched_query = await self.gpt_service.enrich_with_user_context(parsed_query, user_context)

            # ✅ timeSlot/vibe를 "필터로 쓸지" 결정해서 정리
            if not self._should_apply_time_slot(enriched_query):
                enriched_query.pop("time_slot", None)
                enriched_query.pop("timeSlot", None)
            if not self._should_apply_vibe(enriched_query):
                enriched_query.pop("vibe", None)

            # Step 4
            trace_steps: list = []
            candidate_meetings = await self._search_with_relaxation(enriched_query, user_context, trace_steps)

            if not candidate_meetings:
                logger.warning("⚠️ 검색 결과 없음 - SVD 기반 추천으로 대체")
                data = await self._fallback_svd_recommendation(user_id, user_prompt, parsed_query, top_n)

                # fallback도 intent 보정
                intent = self._detect_intent(user_prompt, parsed_query)

                for rec in data.get("recommendations", []):
                    rec["match_score"] = int(max(0, min(100, rec.get("match_score", 0) + self._apply_intent_adjustment(intent, rec))))
                    rec["intent"] = intent

                data["search_trace"] = {
                    "steps": trace_steps,
                    "final_level": trace_steps[-1]["level"] if trace_steps else 0,
                    "final_label": trace_steps[-1]["label"] if trace_steps else "L0 원본",
                    "fallback": True
                }
                return data

            logger.info(f"[Step 5] AI 점수 계산: {len(candidate_meetings)}개 모임")

            intent = self._detect_intent(user_prompt, parsed_query)  # ✅ 먼저 만들고

            scored_meetings = await self._score_meetings(
                user_id, user_context, candidate_meetings, parsed_query, intent
            )

            # ✅ intent 보정(룰 기반)
            for m in scored_meetings:
                m["match_score"] = int(max(0, min(100, m["match_score"] + self._apply_intent_adjustment(intent, m))))
                m["intent"] = intent



            # Step 6
            top_recommendations = sorted(scored_meetings, key=lambda x: x["match_score"], reverse=True)[:top_n]

            # Step 7
            for rec in top_recommendations:
                rec["reasoning"] = await self._generate_reasoning(user_context, rec, parsed_query)

            return {
                "user_prompt": user_prompt,
                "parsed_query": parsed_query,
                "total_candidates": len(candidate_meetings),
                "recommendations": top_recommendations,
                "search_trace": {
                    "steps": trace_steps,
                    "final_level": trace_steps[-1]["level"] if trace_steps else 0,
                    "final_label": trace_steps[-1]["label"] if trace_steps else "L0 원본",
                    "fallback": False
                }
            }

        except Exception as e:
            logger.error(f"❌ AI 추천 실패: {e}")
            raise

    # -------------------------
    # Scoring (너 코드 거의 그대로)
    # -------------------------
    async def _score_meetings(self, user_id: int, user_context: dict, candidate_meetings: list[dict], parsed_query,
                              intent) -> list[dict]:
        def pick(d: dict, *keys, default=None):
            for k in keys:
                if k in d and d.get(k) is not None:
                    return d.get(k)
            return default

        if not model_loader.lightgbm or not model_loader.lightgbm.is_loaded():
            raise RuntimeError("LightGBM 모델이 로드되지 않았습니다.")
        if not model_loader.feature_builder:
            raise RuntimeError("FeatureBuilder가 로드되지 않았습니다.")

        user = {
            "lat": pick(user_context, "lat", "latitude", default=None),
            "lng": pick(user_context, "lng", "longitude", default=None),
            "interests": pick(user_context, "interests", default=""),
            "time_preference": self._normalize_timeslot(
                pick(user_context, "time_preference", "timePreference", default=None)),
            "user_location_pref": pick(user_context, "user_location_pref", "userLocationPref", default=None),
            "budget_type": self._normalize_budget_for_model(
                pick(user_context, "budget_type", "budgetType", default="value")),
            "user_avg_rating": float(pick(user_context, "user_avg_rating", "userAvgRating", default=3.0)),
            "user_meeting_count": int(pick(user_context, "user_meeting_count", "userMeetingCount", default=0)),
            "user_rating_std": float(pick(user_context, "user_rating_std", "userRatingStd", default=0.5)),
        }

        # ❌ 제거 - intent는 특성이 아님
        # user["intent"] = intent

        rows, feats, valid_candidates = [], [], []
        for raw in candidate_meetings:
            try:
                m = self._normalize_meeting(raw)
                feat, x = model_loader.feature_builder.build(user, m)
                rows.append(x[0])
                feats.append(feat)
                valid_candidates.append(m)
            except Exception as e:
                logger.warning(f"⚠️ feature build 실패 meeting_id={raw.get('meeting_id')}: {e}")
                continue

        if not rows:
            return []

        X = np.vstack(rows)
        preds = model_loader.lightgbm.predict(X)

        results = []
        for m, feat, p in zip(valid_candidates, feats, preds):
            predicted_rating = float(p)
            match_score = int(max(0, min(100, round((predicted_rating - 1) / 4 * 100))))

            results.append({
                **m,
                "predicted_rating": round(predicted_rating, 3),
                "match_score": match_score,
                "key_points": self._build_key_points_from_feat(feat),
            })
        return results

    def _build_key_points_from_feat(self, feat: dict) -> list[str]:
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

    # -------------------------
    # User context / Reasoning / Fallback / Batch
    # -------------------------
    async def _get_user_context(self, user_id: int) -> Dict:
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(f"{self.spring_boot_url}/api/users/{user_id}/context")
                response.raise_for_status()
                ctx = response.json()
                logger.info(f"✅ 사용자 컨텍스트 조회 성공: userId={user_id}")
                return ctx
        except Exception as e:
            logger.error(f"❌ 사용자 컨텍스트 조회 실패: {e}")
            return {
                "user_id": user_id,
                "latitude": 37.5665,
                "longitude": 126.9780,
                "interests": "",
                "time_preference": "",
                "budget_type": "VALUE",
                "user_avg_rating": 0.0,
                "user_meeting_count": 0,
                "user_rating_std": 0.0
            }

    async def _generate_reasoning(self, user_context: Dict, meeting: Dict, parsed_query: Dict) -> str:
        """
        GPT를 활용한 동적이고 공감 가능한 추천 이유 생성
        """
        try:
            # ✅ None 체크를 포함한 안전한 값 추출
            user_prompt_keywords = " ".join(parsed_query.get("keywords", []))
            category = meeting.get("category") or ""
            subcategory = meeting.get("subcategory") or ""
            location = meeting.get("location_name") or "미정"
            distance = meeting.get("distance_km") if meeting.get("distance_km") is not None else 0
            cost = meeting.get("expected_cost") if meeting.get("expected_cost") is not None else 0
            participants = meeting.get("current_participants") if meeting.get("current_participants") is not None else 0
            max_participants = meeting.get("max_participants") if meeting.get("max_participants") is not None else 10
            vibe = meeting.get("vibe") or ""

            # ✅ GPT 프롬프트
            prompt = f"""
    당신은 친근하고 공감 능력이 뛰어난 AI 추천 어시스턴트입니다.
    사용자의 상황과 감정을 이해하고, 왜 이 모임이 딱 맞는지 자연스럽게 설명하세요.

    **사용자 키워드:** {user_prompt_keywords}

    **추천 모임:**
    - 제목: {meeting.get('title', '제목 없음')}
    - 카테고리: {category} - {subcategory}
    - 분위기: {vibe}
    - 위치: {location} ({distance:.1f}km)
    - 비용: {cost:,}원
    - 참가자: {participants}/{max_participants}명

    **작성 규칙:**
    1. 사용자의 감정/상황에 공감하는 한 문장으로 시작
    2. 이 모임의 매력 포인트를 2-3문장으로 설명
    3. 친근하고 따뜻한 말투 (존댓말 + 반말 섞어서)
    4. 이모지 1-2개만 사용 (과하지 않게)
    5. 총 3-4문장, 80-120자 이내

    **좋은 예시:**
    - "오늘 힘드셨죠? 😊 조용한 카페에서 브런치 먹으면서 머리 좀 식히는 건 어떨까요? 홍대 카페는 분위기도 아늑하고 2.3km 거리라 부담 없어요!"
    - "딱 적당히 몸 풀고 싶을 때네요! 🏃 한강에서 5km 가볍게 뛰면서 같이 달리는 사람들이랑 수다도 떨면 스트레스가 확 풀려요."
    - "기분전환엔 전시회만 한 게 없죠! 🎨 성수동 갤러리는 무료 입장이고 작품 보면서 감성 충전하기 딱이에요."

    **이제 작성하세요 (추천 이유만, 다른 말 없이):**
    """

            # ✅ await 제거 - 동기 호출
            response = self.gpt_service.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": "당신은 공감 능력이 뛰어난 AI 추천 어시스턴트입니다."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=200
            )

            reasoning = response.choices[0].message.content.strip()
            logger.info(f"✅ GPT reasoning 생성: {reasoning[:50]}...")
            return reasoning

        except Exception as e:
            logger.error(f"⚠️ GPT reasoning 실패, fallback 사용: {e}")
            return self._fallback_reasoning(meeting, parsed_query)

    def _fallback_reasoning(self, meeting: Dict, parsed_query: Dict) -> str:
        """GPT 실패 시 템플릿 기반 reasoning"""

        # ✅ None 체크를 포함한 안전한 값 추출
        category = meeting.get("category") or ""
        subcategory = meeting.get("subcategory") or ""
        location = meeting.get("location_name") or "미정"
        distance = meeting.get("distance_km") if meeting.get("distance_km") is not None else 0
        cost = meeting.get("expected_cost") if meeting.get("expected_cost") is not None else 0
        participants = meeting.get("current_participants") if meeting.get("current_participants") is not None else 0

        templates = {
            "카페": [
                f"조용한 {location}에서 힐링 타임 어때요? ☕ {distance:.1f}km 거리라 부담 없이 다녀올 수 있어요!",
                f"카페에서 브런치 먹으면서 여유롭게 쉬는 건 어떨까요? 현재 {participants}명이 참여 중이라 편안한 분위기예요.",
            ],
            "스포츠": [
                f"가볍게 몸 풀면서 스트레스 날려버리기 좋아요! 🏃 {location}에서 함께 운동하면 더 재밌어요.",
                f"적당히 땀 흘리면서 기분전환하기 딱! {participants}명이랑 같이 하면 동기부여도 되고요.",
            ],
            "맛집": [
                f"맛있는 거 먹으면서 힐링하는 게 최고죠! 🍽️ {subcategory} 좋아하시면 강추예요.",
                f"{cost:,}원으로 맛있는 음식 먹으면서 스트레스 풀 수 있어요!",
            ],
            "문화예술": [
                f"감성 충전이 필요할 때! 🎨 {location}에서 여유롭게 예술 감상하면 마음이 편안해져요.",
                f"조용히 전시 보면서 머리 비우기 딱 좋은 모임이에요. {distance:.1f}km 거리라 가깝고요.",
            ],
            "소셜": [
                f"가볍게 놀면서 기분전환! 🎮 {subcategory} 하면서 웃다 보면 스트레스가 확 풀려요.",
                f"{participants}명이랑 함께하는 {subcategory} 모임! 부담 없이 즐기기 좋아요.",
            ],
        }

        import random
        options = templates.get(category, [f"이 모임은 당신의 취향과 잘 맞을 것 같아요! 😊 {location}에서 {distance:.1f}km 거리예요."])
        return random.choice(options)

    async def _fallback_svd_recommendation(self, user_id: int, user_prompt: str, parsed_query: Dict, top_n: int) -> Dict:
        if not model_loader.svd or not model_loader.svd.is_loaded():
            raise RuntimeError("SVD 모델 로드되지 않음")

        svd_recommendations = await model_loader.svd.recommend(user_id=user_id, top_n=top_n * 2)
        meeting_ids = [int(mid) for mid, _ in svd_recommendations]
        meetings = await self._get_meetings_by_ids(meeting_ids)

        scored = []
        for meeting in meetings:
            svd_score = next((score for mid, score in svd_recommendations if mid == meeting.get("meeting_id")), 3.5)
            scored.append({
                **meeting,
                "match_score": min(100, int(svd_score * 20)),
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

    def _normalize_meeting(self, m: dict) -> dict:
        """
        Spring 응답(snake/camel 혼용) → FeatureBuilder 입력 표준화
        + UI 유지 필드(title,image_url) 포함
        """
        return {
            "meeting_id": m.get("meeting_id") or m.get("meetingId"),

            "lat": m.get("latitude") or m.get("lat"),
            "lng": m.get("longitude") or m.get("lng"),

            "category": m.get("category", "") or "",
            "subcategory": m.get("subcategory", "") or "",

            "time_slot": self._normalize_timeslot(m.get("time_slot") or m.get("timeSlot")),
            "meeting_location_type": self._normalize_location_type(m.get("location_type") or m.get("locationType")),
            "vibe": m.get("vibe", "") or "",

            "max_participants": m.get("max_participants") or m.get("maxParticipants") or 10,
            "meeting_participant_count": m.get("current_participants") or m.get("currentParticipants") or 0,
            "expected_cost": m.get("expected_cost") or m.get("expectedCost") or 0,

            "meeting_avg_rating": m.get("avg_rating") or m.get("avgRating") or 0.0,
            "meeting_rating_count": m.get("rating_count") or m.get("ratingCount") or 0,

            "distance_km": m.get("distance_km") or m.get("distanceKm"),

            # UI용 보존
            "title": m.get("title"),
            "image_url": m.get("image_url") or m.get("imageUrl"),
            "location_name": m.get("location_name") or m.get("locationName"),
            "location_address": m.get("location_address") or m.get("locationAddress"),
            "meeting_time": m.get("meeting_time") or m.get("meetingTime"),
            "current_participants": m.get("current_participants") or m.get("currentParticipants"),
            "max_participants": m.get("max_participants") or m.get("maxParticipants"),
        }
