"""
실제 synthetic 데이터로 LightGBM Ranker 학습
카테고리: 7개, Vibe: 8개, 총 27개 특징
"""

import pandas as pd
import numpy as np
import lightgbm as lgb
from sklearn.model_selection import train_test_split
import pickle
import math

def haversine_distance(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = (math.sin(dlat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng / 2) ** 2)
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def calculate_interest_match(user_interests, meeting_category):
    if pd.isna(user_interests) or pd.isna(meeting_category):
        return 0.0
    user_keywords = set(str(user_interests).lower().split(", "))
    meeting_keywords = set(str(meeting_category).lower().split())
    if len(user_keywords) == 0:
        return 0.0
    match_count = len(user_keywords & meeting_keywords)
    return match_count / len(user_keywords)

def calculate_cost_match(user_budget_type, meeting_cost):
    cost_ranges = {"low": (0, 10000), "value": (10000, 30000), "medium": (30000, 50000), "high": (50000, 100000), "premium": (100000, float('inf'))}
    if user_budget_type not in cost_ranges:
        return 0.5
    min_cost, max_cost = cost_ranges[user_budget_type]
    if min_cost <= meeting_cost <= max_cost:
        return 1.0
    elif meeting_cost < min_cost:
        return max(0.0, 1.0 - (min_cost - meeting_cost) / min_cost)
    else:
        return max(0.0, 1.0 - (meeting_cost - max_cost) / max_cost)

print("데이터 로딩...")
interactions = pd.read_csv('data/synthetic_interactions_nationwide.csv')
users = pd.read_csv('data/synthetic_users_nationwide.csv')
meetings = pd.read_csv('data/synthetic_meetings_nationwide.csv')

# NaN 제거
interactions = interactions.dropna(subset=['rating'])
print(f"인터랙션: {len(interactions):,}개 (NaN 제거 후), 사용자: {len(users):,}명, 모임: {len(meetings):,}개")

print("\n특징 생성...")
user_stats = interactions.groupby('user_id').agg({'rating': ['mean', 'std', 'count']}).reset_index()
user_stats.columns = ['user_id', 'user_avg_rating', 'user_rating_std', 'user_meeting_count']
user_stats['user_rating_std'] = user_stats['user_rating_std'].fillna(0.3)  # ✅ inplace 제거

meeting_stats = interactions.groupby('meeting_id').agg({'rating': ['mean', 'count'], 'user_id': 'count'}).reset_index()
meeting_stats.columns = ['meeting_id', 'meeting_avg_rating', 'meeting_rating_count', 'meeting_participant_count']

data = interactions.merge(users, on='user_id').merge(meetings, on='meeting_id').merge(user_stats, on='user_id').merge(meeting_stats, on='meeting_id')

CATEGORIES = ["스포츠", "맛집", "카페", "문화예술", "스터디", "취미활동", "소셜"]
VIBES = ["활기찬", "여유로운", "진지한", "즐거운", "감성적인", "에너지 넘치는", "힐링", "창의적인"]

features = []
for idx, row in data.iterrows():
    if idx % 10000 == 0:
        print(f"  {idx:,}/{len(data):,}")

    feat = [
        haversine_distance(row.get('user_lat', 37.5), row.get('user_lng', 127.0), row.get('meeting_lat', 37.5), row.get('meeting_lng', 127.0)),
        1.0 if row.get('time_preference') == row.get('time_slot') else 0.0,
        1.0 if row.get('location_preference') == row.get('location_type') else 0.0,
        calculate_interest_match(row.get('interests'), row.get('category')),
        calculate_cost_match(row.get('budget_type', 'value'), row.get('expected_cost', 20000)),
        row.get('user_avg_rating', 3.0), row.get('user_meeting_count', 0), row.get('user_rating_std', 0.3),
        row.get('meeting_avg_rating', 3.0), row.get('meeting_rating_count', 0), row.get('meeting_participant_count', 0), row.get('max_participants', 10)
    ]
    category = row.get('category', '')
    feat.extend([1 if category == cat else 0 for cat in CATEGORIES])
    vibe = row.get('vibe', '')
    feat.extend([1 if vibe == v else 0 for v in VIBES])
    features.append(feat)

X = np.array(features)
y = data['rating'].values

# NaN 확인 및 제거
nan_mask = ~(np.isnan(X).any(axis=1) | np.isnan(y))
X = X[nan_mask]
y = y[nan_mask]

print(f"완료! 특징: {X.shape[1]}개, 샘플: {X.shape[0]:,}개 (NaN 제거 후)")

X_train, X_test, y_train, y_test, idx_train, idx_test = train_test_split(X, y, range(len(X)), test_size=0.2, random_state=42)
print("\nLightGBM Regressor 학습...")

model = lgb.LGBMRegressor(
    objective="regression",
    metric="rmse",
    n_estimators=500,          # ✅ 좀 넉넉히 주고
    learning_rate=0.03,        # ✅ 낮추고
    max_depth=5,               # ✅ 2^5=32
    num_leaves=31,             # ✅ <=32라서 경고 사라짐
    min_child_samples=30,      # ✅ 데이터 작을 때 과적합 방지 (20~50 범위 추천)
    subsample=0.8,             # ✅ row 샘플링
    colsample_bytree=0.8,      # ✅ feature 샘플링
    reg_alpha=0.1,             # ✅ L1
    reg_lambda=1.0,            # ✅ L2
    random_state=42
)

model.fit(
    X_train, y_train,
    eval_set=[(X_test, y_test)],
    eval_metric="rmse",
    callbacks=[lgb.early_stopping(30, verbose=False)]
)

with open("models/lightgbm_model.pkl", "wb") as f:
    pickle.dump(model, f)

print(f"\n✅ 저장 완료! 특징: {model.n_features_in_}개")
print("테스트:", model.predict(X_test[:5]))

from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
import numpy as np

pred_train = model.predict(X_train)
pred_test = model.predict(X_test)

rmse_train = mean_squared_error(y_train, pred_train, squared=False)
rmse_test  = mean_squared_error(y_test, pred_test, squared=False)
mae_test   = mean_absolute_error(y_test, pred_test)
r2_test    = r2_score(y_test, pred_test)

print("y_train std:", np.std(y_train), "y_test std:", np.std(y_test))
print("RMSE train:", rmse_train)
print("RMSE test :", rmse_test)
print("MAE  test :", mae_test)
print("R2   test :", r2_test)
print("pred std  :", np.std(pred_test), "pred mean:", np.mean(pred_test))