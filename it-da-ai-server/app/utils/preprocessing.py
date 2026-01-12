# app/utils/preprocessing.py
def normalize_text(text: str) -> str:
    """텍스트 정규화"""
    import re
    text = re.sub(r'[^\w\s가-힣]', '', text)
    text = re.sub(r'\s+', ' ', text)
    return text.strip()

def extract_keywords(text: str, top_n: int = 5) -> list:
    """간단한 키워드 추출"""
    words = text.split()
    # 실제로는 형태소 분석 필요
    return words[:top_n]