"""
LightGBM Ranker v1
- FeatureBuilder 기준 (24 features)
- user 단위 LambdaRank
"""

import pickle
import math
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split

from app.core.feature_builder import FeatureBuilder

# ===============================
# 데이터 로드
# ===============================
interactions = pd.read_csv("data/synthetic_interactions_nationwide.csv")
users = pd.read_csv("data/synthetic_users_nationwide.csv")
meetings = pd.read_csv("data/synthetic_meetings_nationwide.csv")

# rating 없는 데이터 제거 (중요)
interactions = interactions[interactions["rating"].notna()]

# ===============================
# 통계 피처 (train-only 누수 방지는 실서비스에서 처리)
# ===============================
user_stats = interactions.groupby("user_id").agg(
    user_avg_rating=("rating", "mean"),
    user_rating_std=("rating", "std"),
    user_meeting_count=("rating", "count")
).reset_index()
user_stats["user_rating_std"] = user_stats["user_rating_std"].fillna(0.3)

meeting_stats = interactions.groupby("meeting_id").agg(
    meeting_avg_rating=("rating", "mean"),
    meeting_rating_count=("rating", "count"),
    meeting_participant_count=("user_id", "count")
).reset_index()

# ===============================
# 병합
# ===============================
df = interactions.merge(users, on="user_id", how="left")
df = df.merge(meetings, on="meeting_id", how="left")
df = df.merge(user_stats, on="user_id", how="left")
df = df.merge(meeting_stats, on="meeting_id", how="left")

# ===============================
# FeatureBuilder
# ===============================
fb = FeatureBuilder()
X, y, groups = [], [], []

current_user = None
group_count = 0

for _, row in df.iterrows():
    user = {
        "lat": row.get("user_lat"),
        "lng": row.get("user_lng"),
        "interests": row.get("interests"),
        "time_preference": row.get("time_preference"),
        "user_location_pref": row.get("user_location_pref"),
        "budget_type": row.get("budget_type"),
        "user_avg_rating": row.get("user_avg_rating", 3.0),
        "user_meeting_count": row.get("user_meeting_count", 0),
        "user_rating_std": row.get("user_rating_std", 0.3),
    }

    meeting = {
        "lat": row.get("meeting_lat"),
        "lng": row.get("meeting_lng"),
        "category": row.get("category"),
        "vibe": row.get("vibe"),
        "time_slot": row.get("time_slot"),
        "meeting_location_type": row.get("meeting_location_type"),
        "expected_cost": row.get("expected_cost"),
        "max_participants": row.get("max_participants"),
        "meeting_avg_rating": row.get("meeting_avg_rating", 3.0),
        "meeting_rating_count": row.get("meeting_rating_count", 0),
        "meeting_participant_count": row.get("meeting_participant_count", 0),
    }

    _, vec = fb.build(user, meeting)
    X.append(vec[0])
    y.append(row["rating"])

    if current_user != row["user_id"]:
        if current_user is not None:
            groups.append(group_count)
        current_user = row["user_id"]
        group_count = 1
    else:
        group_count += 1

groups.append(group_count)

X = np.array(X, dtype=float)
y = np.array(y, dtype=float)

# ===============================
# Train/Test Split (user 기준)
# ===============================
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, shuffle=False
)

train_groups = groups[: len(X_train)]
test_groups = groups[len(X_train):]

# ===============================
# Ranker 학습
# ===============================
model = lgb.LGBMRanker(
    objective="lambdarank",
    metric="ndcg",
    n_estimators=200,
    learning_rate=0.05,
    num_leaves=31,
    max_depth=6,
    random_state=42
)

model.fit(
    X_train, y_train,
    group=train_groups,
    eval_set=[(X_test, y_test)],
    eval_group=[test_groups],
    callbacks=[lgb.early_stopping(20)]
)

# ===============================
# 저장
# ===============================
model_data = {
    "model": model,
    "feature_names": fb.get_feature_names(),
    "schema_version": "v1_24f_ranker"
}

with open("models/lightgbm_ranker.pkl", "wb") as f:
    pickle.dump(model_data, f)

print("✅ LightGBM Ranker 학습 완료")
print("features:", len(model_data["feature_names"]))