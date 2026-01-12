# app/services/text_corrector.py
"""
한국어 맞춤법 교정기
- py-hanspell 사용
"""
from typing import Optional
import re


class TextCorrector:
    def __init__(self):
        try:
            from hanspell import spell_checker
            self.spell_checker = spell_checker
            self.available = True
        except ImportError:
            print("⚠️ hanspell 패키지 없음 (pip install py-hanspell)")
            self.available = False

    def correct(self, text: str) -> str:
        """맞춤법 교정"""
        if not self.available:
            return text

        try:
            # py-hanspell로 교정
            result = self.spell_checker.check(text)
            return result.checked
        except Exception as e:
            print(f"⚠️ 교정 실패: {e}")
            return text

    def normalize(self, text: str) -> str:
        """
        신조어/오타 정규화 (사전 기반)
        """
        # 간단한 신조어 변환
        replacements = {
            '꿀잼': '재미있다',
            '핵꿀잼': '매우 재미있다',
            '개꿀잼': '매우 재미있다',
            '노잼': '재미없다',
            '핵노잼': '매우 재미없다',
            '레전드': '최고',
            '갓': '최고',
            '쵝오': '최고',
            '굿': '좋다',
            '굳': '좋다',
            '제미있': '재미있',
            '제미없': '재미없',
            '벌루': '별로',
            '조왓': '좋았',
        }

        for slang, standard in replacements.items():
            text = text.replace(slang, standard)

        return text

    def preprocess(self, text: str, correct: bool = False) -> str:
        """
        전처리 파이프라인

        Args:
            text: 입력 텍스트
            correct: 맞춤법 교정 여부 (느림, API 호출)
        """
        # 1. 신조어 정규화
        text = self.normalize(text)

        # 2. 맞춤법 교정 (선택)
        if correct and self.available:
            text = self.correct(text)

        return text


# 싱글톤 인스턴스
text_corrector = TextCorrector()