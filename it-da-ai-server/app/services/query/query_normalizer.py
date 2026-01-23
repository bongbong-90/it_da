"""
Query Normalizer
GPT 파싱 결과를 DB/Spring Enum 형식으로 정규화
"""

from typing import Optional
from app.core.logging import logger


class QueryNormalizer:
    """쿼리 정규화 - DB/Spring 호환 형식 변환"""

    # DB 유효 카테고리
    VALID_CATEGORIES = {
        "스포츠", "맛집", "카페", "문화예술", "스터디", "취미활동", "소셜"
    }

    # Subcategory → Category 매핑
    SUB_TO_CAT = {
        # 스포츠
        "러닝": "스포츠", "축구": "스포츠", "배드민턴": "스포츠", "등산": "스포츠",
        "요가": "스포츠", "사이클링": "스포츠", "클라이밍": "스포츠",

        # 맛집
        "한식": "맛집", "중식": "맛집", "일식": "맛집", "양식": "맛집",
        "이자카야": "맛집", "파인다이닝": "맛집",

        # 카페
        "카페투어": "카페", "브런치": "카페", "디저트": "카페",
        "베이커리": "카페", "티하우스": "카페",

        # 문화예술
        "전시회": "문화예술", "공연": "문화예술", "갤러리": "문화예술",
        "공방체험": "문화예술", "사진촬영": "문화예술", "버스킹": "문화예술",

        # 스터디
        "영어회화": "스터디", "독서토론": "스터디", "코딩": "스터디",
        "재테크": "스터디", "자격증": "스터디", "세미나": "스터디",

        # 취미활동
        "그림": "취미활동", "베이킹": "취미활동", "쿠킹": "취미활동",
        "플라워": "취미활동", "캘리그라피": "취미활동", "댄스": "취미활동",

        # 소셜
        "보드게임": "소셜", "방탈출": "소셜", "볼링": "소셜",
        "당구": "소셜", "노래방": "소셜", "와인바": "소셜",
    }

    def normalize_timeslot(self, ts: Optional[str]) -> Optional[str]:
        """시간대를 Spring Enum 형식으로 정규화"""
        if not ts:
            return None

        raw = str(ts).strip()

        # "MORNING,FLEXIBLE" 같은 값 → 첫 토큰만 사용
        if "," in raw:
            raw = raw.split(",")[0].strip()

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

    def normalize_vibe(self, v: Optional[str]) -> Optional[str]:
        """분위기를 표준 형식으로 정규화"""
        if not v:
            return None

        raw = str(v).strip().lower()

        mapping = {
            # 즐거운 계열
            "신나는": "즐거운",
            "재밌는": "즐거운",
            "즐거운": "즐거운",

            # 활기찬 계열
            "활기찬": "활기찬",
            "에너지": "활기찬",
            "에너지넘치는": "활기찬",

            # 여유로운 계열
            "편안한": "여유로운",
            "여유로운": "여유로운",
            "차분한": "여유로운",
            "조용한": "여유로운",

            # 기타
            "힐링": "힐링",
            "감성": "감성적인",
            "감성적인": "감성적인",
            "배움": "배움",
            "진지한": "진지한",
            "건강한": "건강한",
        }

        # 부분 포함도 커버
        for k, vv in mapping.items():
            if k in raw:
                return vv

        return v

    def normalize_location_type(self, lt: Optional[str]) -> Optional[str]:
        """장소 타입을 Spring Enum 형식으로 정규화"""
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

    def normalize_budget_type(self, bt: Optional[str]) -> str:
        """예산 타입을 모델 입력 형식으로 정규화"""
        if not bt:
            return "value"

        raw = str(bt).strip()

        mapping = {
            "VALUE": "value", "value": "value",
            "가성비": "value", "합리": "value",
            "QUALITY": "quality", "quality": "quality",
            "품질": "quality",
        }

        return mapping.get(raw, mapping.get(raw.upper(),
                                           mapping.get(raw.lower(), "value")))

    def normalize_taxonomy(self, q: dict) -> dict:
        """카테고리/서브카테고리를 DB 체계에 맞게 교정"""
        qq = dict(q)

        cat = (qq.get("category") or "").strip()
        sub = (qq.get("subcategory") or "").strip()

        # 1) subcategory가 있으면 그걸 기준으로 category 교정
        if sub:
            mapped = self.SUB_TO_CAT.get(sub)
            if mapped:
                qq["category"] = mapped
            else:
                qq.pop("subcategory", None)

        # 2) category 유효성 체크
        cat2 = (qq.get("category") or "").strip()
        if cat2 and cat2 not in self.VALID_CATEGORIES:
            qq.pop("category", None)
            logger.warning(f"[NORMALIZE] 유효하지 않은 category 제거: {cat2}")

        return qq

    def apply_vibe_prior(self, q: dict) -> dict:
        """vibe만 있고 category/keywords 없을 때 기본 category 설정"""
        cat = q.get("category")
        sub = q.get("subcategory")
        kws = q.get("keywords") or []
        vibe = self.normalize_vibe(q.get("vibe"))
        lt = (q.get("location_type") or "").upper()
        conf = float(q.get("confidence", 0) or 0)

        # vibe만 있고 다른 정보 없을 때
        if (not cat) and (not sub) and (len(kws) == 0) and vibe:
            if vibe in ["즐거운", "활기찬"]:
                q["category"] = "소셜"
                q["confidence"] = max(conf, 0.6)

            elif vibe in ["건강한"]:
                q["category"] = "스포츠"
                q["confidence"] = max(conf, 0.6)

            elif vibe in ["여유로운", "힐링", "감성적인"]:
                if lt == "OUTDOOR":
                    q["category"] = "문화예술"
                    q.pop("subcategory", None)
                else:
                    q["category"] = "카페"
                q["confidence"] = max(conf, 0.6)

        q["vibe"] = vibe
        return q