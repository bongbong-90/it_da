# app/services/meeting_analyzer_service.py

from typing import List
import json
import re

from openai import AsyncOpenAI  # ✅ openai>=1.0.0
from app.core.config import settings
from app.core.logging import logger


class MeetingAnalyzerService:
    """모임 제목/설명을 분석하여 장소 키워드 추출"""

    SUBCATEGORY_KEYWORDS = {
        "방탈출": ["방탈출", "방탈출카페", "이스케이프룸", "escape room"],
        "보드게임": ["보드게임카페", "보드게임"],
        "볼링": ["볼링장"],
        "당구": ["당구장"],
    }

    CATEGORY_KEYWORDS = {
        "소셜": ["방탈출", "보드게임카페", "볼링장"],
        "스포츠": ["운동장", "공원", "체육관"],
        "카페": ["카페", "브런치카페"],
        "맛집": ["맛집", "식당"],
        "스터디": ["스터디룸", "카페"],
        "취미활동": ["공방", "클래스"],
        "문화예술": ["전시회", "공연장"],
    }

    def __init__(self):
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.gpt_enabled = True
            logger.info("✅ OpenAI GPT 활성화됨")
        else:
            self.client = None
            self.gpt_enabled = False
            logger.warning("⚠️ OPENAI_API_KEY가 설정되지 않아 규칙 기반 키워드 추출을 사용합니다")

    def _build_search_keywords(self, category: str, subcategory: str | None, title: str = "", description: str = "") -> \
    List[str]:
        category = (category or "").strip()
        subcategory = (subcategory or "").strip()

        if subcategory and subcategory in self.SUBCATEGORY_KEYWORDS:
            return self.SUBCATEGORY_KEYWORDS[subcategory]

        if category and category in self.CATEGORY_KEYWORDS:
            return self.CATEGORY_KEYWORDS[category]

        # 제목/설명 최소 보정
        text = f"{title} {description}".lower()
        if "방탈출" in text:
            return self.SUBCATEGORY_KEYWORDS["방탈출"]
        if "보드" in text:
            return self.SUBCATEGORY_KEYWORDS["보드게임"]

        # ✅ 여기: 최후 fallback도 카테고리별로
        default_by_category = {
            "소셜": ["방탈출", "보드게임카페", "볼링장"],
            "스포츠": ["운동장", "공원", "체육관"],
            "카페": ["카페", "브런치카페"],
            "맛집": ["맛집", "식당"],
            "스터디": ["스터디룸", "도서관", "카페"],
            "취미활동": ["공방", "클래스"],
            "문화예술": ["전시회", "공연장"],
        }
        return default_by_category.get(category, ["카페"])

    async def extract_place_keywords(
            self,
            meeting_title: str,
            meeting_description: str = "",
            category: str = "",
            subcategory: str | None = None,
    ) -> List[str]:

        subcategory = (subcategory or "").strip()
        category = (category or "").strip()
        title_lower = (meeting_title or "").lower()  # ✅ 제목 소문자화

        # ✅ 0) 제목 기반 직접 매칭 (가장 우선)
        title_keywords = self._extract_keywords_from_title(title_lower)
        if title_keywords:
            logger.info(f"📌 제목 기반 키워드(우선): {title_keywords}")
            return title_keywords[:3]

        # ✅ 1) 서브카테고리 있으면 GPT 우회
        if subcategory and subcategory in self.SUBCATEGORY_KEYWORDS:
            kws = self._build_search_keywords(category, subcategory, meeting_title, meeting_description)
            logger.info(f"📌 서브카테고리 기반 키워드(고정): {kws}")
            return kws[:3]

        # ✅ 2) GPT 비활성화면 규칙 기반
        if not self.gpt_enabled:
            logger.info("📌 규칙 기반 키워드 추출 사용")
            return self._extract_keywords_by_rules(meeting_title, category, subcategory)

        # ✅ 3) GPT 사용하되 seed로 범위 제한
        seed = self._build_search_keywords(category, subcategory, meeting_title, meeting_description)

        try:
            prompt = self._build_keyword_extraction_prompt(
                meeting_title,
                meeting_description,
                category,
                subcategory,
                seed,
            )

            resp = await self.client.chat.completions.create(
                model="gpt-4o-mini",
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "너는 모임 성격을 분석해 장소 검색용 키워드를 뽑는 전문가야. "
                            "반드시 JSON 배열만 출력해. 예: [\"러닝트랙\",\"한강공원\",\"운동장\"]."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.2,
                max_tokens=120,
            )

            text = (resp.choices[0].message.content or "").strip()
            keywords = self._parse_keywords(text)

            seed_norm_list = [self._normalize(x) for x in seed]

            ALIASES = {
                "방탈출": ["이스케이프", "escaperoom", "escape", "룸"],
                "보드게임카페": ["보드카페", "보드게임"],
            }

            def in_seed(k: str) -> bool:
                nk = self._normalize(k)
                # seed 직접 매칭
                if any(nk == s or nk in s or s in nk for s in seed_norm_list):
                    return True
                # alias 매칭
                for base, al in ALIASES.items():
                    if self._normalize(base) in seed_norm_list:
                        if any(self._normalize(a) in nk for a in al):
                            return True
                return False

            keywords = [k for k in keywords if in_seed(k)]
            if not keywords:
                keywords = seed[:]

            if not keywords:
                raise ValueError(f"Empty keywords from GPT. raw={text[:200]}")

            keywords = self._post_filter_keywords(keywords, meeting_title, category)

            logger.info(f"✅ GPT 키워드 추출: {keywords}")
            return keywords[:3]

        except Exception as e:
            logger.error(f"❌ GPT 키워드 추출 실패, 규칙 기반 사용: {e}")
            return self._extract_keywords_by_rules(meeting_title, category, subcategory)

    def _parse_keywords(self, raw: str) -> List[str]:
        """GPT 출력 파싱: JSON 배열 우선, 실패 시 콤마/줄바꿈/불릿 파싱"""
        if not raw:
            return []

        # 1) JSON 배열 시도
        try:
            data = json.loads(raw)
            if isinstance(data, list):
                return [str(x).strip() for x in data if str(x).strip()]
        except Exception:
            pass

        # 2) 코드펜스 제거 (```json ... ``` 같은)
        cleaned = re.sub(r"^```[a-zA-Z]*\s*|\s*```$", "", raw).strip()

        # 3) 불릿/줄바꿈/콤마 분해
        parts = re.split(r"[,/\n\r•\-]+", cleaned)
        kws = []
        for p in parts:
            k = p.strip().strip('"').strip("'")
            if k:
                kws.append(k)

        # 중복 제거
        uniq = []
        for k in kws:
            if k not in uniq:
                uniq.append(k)
        return uniq

    def _post_filter_keywords(self, keywords: List[str], title: str, category: str) -> List[str]:
        """너무 범용 키워드/모임과 안 맞는 키워드를 약간 보정"""
        t = (title or "").lower()
        c = (category or "").lower()

        # 러닝/조깅이면 우선순위를 러닝 계열로 강제
        if any(k in t for k in ["러닝", "런닝", "조깅", "마라톤"]) or "운동" in c:
            prefer = ["러닝트랙", "운동장", "한강공원", "체육공원", "트랙", "러닝코스"]
            # GPT 결과에 없으면 앞에 채워넣기
            merged = []
            for p in prefer:
                if p not in merged:
                    merged.append(p)
            for k in keywords:
                if k not in merged:
                    merged.append(k)

            # “카페/식당”은 러닝에서는 후순위로 밀기
            deprioritized = ["카페", "식당", "맛집"]
            merged_sorted = [k for k in merged if k not in deprioritized] + [k for k in merged if k in deprioritized]
            return merged_sorted

        return keywords

    def _extract_keywords_by_rules(self, title: str, category: str, subcategory: str | None = None) -> List[str]:
        """규칙 기반 키워드 추출 (GPT 대체)"""
        if subcategory and subcategory in self.SUBCATEGORY_KEYWORDS:
            return self.SUBCATEGORY_KEYWORDS[subcategory][:3]

        title_lower = (title or "").lower()
        category_lower = (category or "").lower()

        priority_keywords = []

        if any(k in title_lower for k in ["러닝", "런닝", "조깅", "마라톤"]):
            priority_keywords += ["러닝트랙", "한강공원", "운동장"]

        if "커피" in title_lower or "카페" in title_lower:
            priority_keywords.append("카페")
        if any(k in title_lower for k in ["공원", "산책", "야외"]):
            priority_keywords.append("공원")
        if any(k in title_lower for k in ["술", "맥주", "소주"]):
            priority_keywords.append("술집")
        if any(k in title_lower for k in ["운동", "헬스", "피트니스"]):
            priority_keywords.append("헬스장")
        if any(k in title_lower for k in ["밥", "식사", "저녁"]):
            priority_keywords.append("맛집")
        if "스터디" in title_lower or "공부" in title_lower:
            priority_keywords.append("스터디룸")

        category_defaults = self._get_default_keywords(category)

        all_keywords = priority_keywords + category_defaults
        unique_keywords = []
        for kw in all_keywords:
            if kw not in unique_keywords:
                unique_keywords.append(kw)

        return unique_keywords[:3]

    def _build_keyword_extraction_prompt(self, title: str, description: str, category: str, subcategory: str | None,
                                         seed: List[str]) -> str:
        return f"""
    다음 모임 정보를 분석해서 "장소 검색에 쓸 키워드"를 1~3개 뽑아줘.
    반드시 JSON 배열 형식으로만 출력해.

    모임 제목: {title}
    모임 설명: {description or "없음"}
    카테고리: {category or "없음"}
    서브카테고리: {subcategory or "없음"}

    중요: 아래 seed 키워드 범위에서 벗어나지 말 것 (동의어/유사어는 가능)
    seed: {seed}

    조건:
    - 실제 지도/장소 검색에 쓸 수 있는 단어여야 함
    - 너무 추상적이면 안 됨
    """.strip()

    def _get_default_keywords(self, category: str) -> List[str]:
        defaults = {
            "음식": ["맛집", "카페", "식당"],
            "문화": ["전시장", "카페", "공원"],
            "운동": ["운동장", "러닝트랙", "공원"],  # ✅ 러닝트랙 추가
            "스터디": ["스터디룸", "도서관", "카페"],
            "게임": ["PC방", "보드게임카페", "오락실"],
            "음주": ["술집", "포차", "바"],
            "야외": ["한강공원", "공원", "산책로"],  # ✅ 한강공원 우선
        }
        return defaults.get(category, ["카페", "공원", "식당"])

    def _normalize(self, s: str) -> str:
        return re.sub(r"\s+", "", (s or "").lower())

    def _extract_keywords_from_title(self, title_lower: str) -> List[str]:
        """
        제목에서 직접 키워드 추출 (GPT보다 우선)
        카테고리별로 세분화된 매칭
        """

        # ==================== 스포츠 ====================
        if any(k in title_lower for k in ["러닝", "런닝", "조깅", "마라톤", "running"]):
            return ["러닝트랙", "한강공원", "운동장"]

        if any(k in title_lower for k in ["축구", "football", "soccer"]):
            return ["축구장", "운동장", "풋살장"]

        if any(k in title_lower for k in ["배드민턴", "badminton"]):
            return ["배드민턴장", "체육관"]

        if any(k in title_lower for k in ["등산", "산", "hiking", "트레킹"]):
            return ["등산로", "산", "공원"]

        if any(k in title_lower for k in ["요가", "yoga", "필라테스"]):
            return ["요가원", "필라테스", "헬스장"]

        if any(k in title_lower for k in ["사이클", "자전거", "bike", "cycling"]):
            return ["자전거도로", "한강공원", "공원"]

        # ==================== 맛집 ====================
        if any(k in title_lower for k in ["한식", "한정식", "고기", "삼겹살", "찌개"]):
            return ["한식", "고깃집", "맛집"]

        if any(k in title_lower for k in ["중식", "중국집", "짜장", "짬뽕", "탕수육"]):
            return ["중식당", "중국집"]

        if any(k in title_lower for k in ["일식", "초밥", "라멘", "돈까스", "스시"]):
            return ["일식당", "초밥집", "라멘"]

        if any(k in title_lower for k in ["양식", "스테이크", "파스타", "피자"]):
            return ["양식당", "이탈리안", "레스토랑"]

        if any(k in title_lower for k in ["이자카야", "선술집", "사케"]):
            return ["이자카야", "일본선술집"]

        # 일반 식사 키워드
        if any(k in title_lower for k in ["밥", "식사", "저녁", "점심", "dinner", "lunch", "맛집"]):
            return ["맛집", "식당", "레스토랑"]

        # ==================== 카페 ====================
        if any(k in title_lower for k in ["카페투어", "투어"]):
            return ["카페", "브런치카페", "디저트카페"]

        if any(k in title_lower for k in ["브런치", "brunch"]):
            return ["브런치카페", "카페"]

        if any(k in title_lower for k in ["디저트", "케이크", "마카롱"]):
            return ["디저트카페", "베이커리"]

        if any(k in title_lower for k in ["베이커리", "빵", "bread"]):
            return ["베이커리", "제과점"]

        if any(k in title_lower for k in ["카페", "커피", "coffee", "cafe"]):
            return ["카페", "커피전문점"]

        # ==================== 문화예술 ====================
        if any(k in title_lower for k in ["전시", "전시회", "미술", "exhibition"]):
            return ["미술관", "갤러리", "전시장"]

        if any(k in title_lower for k in ["공연", "연극", "뮤지컬", "콘서트"]):
            return ["공연장", "극장", "아트센터"]

        if any(k in title_lower for k in ["갤러리", "gallery", "아트"]):
            return ["갤러리", "미술관"]

        if any(k in title_lower for k in ["공방", "도예", "체험"]):
            return ["공방", "체험공방", "작업실"]

        # ==================== 스터디 ====================
        if any(k in title_lower for k in ["영어", "영어회화", "english", "토익", "토플"]):
            return ["스터디룸", "카페", "영어카페"]

        if any(k in title_lower for k in ["독서", "책", "book", "reading"]):
            return ["도서관", "북카페", "스터디룸"]

        if any(k in title_lower for k in ["코딩", "프로그래밍", "개발", "coding", "programming"]):
            return ["스터디카페", "코워킹스페이스"]

        if any(k in title_lower for k in ["재테크", "투자", "주식"]):
            return ["스터디룸", "카페", "세미나실"]

        if any(k in title_lower for k in ["스터디", "공부", "study"]):
            return ["스터디룸", "스터디카페", "도서관"]

        # ==================== 취미활동 ====================
        if any(k in title_lower for k in ["그림", "드로잉", "drawing", "painting"]):
            return ["공방", "미술학원", "드로잉카페"]

        if any(k in title_lower for k in ["베이킹", "baking", "제빵"]):
            return ["베이킹클래스", "쿠킹스튜디오"]

        if any(k in title_lower for k in ["쿠킹", "요리", "cooking"]):
            return ["쿠킹클래스", "요리학원"]

        if any(k in title_lower for k in ["플라워", "꽃", "flower", "플로리스트"]):
            return ["플라워샵", "플라워클래스"]

        # ==================== 소셜 ====================
        if any(k in title_lower for k in ["보드", "보드게임", "board"]):
            return ["보드게임카페", "보드카페"]

        if any(k in title_lower for k in ["방탈출", "이스케이프", "escape"]):
            return ["방탈출", "방탈출카페"]

        if "볼링" in title_lower:
            return ["볼링장"]

        if any(k in title_lower for k in ["당구", "billiard", "pool"]):
            return ["당구장"]

        # ==================== 기타 ====================
        if any(k in title_lower for k in ["노래", "노래방", "코인노래방", "singing", "karaoke"]):
            return ["노래방", "코인노래방"]

        if any(k in title_lower for k in ["술", "맥주", "소주", "와인", "칵테일", "bar"]):
            return ["술집", "호프집", "바"]

        if any(k in title_lower for k in ["공원", "산책", "야외", "피크닉"]):
            return ["공원", "한강공원"]

        return []  # 매칭 없으면 빈 리스트

