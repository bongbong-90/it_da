# scripts/download_nsmc.py
"""
네이버 영화 리뷰 감성 분류 데이터셋 (NSMC) 다운로드
- 학습: 150,000개
- 테스트: 50,000개
- 긍정/부정 2-class
"""
import os
import urllib.request
import zipfile

print("📥 네이버 영화 리뷰 데이터셋 다운로드 중...")

# 데이터 폴더 생성
os.makedirs("data/nsmc", exist_ok=True)

# 다운로드 URL
urls = {
    "train": "https://raw.githubusercontent.com/e9t/nsmc/master/ratings_train.txt",
    "test": "https://raw.githubusercontent.com/e9t/nsmc/master/ratings_test.txt"
}

# 다운로드
for split, url in urls.items():
    output_path = f"data/nsmc/ratings_{split}.txt"

    if os.path.exists(output_path):
        print(f"✅ {split} 데이터 이미 존재: {output_path}")
    else:
        print(f"⏬ {split} 다운로드 중...")
        urllib.request.urlretrieve(url, output_path)
        print(f"✅ {split} 다운로드 완료: {output_path}")

print("\n✅ 데이터셋 다운로드 완료!")
print("   data/nsmc/ratings_train.txt (150,000개)")
print("   data/nsmc/ratings_test.txt (50,000개)")