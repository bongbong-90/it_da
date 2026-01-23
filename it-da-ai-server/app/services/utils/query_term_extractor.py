"""
Query Term Extractor
유저 프롬프트에서 검색 키워드 추출
"""

import re
from typing import List, Set
from app.core.logging import logger


class QueryTermExtractor:
    """쿼리 키워드 추출"""

    # 동의어 맵
    SYN_MAP = {
        # 스터디 계열
        "영어회화": ["영어", "회화", "스피킹"],
        "영어": ["영어", "회화", "스피킹"],
        "회화": ["회화", "스피킹"],
        "토익": ["토익"],
        "오픽": ["오픽"],
        "코딩": ["코딩", "개발", "프로그래밍"],
        "개발": ["개발", "코딩", "프로그래밍"],
        "프로그래밍": ["프로그래밍", "코딩", "개발"],
        "춤": ["춤", "댄스", "dance", "kpop", "케이팝", "방송댄스"],
        "댄스": ["댄스", "춤", "kpop", "케이팝", "방송댄스"],

        "붓글씨": ["붓글씨", "캘리", "캘리그라피", "서예"],
        "캘리그라피": ["캘리그라피", "캘리", "붓글씨", "서예"],

        "손으로": ["공방", "만들기", "diy", "캘리그라피", "그림", "도예", "가죽공예"],
        "diy": ["diy", "공방", "만들기", "도예", "가죽공예", "캘리그라피"],

        "공놀이": ["축구", "풋살", "농구", "배구", "배드민턴", "테니스"],
        "머리": ["보드게임", "방탈출", "체스", "퍼즐", "추리"],
        "머리쓰": ["보드게임", "방탈출", "체스", "퍼즐", "추리"],
        "두뇌": ["보드게임", "방탈출", "체스", "퍼즐", "추리"],
        "추리": ["방탈출", "추리", "미스터리", "보드게임"],
        "전략": ["보드게임", "체스", "전략"],

        "사진": ["사진", "촬영", "포토", "카메라", "스냅", "필카"],
        "포토": ["사진", "촬영", "포토", "카메라", "스냅", "필카"],
        "촬영": ["사진", "촬영", "포토", "카메라", "스냅", "필카"],

        "집중": ["스터디카페", "도서관", "열람실", "코워킹", "독서"],
        "공부": ["스터디카페", "도서관", "열람실", "코워킹"],
    }

    # 프롬프트 불용어
    PROMPT_STOP = {
        "모임", "스터디", "추천", "해줘", "해주세요", "같이", "할만한", "할", "하는", "원해", "싶어",
        "할수있는", "할수있", "가능한", "가능", "해볼만한", "할만한거", "만한거", "거", "것"
    }

    # 쿼리 키워드 불용어
    QUERY_TERM_STOP: Set[str] = {
        "실내", "실외", "야외", "밖", "인도어", "아웃도어",
        "즐겁게", "즐거운", "재밌게", "재밌는", "신나게", "신나는",
        "편하게", "편안하게", "여유롭게", "조용히", "힐링", "차분하게",
        "가볍게", "적당히", "그냥", "아무거나", "추천",
    }

    def extract(self, user_prompt: str, parsed_query: dict) -> List[str]:
        """
        유저 프롬프트에서 검색 키워드 추출

        Args:
            user_prompt: 유저 입력 원문
            parsed_query: 파싱된 쿼리

        Returns:
            추출된 키워드 리스트
        """
        p = (user_prompt or "").strip().lower()
        if not p:
            return []

        terms = []

        # 1) 붙어써도 잡히는 트리거
        triggers = ["사진", "촬영", "포토", "카메라", "필카", "스냅"]
        for t in triggers:
            if t in p and t not in terms:
                terms.append(t)

        # 2) SYN_MAP 스캔
        for k, syns in self.SYN_MAP.items():
            if k in p:
                for t in syns:
                    t2 = str(t).strip().lower()
                    if t2 and t2 not in self.QUERY_TERM_STOP and t2 not in terms:
                        terms.append(t2)

        # 3) 그래도 비었으면 토크나이징
        if not terms:
            toks = re.split(r"[\s,./!?()\-]+", p)
            toks = [self._normalize_term(t) for t in toks]
            toks = [t for t in toks if t and t not in self.PROMPT_STOP and len(t) >= 2]
            for t in toks:
                if t in self.QUERY_TERM_STOP:
                    continue
                if t not in terms:
                    terms.append(t)

        # 마지막 필터
        terms = [t for t in terms if t and t not in self.QUERY_TERM_STOP]

        logger.info(f"[QUERY_TERMS] prompt='{user_prompt}' -> terms={terms[:5]}")
        return terms[:5]

    def _normalize_term(self, t: str) -> str:
        """키워드 정규화"""
        t = t.strip().lower()
        t = re.sub(r"(관련(된|한)?|위주|중심|느낌|같은)$", "", t)
        t = re.sub(r"(에서|으로|로|말고|빼고|제외)$", "", t)
        return t