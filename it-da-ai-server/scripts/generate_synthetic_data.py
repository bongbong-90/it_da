"""
대량 Synthetic 데이터 생성 (카테고리 7개)
목표: 50,000+ 인터랙션
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

np.random.seed(42)

# ========================================
# 설정
# ========================================

N_USERS = 1000
N_MEETINGS = 500
INTERACTIONS_PER_USER = 50  # 50,000 인터랙션

CATEGORIES = ['스포츠', '맛집', '카페', '문화예술', '스터디', '취미활동', '소셜']
VIBES = ['활기찬', '여유로운', '진지한', '즐거운', '감성적인', '에너지 넘치는', '힐링', '창의적인']

CATEGORY_DETAILS = {
    '스포츠': {
        'subcategories': ['러닝', '축구', '배드민턴', '등산', '요가', '사이클링'],
        'location_type': 'outdoor',
        'cost_range': (0, 10000),
        'vibes': ['활기찬', '에너지 넘치는'],
        'time_slots': ['morning', 'evening'],
        'max_participants': (6, 15)
    },
    '맛집': {
        'subcategories': ['한식', '중식', '일식', '양식', '이자카야'],
        'location_type': 'indoor',
        'cost_range': (15000, 40000),
        'vibes': ['여유로운', '힐링'],
        'time_slots': ['afternoon', 'evening'],
        'max_participants': (4, 8)
    },
    '카페': {
        'subcategories': ['카페투어', '브런치', '디저트', '베이커리'],
        'location_type': 'indoor',
        'cost_range': (10000, 20000),
        'vibes': ['여유로운', '힐링', '감성적인'],
        'time_slots': ['morning', 'afternoon'],
        'max_participants': (4, 8)
    },
    '문화예술': {
        'subcategories': ['전시회', '공연', '갤러리', '공방체험'],
        'location_type': 'indoor',
        'cost_range': (5000, 25000),
        'vibes': ['감성적인', '창의적인'],
        'time_slots': ['afternoon', 'evening'],
        'max_participants': (4, 10)
    },
    '스터디': {
        'subcategories': ['영어회화', '독서토론', '코딩', '재테크'],
        'location_type': 'indoor',
        'cost_range': (0, 8000),
        'vibes': ['진지한'],
        'time_slots': ['evening'],
        'max_participants': (4, 8)
    },
    '취미활동': {
        'subcategories': ['그림', '베이킹', '쿠킹', '플라워'],
        'location_type': 'indoor',
        'cost_range': (15000, 35000),
        'vibes': ['창의적인', '여유로운', '즐거운'],
        'time_slots': ['afternoon', 'evening'],
        'max_participants': (4, 10)
    },
    '소셜': {
        'subcategories': ['보드게임', '방탈출', '볼링', '당구'],
        'location_type': 'indoor',
        'cost_range': (10000, 25000),
        'vibes': ['즐거운', '활기찬'],
        'time_slots': ['evening'],
        'max_participants': (4, 10)
    }
}

# ========================================
# 사용자 생성
# ========================================

print(f"사용자 {N_USERS}명 생성...")

users = []
for user_id in range(1, N_USERS + 1):
    # 랜덤 관심사 (2-4개)
    n_interests = np.random.randint(2, 5)
    interests = np.random.choice(CATEGORIES, size=n_interests, replace=False)

    users.append({
        'user_id': user_id,
        'user_lat': np.random.uniform(37.4, 37.7),
        'user_lng': np.random.uniform(126.8, 127.2),
        'interests': ', '.join(interests),
        'time_preference': np.random.choice(['morning', 'afternoon', 'evening', 'night']),
        'location_preference': np.random.choice(['indoor', 'outdoor'], p=[0.6, 0.4]),
        'budget_type': np.random.choice(['low', 'value', 'medium', 'high', 'premium'], p=[0.2, 0.3, 0.3, 0.15, 0.05])
    })

users_df = pd.DataFrame(users)
print(f"✅ 사용자 생성 완료")

# ========================================
# 모임 생성
# ========================================

print(f"모임 {N_MEETINGS}개 생성...")

meetings = []
for meeting_id in range(1, N_MEETINGS + 1):
    category = np.random.choice(CATEGORIES)
    details = CATEGORY_DETAILS[category]

    meetings.append({
        'meeting_id': meeting_id,
        'category': category,
        'subcategory': np.random.choice(details['subcategories']),
        'meeting_lat': np.random.uniform(37.4, 37.7),
        'meeting_lng': np.random.uniform(126.8, 127.2),
        'time_slot': np.random.choice(details['time_slots']),
        'location_type': details['location_type'],
        'vibe': np.random.choice(details['vibes']),
        'expected_cost': int(np.random.uniform(*details['cost_range'])),
        'max_participants': np.random.randint(*details['max_participants'])
    })

meetings_df = pd.DataFrame(meetings)
print(f"✅ 모임 생성 완료")

# ========================================
# 인터랙션 생성 (평점)
# ========================================

print(f"인터랙션 생성 (사용자당 {INTERACTIONS_PER_USER}개)...")

interactions = []

for user_id in range(1, N_USERS + 1):
    if user_id % 100 == 0:
        print(f"  {user_id}/{N_USERS}")

    user = users_df[users_df['user_id'] == user_id].iloc[0]
    user_interests = set(user['interests'].split(', '))

    # 랜덤 모임 선택
    meeting_ids = np.random.choice(meetings_df['meeting_id'], size=INTERACTIONS_PER_USER, replace=True)

    for meeting_id in meeting_ids:
        meeting = meetings_df[meetings_df['meeting_id'] == meeting_id].iloc[0]

        # 평점 계산 (유사도 기반)
        base_rating = 3.0

        # 관심사 매칭
        if meeting['category'] in user_interests:
            base_rating += 1.0

        # 시간대 매칭
        if user['time_preference'] == meeting['time_slot']:
            base_rating += 0.5

        # 장소 타입 매칭
        if user['location_preference'] == meeting['location_type']:
            base_rating += 0.3

        # 노이즈
        noise = np.random.normal(0, 0.3)
        rating = np.clip(base_rating + noise, 1, 5)

        interactions.append({
            'user_id': user_id,
            'meeting_id': meeting_id,
            'rating': round(rating, 1)
        })

interactions_df = pd.DataFrame(interactions)
print(f"✅ 인터랙션 생성 완료: {len(interactions_df):,}개")

# ========================================
# 저장
# ========================================

print("\n저장 중...")
users_df.to_csv('data/synthetic_users_nationwide.csv', index=False)
meetings_df.to_csv('data/synthetic_meetings_nationwide.csv', index=False)
interactions_df.to_csv('data/synthetic_interactions_nationwide.csv', index=False)

print(f"""
✅ 데이터 생성 완료!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 통계:
  - 사용자: {len(users_df):,}명
  - 모임: {len(meetings_df):,}개
  - 인터랙션: {len(interactions_df):,}개
  - 카테고리: {len(CATEGORIES)}개
  - Vibe: {len(VIBES)}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 저장 위치:
  - data/synthetic_users_nationwide.csv
  - data/synthetic_meetings_nationwide.csv
  - data/synthetic_interactions_nationwide.csv
""")