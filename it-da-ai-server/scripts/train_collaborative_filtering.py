"""
아이템 기반 협업 필터링 (Cosine Similarity)
희소 행렬에서도 잘 작동
"""

import pandas as pd
import numpy as np
import pickle
from sklearn.metrics.pairwise import cosine_similarity

print("데이터 로딩...")
interactions = pd.read_csv('data/synthetic_interactions_nationwide.csv')
users = pd.read_csv('data/synthetic_users_nationwide.csv')
meetings = pd.read_csv('data/synthetic_meetings_nationwide.csv')

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
print(f"  밀도: {(interactions.shape[0] / (user_meeting_matrix.shape[0] * user_meeting_matrix.shape[1])):.2%}")

# 사용자 통계
print("\n사용자 통계 계산...")
user_stats = interactions.groupby('user_id').agg({
    'rating': ['mean', 'count']
}).reset_index()
user_stats.columns = ['user_id', 'avg_rating', 'rating_count']

# 모임 통계
print("모임 통계 계산...")
meeting_stats = interactions.groupby('meeting_id').agg({
    'rating': ['mean', 'count']
}).reset_index()
meeting_stats.columns = ['meeting_id', 'avg_rating', 'rating_count']

# 아이템 유사도 계산 (모임 간 유사도)
print("\n모임 간 유사도 계산 (코사인)...")
# 전치: (모임, 사용자)
meeting_user_matrix = user_meeting_matrix.T

# 코사인 유사도
meeting_similarity = cosine_similarity(meeting_user_matrix)
meeting_similarity_df = pd.DataFrame(
    meeting_similarity,
    index=meeting_user_matrix.index,
    columns=meeting_user_matrix.index
)

print(f"✅ 유사도 계산 완료: {meeting_similarity_df.shape}")

# 모델 저장
print("\n모델 저장...")
model_data = {
    'user_meeting_matrix': user_meeting_matrix,
    'meeting_similarity': meeting_similarity_df,
    'user_stats': user_stats,
    'meeting_stats': meeting_stats,
    'user_ids': user_meeting_matrix.index.tolist(),
    'meeting_ids': user_meeting_matrix.columns.tolist()
}

with open('models/svd_model.pkl', 'wb') as f:
    pickle.dump(model_data, f)

print("✅ 협업 필터링 모델 저장 완료: models/svd_model.pkl")

# 테스트
print("\n" + "=" * 70)
print("테스트: 추천 및 예측")
print("=" * 70)

test_user_id = 1
if test_user_id in user_meeting_matrix.index:
    print(f"\n사용자 {test_user_id} 추천:")

    # 사용자가 평가한 모임
    user_ratings = user_meeting_matrix.loc[test_user_id]
    rated_meetings = user_ratings[user_ratings > 0]

    if len(rated_meetings) > 0:
        print(f"  평가한 모임: {len(rated_meetings)}개")

        # 추천 점수 계산
        scores = {}
        for meeting_id in user_meeting_matrix.columns:
            if user_ratings[meeting_id] == 0:  # 미평가 모임만
                # 유사한 모임들의 평점 가중 평균
                similar_meetings = rated_meetings.index
                similarities = meeting_similarity_df.loc[meeting_id, similar_meetings]

                # 상위 10개 유사 모임만 사용
                top_similar = similarities.nlargest(10)

                if len(top_similar) > 0 and top_similar.sum() > 0:
                    weighted_sum = sum(
                        top_similar[sim_meeting] * rated_meetings[sim_meeting]
                        for sim_meeting in top_similar.index
                    )
                    sim_sum = top_similar.sum()
                    predicted_rating = weighted_sum / sim_sum

                    # 모임 평균 평점 반영 (가중 평균)
                    meeting_avg = meeting_stats[meeting_stats['meeting_id'] == meeting_id]['avg_rating'].values
                    if len(meeting_avg) > 0:
                        predicted_rating = 0.7 * predicted_rating + 0.3 * meeting_avg[0]

                    scores[meeting_id] = predicted_rating

        # 상위 10개 추천
        if scores:
            top_10 = sorted(scores.items(), key=lambda x: x[1], reverse=True)[:10]

            print(f"\n추천 모임 Top 10:")
            for rank, (meeting_id, score) in enumerate(top_10, 1):
                meeting_info = meetings[meetings['meeting_id'] == meeting_id]
                if len(meeting_info) > 0:
                    category = meeting_info['category'].values[0]
                    avg_rating = meeting_stats[meeting_stats['meeting_id'] == meeting_id]['avg_rating'].values[0]
                    print(f"  {rank}. 모임 {meeting_id} [{category}]: 예측 {score:.2f} (평균 {avg_rating:.2f})")
                else:
                    print(f"  {rank}. 모임 {meeting_id}: 예측 {score:.2f}")
        else:
            print("  추천할 모임 없음")

    # 실제 평점과 예측 비교
    print(f"\n실제 평점 vs 예측 (이미 평가한 모임):")
    sample_rated = rated_meetings.head(5)

    for meeting_id in sample_rated.index:
        actual = rated_meetings[meeting_id]

        # 예측 (Leave-One-Out)
        other_rated = rated_meetings.drop(meeting_id)
        if len(other_rated) > 0:
            similarities = meeting_similarity_df.loc[meeting_id, other_rated.index]
            top_similar = similarities.nlargest(10)

            if top_similar.sum() > 0:
                weighted_sum = sum(
                    top_similar[sim_meeting] * other_rated[sim_meeting]
                    for sim_meeting in top_similar.index
                )
                predicted = weighted_sum / top_similar.sum()

                meeting_avg = meeting_stats[meeting_stats['meeting_id'] == meeting_id]['avg_rating'].values
                if len(meeting_avg) > 0:
                    predicted = 0.7 * predicted + 0.3 * meeting_avg[0]

                print(f"  모임 {meeting_id}: 실제 {actual:.1f}, 예측 {predicted:.2f}, 차이 {abs(actual - predicted):.2f}")

print("\n" + "=" * 70)
print("✅ 완료!")
print("=" * 70)