"""
Reasoning Generator
GPT 기반 추천 이유 생성
"""

import anyio
import random
from typing import Dict
from app.core.logging import logger


class ReasoningGenerator:
    """추천 이유 생성"""

    def __init__(self, gpt_service):
        """
        Args:
            gpt_service: GPTPromptService 인스턴스
        """
        self.gpt_service = gpt_service

    async def generate(
            self,
            user_context: Dict,
            meeting: Dict,
            parsed_query: Dict
    ) -> str:
        """
        GPT 기반 동적 reasoning 생성

        Args:
            user_context: 유저 컨텍스트
            meeting: 모임 정보
            parsed_query: 파싱된 쿼리

        Returns:
            추천 이유 텍스트
        """
        try:
            # 안전한 값 추출
            user_prompt_keywords = " ".join(parsed_query.get("keywords", []))
            category = meeting.get("category") or ""
            subcategory = meeting.get("subcategory") or ""
            location = meeting.get("location_name") or "미정"
            distance = meeting.get("distance_km") if meeting.get("distance_km") is not None else 0
            cost = meeting.get("expected_cost") if meeting.get("expected_cost") is not None else 0
            participants = meeting.get("current_participants") if meeting.get("current_participants") is not None else 0
            max_participants = meeting.get("max_participants") if meeting.get("max_participants") is not None else 10
            vibe = meeting.get("vibe") or ""

            # GPT 프롬프트
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

            def _call():
                return self.gpt_service.client.chat.completions.create(
                    model="gpt-4o-mini",
                    messages=[
                        {"role": "system", "content": "당신은 공감 능력이 뛰어난 AI 추천 어시스턴트입니다."},
                        {"role": "user", "content": prompt}
                    ],
                    temperature=0.7,
                    max_tokens=200
                )

            response = await anyio.to_thread.run_sync(_call)
            reasoning = response.choices[0].message.content.strip()

            logger.info(f"✅ GPT reasoning 생성: {reasoning[:50]}...")
            return reasoning

        except Exception as e:
            logger.error(f"⚠️ GPT reasoning 실패, fallback 사용: {e}")
            return self.fallback_reasoning(meeting, parsed_query)

    def fallback_reasoning(self, meeting: Dict, parsed_query: Dict) -> str:
        """GPT 실패 시 템플릿 기반 reasoning"""
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

        options = templates.get(
            category,
            [f"이 모임은 당신의 취향과 잘 맞을 것 같아요! 😊 {location}에서 {distance:.1f}km 거리예요."]
        )
        return random.choice(options)