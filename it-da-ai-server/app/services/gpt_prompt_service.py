"""
GPT Prompt Parsing Service
사용자 자연어 → 구조화된 검색 파라미터 변환
"""

import openai
import json
from typing import Dict, List, Optional
from app.core.logging import logger


class GPTPromptService:
    """GPT를 활용한 프롬프트 파싱 서비스"""

    def __init__(self, api_key: str):
        self.client = openai.OpenAI(api_key=api_key)
        self.model = "gpt-4o-mini"  # 빠르고 저렴한 모델

    async def parse_search_query(self, user_prompt: str) -> Dict:
        """
        사용자 프롬프트를 구조화된 검색 파라미터로 변환

        Args:
            user_prompt: "오늘 저녁 강남에서 러닝할 사람~"

        Returns:
            {
                "category": "스포츠",
                "subcategory": "러닝",
                "time_slot": "evening",
                "location_query": "강남",
                "vibe": "활기찬",
                "max_cost": null,
                "keywords": ["러닝", "강남", "저녁"]
            }
        """
        try:
            system_prompt = self._build_system_prompt()

            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.3,  # 일관성 있는 응답
                max_tokens=500
            )

            # JSON 파싱
            content = response.choices[0].message.content.strip()

            # ```json ... ``` 제거
            if content.startswith("```json"):
                content = content[7:]
            if content.endswith("```"):
                content = content[:-3]

            parsed_data = json.loads(content.strip())

            logger.info(f"✅ GPT 파싱 성공: {user_prompt} → {parsed_data}")
            return parsed_data

        except json.JSONDecodeError as e:
            logger.error(f"❌ GPT 응답 JSON 파싱 실패: {e}")
            return self._fallback_parse(user_prompt)
        except Exception as e:
            logger.error(f"❌ GPT API 호출 실패: {e}")
            return self._fallback_parse(user_prompt)

    def _build_system_prompt(self) -> str:
        """시스템 프롬프트 구성"""
        return """당신은 모임 검색 쿼리 파서입니다. 사용자의 자연어 입력을 JSON 형태로 변환하세요.

**핵심 규칙: 분위기 표현에서 카테고리를 적극적으로 추론하세요!**

**감정/상황 → 카테고리 자동 매핑 (우선순위 높음):**

😤 스트레스/힘든 날 키워드 → "카페" 또는 "맛집" (힐링 우선!)
- "직장 상사", "괴롭힌", "스트레스", "힘든 날", "지친", "피곤해 죽겠어", "짜증나"
→ category: "카페" (조용한 힐링) or "맛집" (폭식 힐링)
→ subcategory: "카페투어", "브런치", "이자카야", "술집"

**분위기 → 카테고리 자동 매핑 (우선순위 높음):**

🧘 힐링/휴식 키워드 → "카페" 또는 "문화예술"
- "편하게", "쉬면서", "여유롭게", "힐링", "머리 비우고", "쉬고 싶다", "평화롭게"
→ category: "카페", subcategory: "카페투어" or "브런치" or "디저트"

🎮 가볍게 노는 키워드 → "소셜" 또는 "취미활동" (다양하게!)
- "기분전환", "부담없이", "가볍게 놀고", "재밌게", "심심해", "할 거 없어", "놀고 싶어"
- **주의: "뛰어놀다"는 제외 (러닝 우선)**
→ category: "소셜" (보드게임 외에도 방탈출, 볼링, 당구 등 다양하게)
→ 또는 category: "문화예술" (전시회, 갤러리)

🍔 먹으면서 키워드 → "맛집"
- "맛있게", "먹으면서", "맛집", "음식", "배고파", "저녁 먹을"
→ category: "맛집", subcategory: "한식/중식/일식/양식" 중 선택

🏃 활동적인/러닝 키워드 → "스포츠" (최우선!)
- **"뛰다", "뛰어", "달리", "조깅", "러닝", "run"** → 무조건 러닝
- "운동", "땀흘리며", "활발하게", "신나게", "체력", "건강"
→ category: "스포츠", subcategory: "러닝" (뛰다 포함 시 필수)
→ 또는 "축구/배드민턴/테니스" (다른 키워드 있을 때)

📚 배우고 싶은 키워드 → "스터디"
- "배우고", "공부", "스터디", "독서", "토론", "영어"
→ category: "스터디"

🎨 만들고 싶은 키워드 → "취미활동"
- "만들면서", "창작", "그림", "요리", "베이킹"
→ category: "취미활동"

**카테고리 목록:**
- 스포츠: 러닝, 등산, 축구, 농구, 배드민턴, 테니스, 요가, 필라테스, 헬스, 사이클링
- 맛집: 한식, 중식, 일식, 양식, 카페, 디저트, 술집, 맛집투어
- 카페: 카페투어, 브런치, 디저트, 베이커리, 티하우스
- 문화예술: 전시회, 공연, 갤러리, 공방체험, 사진촬영, 버스킹
- 스터디: 영어회화, 독서토론, 코딩, 재테크, 자격증, 세미나
- 취미활동: 그림, 베이킹, 쿠킹, 플라워, 캘리그라피, 댄스
- 소셜: 보드게임, 방탈출, 볼링, 당구, 노래방, 와인바

**시간대 매핑:**
- morning: 아침, 오전, 새벽
- afternoon: 오후, 점심, 낮
- evening: 저녁, 밤, 야간

**분위기 매핑 (반드시 아래 8개 중 하나):**
- 활기찬: 신나는, 활발한, 에너지 넘치는
- 여유로운: 편안한, 느긋한, 맛있는
- 힐링: 치유, 평화로운, 쉬고 싶은
- 진지한: 집중하는, 전문적인, 배움
- 즐거운: 재미있는, 유쾌한, 자유로운
- 감성적인: 감성, 예술적인, 창의적인
- 건강한: 활동적인, 체력
- 배움: 공부, 성장, 발전

**응답 형식 (반드시 JSON만):**
```json
{
  "category": "카페",
  "subcategory": "카페투어",
  "time_slot": "afternoon",
  "location_query": null,
  "vibe": "힐링",
  "max_cost": null,
  "keywords": ["편하게", "힐링"],
  "confidence": 0.8
}
```

**예시:**
- "머리 비우고 싶다" → {"category": "카페", "subcategory": "카페투어", "vibe": "힐링"}
- "편하게 놀고 싶어" → {"category": "소셜", "subcategory": "방탈출", "vibe": "즐거운"}
- "기분전환 하고 싶다" → {"category": "문화예술", "subcategory": "전시회", "vibe": "감성적인"}
- "사람 많은 건 싫고 조용히" → {"category": "카페", "subcategory": "브런치", "vibe": "여유로운"}
- "적당히 뛰어놀고 싶다" → {"category": "스포츠", "subcategory": "러닝", "vibe": "건강한"}
- "가볍게 달리고 싶어" → {"category": "스포츠", "subcategory": "러닝", "vibe": "활기찬"}
- **"직장 상사가 괴롭힌 날" → {"category": "카페", "subcategory": "카페투어", "vibe": "힐링"}**
- **"오늘 너무 힘들었어" → {"category": "맛집", "subcategory": "이자카야", "vibe": "힐링"}**
- **"스트레스 풀고 싶다" → {"category": "카페", "subcategory": "브런치", "vibe": "힐링"}**

**중요:**
1. 반드시 JSON만 출력하세요 (설명 금지)
2. category는 가능한 한 추론하세요 (null 최소화)
3. vibe는 반드시 8개 중 하나로 매핑
4. confidence는 0~1 사이 값
5. keywords는 핵심 단어 3~5개 추출
6. **애매하거나 모호한 검색어는 confidence를 0.4 이하로 설정**
7. **성소수자 관련 키워드는 "소셜" 카테고리로 매핑**"""

    def _fallback_parse(self, user_prompt: str) -> Dict:
        """GPT 실패 시 기본 파싱"""
        logger.warning(f"⚠️ Fallback 파싱 사용: {user_prompt}")

        keywords = [word for word in user_prompt.split() if len(word) > 1]

        return {
            "category": None,
            "subcategory": None,
            "time_slot": None,
            "location_query": None,
            "vibe": None,
            "max_cost": None,
            "keywords": keywords[:5],
            "confidence": 0.3
        }

    async def enrich_with_user_context(
            self,
            parsed_query: Dict,
            user_context: Dict
    ) -> Dict:
        """
        사용자 컨텍스트를 추가해 쿼리 보강

        Args:
            parsed_query: GPT 파싱 결과
            user_context: {
                "user_id": 123,
                "latitude": 37.5,
                "longitude": 127.0,
                "interests": "스포츠,카페",
                "time_preference": "evening",
                "budget_type": "FREE"
            }

        Returns:
            보강된 검색 파라미터
        """
        enriched = parsed_query.copy()

        # 위치 정보 추가
        if user_context.get("latitude") and user_context.get("longitude"):
            enriched["user_location"] = {
                "latitude": user_context["latitude"],
                "longitude": user_context["longitude"]
            }

        # 선호 시간대가 없으면 사용자 기본값 사용
        if not enriched.get("time_slot") and user_context.get("time_preference"):
            enriched["time_slot"] = user_context["time_preference"]

        # 예산 정보
        if user_context.get("budget_type"):
            enriched["user_budget_type"] = user_context["budget_type"]

        # 관심사 정보
        if user_context.get("interests"):
            enriched["user_interests"] = user_context["interests"]

        return enriched