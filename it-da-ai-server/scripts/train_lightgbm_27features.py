"""
실제 synthetic 데이터로 LightGBM Ranker 학습
FeatureBuilder와 동일한 27개 특징 사용
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
import pickle
import math

# ========================================
# FeatureBuilder와 동일한 로직
# ========================================

def haversine_distance(lat1, lng1, lat2, lng2):
    """Haversine 거리 계산"""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_interest_match(user_interests, meeting_category):
    """관심사 매칭"""
    if pd.isna(user_interests) or pd.isna(meeting_category):
        return 0.0
    user_keywords = set(str(user_interests).lower().split(", "))
    meeting_keywords = set(str(meeting_category).lower().split())
    if len(user_keywords) == 0:
        return 0.0
    match_count = len(user_keywords & meeting_keywords)
    return match_count / len(user_keywords)

def calculate_cost_match(user_budget_type, meeting_cost):
    """비용 매칭"""
    cost_ranges = {
        "low": (0, 10000),
        "value": (10000, 30000),
        "medium": (30000, 50000),
        "high": (50000, 100000),
        "premium": (100000, float('inf'))
    }
    if user_budget_type not in cost_ranges:
        return 0.5
    min_cost, max_cost = cost_ranges[user_budget_type]
    if min_cost <= meeting_cost <= max_cost:
        return 1.0
    elif meeting_cost < min_cost:
        diff = min_cost - meeting_cost
        return max(0.0, 1.0 - diff / min_cost)
    else:
        diff = meeting_cost - max_cost
        return max(0.0, 1.0 - diff / max_cost)

# ========================================
# 데이터 로딩
# ========================================

print("데이터 로딩...")
interactions = pd.read_csv('data/synthetic_interactions_nationwide.csv')
users = pd.read_csv('data/synthetic_users_nationwide.csv')
meetings = pd.read_csv('data/synthetic_meetings_nationwide.csv')

print(f"인터랙션: {len(interactions):,}개")
print(f"사용자: {len(users):,}명")
print(f"모임: {len(meetings):,}개")

# ========================================
# 특징 생성 (FeatureBuilder와 동일)
# ========================================

print("\n특징 생성 (27개)...")

# 사용자별 통계
user_stats = interactions.groupby('user_id').agg({
    'rating': ['mean', 'std', 'count']
}).reset_index()
user_stats.columns = ['user_id', 'user_avg_rating', 'user_rating_std', 'user_meeting_count']
user_stats['user_rating_std'] = user_stats['user_rating_std'].fillna(0.3)

# 모임별 통계
meeting_stats = interactions.groupby('meeting_id').agg({
    'rating': ['mean', 'count'],
    'user_id': 'count'
}).reset_index()
meeting_stats.columns = ['meeting_id', 'meeting_avg_rating', 'meeting_rating_count', 'meeting_participant_count']

# 데이터 병합
data = interactions.merge(users, on='user_id', how='left')
data = data.merge(meetings, on='meeting_id', how='left')
data = data.merge(user_stats, on='user_id', how='left')
data = data.merge(meeting_stats, on='meeting_id', how='left')

# 특징 계산
features = []

for idx, row in data.iterrows():
    if idx % 1000 == 0:
        print(f"  처리 중: {idx:,}/{len(data):,}")

    # 1-12: 기본 특징
    distance_km = haversine_distance(
        row.get('user_lat', 37.5), row.get('user_lng', 127.0),
        row.get('meeting_lat', 37.5), row.get('meeting_lng', 127.0)
    )
    time_match = 1.0 if row.get('time_preference') == row.get('time_slot') else 0.0
    location_type_match = 1.0 if row.get('location_preference') == row.get('location_type') else 0.0
    interest_match = calculate_interest_match(row.get('interests'), row.get('category'))
    cost_match = calculate_cost_match(row.get('budget_type', 'value'), row.get('expected_cost', 20000))

    feat = [
        distance_km,
        time_match,
        location_type_match,
        interest_match,
        cost_match,
        row.get('user_avg_rating', 3.0),
        row.get('user_meeting_count', 0),
        row.get('user_rating_std', 0.3),
        row.get('meeting_avg_rating', 3.0),
        row.get('meeting_rating_count', 0),
        row.get('meeting_participant_count', 0),
        row.get('max_participants', 10)
    ]

    # 13-19: 카테고리 원핫 (7개)
    categories = ["스포츠", "맛집", "카페", "문화예술", "스터디", "취미활동", "소셜"]
    category = row.get('category', '')
    feat.extend([1 if category == cat else 0 for cat in categories])

    # 20-27: Vibe 원핫 (8개)
    vibes = ["활기찬", "여유로운", "진지한", "즐거운", "감성적인",
             "에너지 넘치는", "힐링", "창의적인"]
    vibe = row.get('vibe', '')
    feat.extend([1 if vibe == v else 0 for v in vibes])

    features.append(feat)

X = np.array(features)
y = data['rating'].values

# NaN 제거
print(f"\n데이터 정제...")
print(f"  원본: {len(X):,}개")

mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
X = X[mask]
y = y[mask]

print(f"  정제 후: {len(X):,}개 (제거: {(~mask).sum()}개)")

print(f"\n특징 생성 완료!")
print(f"  특징 수: {X.shape[1]}")
print(f"  샘플 수: {X.shape[0]:,}")

# ========================================
# Train/Test Split
# ========================================

# 데이터 정제 후 user_id 추출
data_clean = data[mask].reset_index(drop=True)

X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(
    X, y, data_clean.index, test_size=0.2, random_state=42
)

# ========================================
# LightGBM Ranker 학습
# ========================================

print("\nLightGBM Ranker 학습...")

model = lgb.LGBMRanker(
    objective='lambdarank',
    metric='ndcg',
    n_estimators=100,
    learning_rate=0.05,
    num_leaves=31,
    max_depth=6,
    random_state=42
)

# Group 생성 (사용자별)
train_users = data_clean.iloc[idx_train]['user_id'].values
train_groups = pd.Series(train_users).value_counts().sort_index().values

test_users = data_clean.iloc[idx_test]['user_id'].values
test_groups = pd.Series(test_users).value_counts().sort_index().values

print(f"  학습 그룹: {len(train_groups)}개")
print(f"  테스트 그룹: {len(test_groups)}개")

model.fit(
    X_train, y_train,
    group=train_groups,
    eval_set=[(X_test, y_test)],
    eval_group=[test_groups],
    eval_metric='ndcg',
    callbacks=[lgb.early_stopping(10)]
)

# ========================================
# 모델 저장
# ========================================

print("\n모델 저장...")
with open('models/lightgbm_model.pkl', 'wb') as f:
    pickle.dump(model, f)

print("✅ 모델 저장 완료: models/lightgbm_ranker.pkl")
print(f"   특징 수: {model.n_features_in_}")
print(f"   트리 수: {model.n_estimators}")

# ========================================
# 테스트
# ========================================

print("\n모델 테스트...")
y_pred = model.predict(X_test[:10])
print("예측 평점:", [round(p, 2) for p in y_pred])
print("실제 평점:", y_test[:10].tolist())