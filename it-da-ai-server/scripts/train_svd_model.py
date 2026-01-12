"""
SVD 협업 필터링 모델 학습
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.decomposition import TruncatedSVD

print("데이터 로딩...")
interactions = pd.read_csv('data/synthetic_interactions_nationwide.csv')

print(f"인터랙션: {len(interactions):,}개")

# User-Meeting 매트릭스 생성
print("\nUser-Meeting 매트릭스 생성...")
user_meeting_matrix = interactions.pivot_table(
    index='user_id',
    columns='meeting_id',
    values='rating',
    fill_value=0
)

print(f"매트릭스 크기: {user_meeting_matrix.shape}")
print(f"  사용자: {user_meeting_matrix.shape[0]:,}명")
print(f"  모임: {user_meeting_matrix.shape[1]:,}개")

# SVD 학습
print("\nSVD 학습...")
n_components = min(100, min(user_meeting_matrix.shape) - 1)  # ✅ 50 → 100
print(f"  Components: {n_components}개")

svd_model = TruncatedSVD(n_components=n_components, random_state=42)
svd_model.fit(user_meeting_matrix.values)

print(f"✅ SVD 학습 완료")
print(f"  Explained variance: {svd_model.explained_variance_ratio_.sum():.2%}")
print(f"  Components used: {n_components}/{min(user_meeting_matrix.shape)}")

# 모델 저장
print("\n모델 저장...")
with open('models/svd_model.pkl', 'wb') as f:
    pickle.dump(svd_model, f)

print("✅ SVD 모델 저장 완료: models/svd_model.pkl")

# 테스트
print("\n테스트...")
user_idx = 0
user_vector = user_meeting_matrix.iloc[user_idx].values
user_transformed = svd_model.transform([user_vector])
predictions = svd_model.inverse_transform(user_transformed)[0]

# 상위 5개 추천
participated = user_vector > 0
predictions[participated] = -np.inf
top_5_indices = np.argsort(predictions)[::-1][:5]
meeting_ids = user_meeting_matrix.columns.tolist()

print(f"\n사용자 {user_meeting_matrix.index[user_idx]} 추천 모임:")
for idx in top_5_indices:
    if predictions[idx] > -np.inf:
        print(f"  모임 {meeting_ids[idx]}: {predictions[idx]:.4f}")