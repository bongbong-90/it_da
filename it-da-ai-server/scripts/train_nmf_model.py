"""
NMF (Non-negative Matrix Factorization) 기반 추천
평점 예측에 더 적합
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.decomposition import NMF

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
print(f"  밀도: {(interactions.shape[0] / (user_meeting_matrix.shape[0] * user_meeting_matrix.shape[1])):.2%}")

# NMF 학습
print("\nNMF 학습...")
n_components = 50
print(f"  Components: {n_components}개")

nmf_model = NMF(
    n_components=n_components,
    init='nndsvd',
    max_iter=500,
    random_state=42
)

W = nmf_model.fit_transform(user_meeting_matrix.values)
H = nmf_model.components_

print(f"✅ NMF 학습 완료")
print(f"  Reconstruction error: {nmf_model.reconstruction_err_:.4f}")

# 예측 매트릭스
predictions = np.dot(W, H)

# 모델 저장
print("\n모델 저장...")
model_data = {
    'model': nmf_model,
    'user_ids': user_meeting_matrix.index.tolist(),
    'meeting_ids': user_meeting_matrix.columns.tolist(),
    'W': W,
    'H': H
}

with open('models/nmf_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✅ NMF 모델 저장 완료: models/nmf_model.pkl")

# 테스트
print("\n테스트...")
user_idx = 0
user_vector = user_meeting_matrix.iloc[user_idx].values
user_predictions = predictions[user_idx]

# 이미 참여한 모임 제외
participated = user_vector > 0
user_predictions_copy = user_predictions.copy()
user_predictions_copy[participated] = -np.inf

# 상위 5개 추천
top_5_indices = np.argsort(user_predictions_copy)[::-1][:5]
meeting_ids = user_meeting_matrix.columns.tolist()

print(f"\n사용자 {user_meeting_matrix.index[user_idx]} 추천 모임 (NMF):")
for idx in top_5_indices:
    if user_predictions_copy[idx] > -np.inf:
        print(f"  모임 {meeting_ids[idx]}: {user_predictions[idx]:.4f}")

# 실제 평점과 비교
print("\n실제 평점과 비교:")
user_actual = interactions[interactions['user_id'] == user_meeting_matrix.index[user_idx]]
if len(user_actual) > 0:
    sample = user_actual.head(5)
    for _, row in sample.iterrows():
        meeting_idx = meeting_ids.index(row['meeting_id'])
        pred = predictions[user_idx, meeting_idx]
        print(f"  모임 {row['meeting_id']}: 실제 {row['rating']:.1f}, 예측 {pred:.2f}")