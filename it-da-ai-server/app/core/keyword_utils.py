import re

# ❌ 검색에 의미 없는 불용어 (한국어 추천형 문장 대응)
STOPWORDS = {
    "회사", "퇴근", "끝나고", "갈만한곳", "갈만한", "추천", "뭐하지", "뭐할까",
    "할만한", "있을까", "모임", "사람", "같이", "근처", "주변",
    "오늘", "요즘", "그냥", "아무거나", "어디",
}

# ❌ 너무 짧거나 추상적인 토큰
MIN_LENGTH = 2

def clean_keywords(
    raw_keywords: list[str] | None,
    *,
    max_keywords: int = 5
) -> list[str]:
    """
    GPT가 뱉은 keywords를
    - 불용어 제거
    - 짧은 토큰 제거
    - 중복 제거
    - 의미 있는 키워드만 반환
    """

    if not raw_keywords:
        return []

    cleaned = []

    for kw in raw_keywords:
        if not kw:
            continue

        k = kw.strip().lower()

        # 특수문자 제거
        k = re.sub(r"[^\w가-힣]", "", k)

        if len(k) < MIN_LENGTH:
            continue

        if k in STOPWORDS:
            continue

        cleaned.append(k)

    # 중복 제거 (순서 유지)
    seen = set()
    uniq = []
    for k in cleaned:
        if k not in seen:
            seen.add(k)
            uniq.append(k)

    return uniq[:max_keywords]
