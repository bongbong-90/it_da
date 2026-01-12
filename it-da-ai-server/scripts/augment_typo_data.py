# scripts/augment_typo_data.py
"""
오타/신조어 데이터 증강
- 네이버 영화 리뷰 + 오타/신조어 변환
"""
import pandas as pd
import random
from typing import List

# 오타 패턴 정의
TYPO_PATTERNS = {
    # 자주 오타나는 패턴
    '재미있': ['제미있', '제미잇', '재밌', '잼있', '잼밋'],
    '재미없': ['재미엄', '제미업', '재미읎', '잼업'],
    '최고': ['쵝오', '최구', '쵝고', '최고임', '최곤데'],
    '별로': ['벌루', '별론데', '벌로'],
    '좋았': ['조왓', '조앗', '좋앗', '조핫'],
    '안좋': ['안조', '안좋은', '안조은'],
    '정말': ['짱말', '진짜', '정맘'],
    '대박': ['대빡', '대방'],
    '완전': ['완젼', '왼전'],
    '진짜': ['진쨔', '진짱'],
}

# 신조어 추가
SLANG_PATTERNS = {
    '재미있었다': ['꿀잼', '핵꿀잼', '개꿀잼', '레전드', '갓'],
    '재미없었다': ['노잼', '핵노잼', '개노잼', '쓰레기'],
    '좋았다': ['굿', '굳', '졸았다', '좋앗다'],
    '별로였다': ['별루였다', '벌로엿다', '별로엿다'],
}


def augment_with_typo(text: str, prob: float = 0.3) -> str:
    """텍스트에 오타 추가"""
    for original, typos in TYPO_PATTERNS.items():
        if original in text and random.random() < prob:
            typo = random.choice(typos)
            text = text.replace(original, typo, 1)
    return text


def augment_with_slang(text: str, prob: float = 0.2) -> str:
    """텍스트에 신조어 추가"""
    for original, slangs in SLANG_PATTERNS.items():
        if original in text and random.random() < prob:
            slang = random.choice(slangs)
            text = text.replace(original, slang, 1)
    return text


def create_augmented_dataset(
        input_file: str,
        output_file: str,
        augment_ratio: float = 0.3
):
    """
    오타/신조어 데이터 증강

    Args:
        input_file: 원본 NSMC 데이터 (ratings_train.txt)
        output_file: 증강 데이터 저장 경로
        augment_ratio: 증강 비율 (0.3 = 30% 증강)
    """
    print("=" * 70)
    print("📊 오타/신조어 데이터 증강")
    print("=" * 70)

    # 원본 데이터 로드
    df = pd.read_csv(input_file, sep="\t")
    df = df.dropna()

    print(f"\n원본 데이터: {len(df):,}개")

    # 증강할 샘플 수
    n_augment = int(len(df) * augment_ratio)

    # 랜덤 샘플링
    augment_df = df.sample(n=n_augment, random_state=42)

    # 오타/신조어 적용
    augmented_texts = []
    for text in augment_df['document']:
        # 50% 확률로 오타, 50% 확률로 신조어
        if random.random() < 0.5:
            aug_text = augment_with_typo(text)
        else:
            aug_text = augment_with_slang(text)
        augmented_texts.append(aug_text)

    augment_df['document'] = augmented_texts

    # 원본 + 증강 데이터 결합
    combined_df = pd.concat([df, augment_df], ignore_index=True)

    # 셔플
    combined_df = combined_df.sample(frac=1, random_state=42).reset_index(drop=True)

    # 저장
    combined_df.to_csv(output_file, sep="\t", index=False)

    print(f"\n✅ 증강 완료!")
    print(f"   원본: {len(df):,}개")
    print(f"   증강: {n_augment:,}개")
    print(f"   전체: {len(combined_df):,}개")
    print(f"   저장: {output_file}")

    # 샘플 확인
    print("\n📋 증강 샘플:")
    for i, row in augment_df.head(5).iterrows():
        print(f"  {row['document']} (label={row['label']})")


if __name__ == "__main__":
    create_augmented_dataset(
        input_file="data/nsmc/ratings_train.txt",
        output_file="data/nsmc/ratings_train_augmented.txt",
        augment_ratio=0.3  # 30% 증강
    )