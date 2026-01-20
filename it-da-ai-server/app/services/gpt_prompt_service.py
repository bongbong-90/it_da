"""
GPT Prompt Parsing Service (FIXED - 실내/실외 구분 강화)
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
            user_prompt: "실내에서 할만한거"

        Returns:
            {
                "category": "소셜",
                "location_type": "INDOOR",  # ✅ 추가됨
                "vibe": "즐거운",
                "keywords": [],
                "confidence": 0.5
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
        return """당신은 모임 검색 쿼리 파서입니다.
    **중요: 빈 결과를 최소화하세요. 최소한 category나 keywords는 반드시 추출하세요.**

    ================================
    🎯 핵심 원칙
    ================================
    1. **confidence가 0.4 미만이면 안 됩니다** (최소 0.5 유지)
    2. **keywords는 최소 1개 이상** 추출하세요
    3. **애매한 경우 넓은 category로라도 매핑**하세요

================================
🚨 중요한 규칙 - 위치 전용 쿼리
================================
**"집 근처에서", "주변에서", "근처" 같은 입력:**
→ location_query로만 파싱
→ category를 추측하지 마세요!
→ keywords도 추가하지 마세요!

예시:
입력: "집 근처에서"
```json{
"category": null,
"location_query": "집 근처",
"keywords": [],
"confidence": 0.5
}

입력: "강남 근처"
```json{
"category": null,
"location_query": "강남",
"keywords": ["강남"],
"confidence": 0.6
}

================================
🎯 실내/실외 키워드 강화
================================
**"밖에서", "실외", "야외" → location_type: "OUTDOOR"**
**"안에서", "실내" → location_type: "INDOOR"**

예시:
입력: "오후에 밖에서"
```json{
"category": "스포츠",
"time_slot": "afternoon",
"location_type": "OUTDOOR",  # ✅ 필수!
"keywords": ["운동", "야외"],
"confidence": 0.7
}
    ================================
    📌 카테고리 추론 규칙 (적극적으로)
    ================================

    **"분위기 좋은", "힐링", "쉬고싶다" → 카페 or 문화예술**
    - 입력: "을지로 분위기 좋은곳"
      출력: category="카페", location_query="을지로", vibe="여유로운", keywords=["을지로", "카페"]

    **"점심", "저녁", "식사" → 맛집**
    - 입력: "점심시간에 할만한거"
      출력: category="맛집", time_slot="afternoon", keywords=["점심", "맛집"]

    **"스트레스", "기분전환", "힐링" → 카페 or 스포츠 (문맥 따라)**
    - 입력: "스트레스 풀고싶은데"
      출력: category="카페", vibe="힐링", keywords=["휴식", "카페"]

    **"심심", "뭐하지", "할거없어" → 소셜**
    - 입력: "심심한데"
      출력: category="소셜", vibe="즐거운", keywords=["오락"]

    **"돈 안들어가는", "무료", "저렴한" → max_cost 설정**
    - 입력: "돈 별로 안들어가는"
      출력: max_cost=10000, keywords=["무료", "저렴"]

    ================================
    🔑 keywords 규칙 (강화)
    ================================
    **무조건 1개 이상 추출하세요!**

    좋은 예:
    - "을지로 분위기 좋은곳" → ["을지로", "카페", "분위기"]
    - "점심시간에 할만한거" → ["점심", "맛집"]
    - "스트레스 풀고싶은데" → ["휴식", "힐링"]
    - "심심한데" → ["오락", "소셜"]

    나쁜 예:
    - ❌ keywords=[] (절대 금지!)

    ================================
📊 confidence 규칙 (완화)
================================
- 명확한 활동 → 0.8~0.95
- 애매하지만 의도 파악 가능 → 0.6~0.75 ✅ (0.5~0.7 → 0.6~0.75로 상향)
- 정말 불가능 → 0.5 (최소값)

**예시:**
- "점심시간" → category="맛집", confidence=0.65 ✅ (0.6 → 0.65)
- "을지로 분위기 좋은곳" → category="카페", confidence=0.70 ✅

    ================================
    📝 예시 (강화 버전)
    ================================

    입력: "을지로 분위기 좋은곳"
    ```json{
    "category": "카페",
    "subcategory": null,
    "time_slot": null,
    "location_query": "을지로",
    "location_type": null,
    "vibe": "여유로운",
    "max_cost": null,
    "keywords": ["을지로", "카페", "분위기"],
    "confidence": 0.65
    }

    입력: "점심시간에 할만한거"
    ```json{
    "category": "맛집",
    "subcategory": null,
    "time_slot": "afternoon",
    "location_query": null,
    "location_type": null,
    "vibe": "캐주얼",
    "max_cost": null,
    "keywords": ["점심", "식사"],
    "confidence": 0.6
    }

    입력: "스트레스 풀고싶은데"
    ```json{
    "category": "카페",
    "subcategory": null,
    "time_slot": null,
    "location_query": null,
    "location_type": "INDOOR",
    "vibe": "힐링",
    "max_cost": null,
    "keywords": ["휴식", "카페"],
    "confidence": 0.55
    }

    입력: "심심한데"
    ```json{
    "category": "소셜",
    "subcategory": null,
    "time_slot": null,
    "location_query": null,
    "location_type": null,
    "vibe": "즐거운",
    "max_cost": null,
    "keywords": ["오락", "게임"],
    "confidence": 0.5
    }

    입력: "돈 별로 안들어가는"
    ```json{
    "category": null,
    "subcategory": null,
    "time_slot": null,
    "location_query": null,
    "location_type": null,
    "vibe": null,
    "max_cost": 10000,
    "keywords": ["무료", "저렴"],
    "confidence": 0.5
    }
    
    **"공부", "스터디", "집중" → 스터디 or 카페**
- 입력: "공부하고싶은 기분?"
  출력: category="스터디", vibe="집중", keywords=["공부", "스터디"]

- 입력: "집중할 수 있는 곳"
  출력: category="카페", subcategory="스터디", keywords=["집중", "공부"]
  
  ================================
🎯 실외 + 조용함 조합 처리
================================
**"실외에서 조용하게/잔잔하게/여유롭게" → 문화예술 or 카페**

입력: "실외에서 조용하게 할만한 모임"
```json
{
  "category": "문화예술",
  "subcategory": "사진촬영",
  "location_type": "OUTDOOR",
  "vibe": "조용한",
  "keywords": ["실외", "조용", "산책", "사진"],
  "confidence": 0.65
}
```

입력: "실외에서 잔잔하게"
```json
{
  "category": "문화예술",
  "subcategory": "갤러리",
  "location_type": "OUTDOOR",
  "vibe": "여유로운",
  "keywords": ["실외", "잔잔", "산책"],
  "confidence": 0.6
}
```

**❌ 절대 안 됨:**
입력: "실외에서 조용하게"
```json
{
  "category": "소셜",  // ← 이러면 안 됨!
  "location_type": "OUTDOOR"
}

    """


    def _fallback_parse(self, user_prompt: str) -> Dict:
        """GPT 실패 시 기본 파싱 - 실내/실외 키워드 감지 추가"""
        logger.warning(f"⚠️ Fallback 파싱 사용: {user_prompt}")

        # ✅ 실내/실외 키워드 감지
        location_type = None
        lower_prompt = user_prompt.lower()
        if any(kw in lower_prompt for kw in ["실내", "안", "indoor", "인도어"]):
            location_type = "INDOOR"
        elif any(kw in lower_prompt for kw in ["실외", "야외", "밖", "outdoor", "아웃도어"]):
            location_type = "OUTDOOR"

        keywords = [word for word in user_prompt.split() if len(word) > 1]

        return {
            "category": None,
            "subcategory": None,
            "time_slot": None,
            "location_query": None,
            "location_type": location_type,  # ✅ 추가
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

        # ✅ 대신 별도 필드로만 보관 (랭킹에서만 사용)
        if user_context.get("time_preference"):
            enriched["user_time_preference"] = user_context["time_preference"]

        # 예산 정보
        if user_context.get("budget_type"):
            enriched["user_budget_type"] = user_context["budget_type"]

        # 관심사 정보
        if user_context.get("interests"):
            enriched["user_interests"] = user_context["interests"]

        return enriched