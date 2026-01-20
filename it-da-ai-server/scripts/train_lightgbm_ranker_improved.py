"""
LightGBM Ranker v2 - Improved
- 더 강한 차별화를 위한 하이퍼파라미터 조정
- Feature importance 확인
- 성능 평가 추가
"""

import pickle
import math
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import ndcg_score
import sys
import os

# FeatureBuilder import (경로 조정 필요시 수정)
sys.path.append('/home/claude')  # 필요시 프로젝트 루트 경로로 수정
from app.core.feature_builder import FeatureBuilder

print("🚀 LightGBM Ranker v2 학습 시작")

# ===============================
# 데이터 로드
# ===============================
print("\n📂 데이터 로딩...")
interactions = pd.read_csv("/mnt/user-data/uploads/synthetic_interactions_nationwide.csv")
users = pd.read_csv("/mnt/user-data/uploads/synthetic_users_nationwide.csv")
meetings = pd.read_csv("/mnt/user-data/uploads/synthetic_meetings_nationwide.csv")

print(f"  - Interactions: {len(interactions):,}개")
print(f"  - Users: {len(users):,}명")
print(f"  - Meetings: {len(meetings):,}개")

# rating 없는 데이터 제거
interactions = interactions[interactions["rating"].notna()]
print(f"  - Valid ratings: {len(interactions):,}개")

# ===============================
# 통계 피처
# ===============================
print("\n📊 통계 피처 생성...")
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
print("\n🔗 데이터 병합...")
df = interactions.merge(users, on="user_id", how="left")
df = df.merge(meetings, on="meeting_id", how="left")
df = df.merge(user_stats, on="user_id", how="left")
df = df.merge(meeting_stats, on="meeting_id", how="left")

print(f"  - 병합 후 행 수: {len(df):,}개")

# ===============================
# FeatureBuilder로 피처 생성
# ===============================
print("\n🔧 피처 생성 중...")
fb = FeatureBuilder()
X, y, groups = [], [], []

current_user = None
group_count = 0

for idx, row in df.iterrows():
    if idx % 1000 == 0:
        print(f"  진행중: {idx:,}/{len(df):,} ({idx / len(df) * 100:.1f}%)", end='\r')

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
        "subcategory": row.get("subcategory", ""),
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

print(f"\n✅ 피처 생성 완료!")
print(f"  - Shape: {X.shape}")
print(f"  - Features: {len(fb.get_feature_names())}")
print(f"  - Groups: {len(groups)}")

# ===============================
# 피처 통계 확인 (중요!)
# ===============================
print("\n📈 피처 통계:")
for i, fname in enumerate(fb.get_feature_names()):
    col = X[:, i]
    print(f"  [{i:2d}] {fname:30s}: min={col.min():.3f}, max={col.max():.3f}, std={col.std():.3f}")

# ✅ 차별화 부족 경고
zero_var_features = []
for i, fname in enumerate(fb.get_feature_names()):
    if X[:, i].std() < 0.01:
        zero_var_features.append(fname)

if zero_var_features:
    print(f"\n⚠️  분산이 거의 없는 피처 ({len(zero_var_features)}개):")
    for f in zero_var_features:
        print(f"    - {f}")

# ===============================
# Train/Test Split
# ===============================
print("\n🔀 Train/Test 분리...")
split_idx = int(len(X) * 0.8)

X_train, X_test = X[:split_idx], X[split_idx:]
y_train, y_test = y[:split_idx], y[split_idx:]

# groups도 분리
train_groups = []
test_groups = []
cumsum = 0
for g in groups:
    if cumsum + g <= split_idx:
        train_groups.append(g)
    else:
        if cumsum < split_idx:
            # 경계에 걸친 그룹 처리
            train_part = split_idx - cumsum
            if train_part > 0:
                train_groups.append(train_part)
            test_part = g - train_part
            if test_part > 0:
                test_groups.append(test_part)
        else:
            test_groups.append(g)
    cumsum += g

print(f"  - Train: {len(X_train):,} samples, {len(train_groups)} groups")
print(f"  - Test: {len(X_test):,} samples, {len(test_groups)} groups")

# ===============================
# 모델 학습 (✅ 개선된 하이퍼파라미터)
# ===============================
print("\n🎯 LightGBM Ranker 학습 시작...")

model = lgb.LGBMRanker(
    objective="lambdarank",
    metric="ndcg",

    # ✅ 더 강한 학습
    n_estimators=300,  # 200 → 300
    learning_rate=0.03,  # 0.05 → 0.03 (더 천천히)

    # ✅ 더 복잡한 트리
    num_leaves=63,  # 31 → 63 (더 세밀하게)
    max_depth=8,  # 6 → 8

    # ✅ 정규화 강화
    min_child_samples=20,  # 과적합 방지
    subsample=0.8,  # 80% 샘플링
    colsample_bytree=0.8,  # 80% 피처 샘플링
    reg_alpha=0.1,  # L1 정규화
    reg_lambda=0.1,  # L2 정규화

    random_state=42,
    verbose=-1
)

model.fit(
    X_train, y_train,
    group=train_groups,
    eval_set=[(X_test, y_test)],
    eval_group=[test_groups],
    eval_metric="ndcg",
    callbacks=[
        lgb.early_stopping(stopping_rounds=30, verbose=True),
        lgb.log_evaluation(period=10)
    ]
)

print("\n✅ 학습 완료!")

# ===============================
# 성능 평가
# ===============================
print("\n📊 성능 평가...")

# Train 예측
y_train_pred = model.predict(X_train)
print(f"\n[Train Set]")
print(f"  - Pred range: [{y_train_pred.min():.4f}, {y_train_pred.max():.4f}]")
print(f"  - Pred std: {y_train_pred.std():.4f}")
print(f"  - Unique values: {len(np.unique(np.round(y_train_pred, 2)))}")

# Test 예측
y_test_pred = model.predict(X_test)
print(f"\n[Test Set]")
print(f"  - Pred range: [{y_test_pred.min():.4f}, {y_test_pred.max():.4f}]")
print(f"  - Pred std: {y_test_pred.std():.4f}")
print(f"  - Unique values: {len(np.unique(np.round(y_test_pred, 2)))}")

# ✅ 차별화 검사
if y_test_pred.std() < 0.1:
    print("\n⚠️  경고: 예측값의 분산이 너무 작습니다! ({:.4f})".format(y_test_pred.std()))
    print("    → 모델이 제대로 차별화하지 못하고 있습니다.")
else:
    print(f"\n✅ 예측값 분산 양호: {y_test_pred.std():.4f}")

# ===============================
# Feature Importance
# ===============================
print("\n🔝 Feature Importance (상위 10개):")
importances = model.feature_importances_
feature_names = fb.get_feature_names()

importance_df = pd.DataFrame({
    'feature': feature_names,
    'importance': importances
}).sort_values('importance', ascending=False)

for idx, row in importance_df.head(10).iterrows():
    print(f"  {row['feature']:30s}: {row['importance']:.1f}")

# ===============================
# 모델 저장
# ===============================
print("\n💾 모델 저장 중...")

model_data = {
    "model": model,
    "feature_names": fb.get_feature_names(),
    "schema_version": "v2_24f_ranker_improved",
    "training_stats": {
        "n_estimators": model.n_estimators,
        "num_leaves": model.num_leaves,
        "max_depth": model.max_depth,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_pred_std": float(y_train_pred.std()),
        "test_pred_std": float(y_test_pred.std()),
    }
}

output_path = "/mnt/user-data/outputs/lightgbm_ranker_v2.pkl"
with open(output_path, "wb") as f:
    pickle.dump(model_data, f)

print(f"✅ 모델 저장 완료: {output_path}")
print("\n🎉 학습 완료!")