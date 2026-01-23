"""
Intent Detector
유저 의도 감지 (ACTIVE/BRAIN/QUIET/HANDS_ON/NEUTRAL)
"""

from app.core.logging import logger


class IntentDetector:
    """유저 의도 감지"""

    def detect(self, user_prompt: str, parsed_query: dict) -> str:
        """
        유저 의도 감지

        Args:
            user_prompt: 유저 입력 원문
            parsed_query: 파싱된 쿼리

        Returns:
            Intent (ACTIVE/BRAIN/QUIET/HANDS_ON/NEUTRAL)
        """
        t = (user_prompt or "").lower()

        # 1순위: 격렬함 키워드
        intense_keywords = ["격정", "격렬", "열정", "강렬", "익스트림", "하드"]
        if any(k in t for k in intense_keywords):
            logger.info(f"[INTENT] ACTIVE 감지 (격렬함)")
            return "ACTIVE"

        # 2순위: 뇌/추리
        brain_words = ["머리", "머리쓰", "두뇌", "추리", "전략", "퍼즐", "퀴즈", "방탈출", "보드게임", "체스"]
        if any(w in t for w in brain_words):
            logger.info(f"[INTENT] BRAIN 감지")
            return "BRAIN"

        # 3순위: vibe 기반
        vibe = parsed_query.get("vibe", "")
        if vibe in ["격렬한", "활기찬", "에너지", "즐거운"]:
            logger.info(f"[INTENT] ACTIVE 감지 (vibe={vibe})")
            return "ACTIVE"

        # 4순위: 조용함
        quiet_words = ["조용", "쉬", "힐링", "편하게", "여유", "차분", "편안"]
        if any(w in t for w in quiet_words) or vibe in ["편안한", "여유로운", "조용한"]:
            logger.info(f"[INTENT] QUIET 감지")
            return "QUIET"

        # 5순위: 활동성
        active_words = ["러닝", "운동", "뛰", "배드민턴", "축구", "클라이밍"]
        if any(w in t for w in active_words):
            logger.info(f"[INTENT] ACTIVE 감지 (활동)")
            return "ACTIVE"

        # 6순위: 손으로 만들기
        hands_words = ["손으로", "공방", "diy", "만들기", "수공예", "캘리", "붓글씨", "그림", "도예"]
        if any(w in t for w in hands_words):
            logger.info(f"[INTENT] HANDS_ON 감지")
            return "HANDS_ON"

        logger.info(f"[INTENT] NEUTRAL (기본값)")
        return "NEUTRAL"