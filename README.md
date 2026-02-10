# IT-DA (잇다) - 취미 기반 모임 매칭 플랫폼

## 📌 프로젝트 개요
IT-DA는 다양한 취미를 가진 사람들이 모임을 만들고 참여할 수 있는 종합 모임 매칭 플랫폼입니다.

### 주요 기능
- 🎯 카테고리별 모임 검색 및 참여 (운동, 음식, 문화/예술, 스터디, 사교)
- 📍 지역 기반 모임 찾기
- 👥 실시간 모임 관리 및 참여자 관리
- 🔐 안전한 사용자 인증 및 세션 관리
- 📊 관리자 대시보드 (사용자/모임/신고 관리)
- 🤖 AI 기반 추천 시스템 (예정)

---

## 🛠 기술 스택

### Backend
- **Framework**: Spring Boot 3.x
- **Language**: Java 17
- **Database**: MySQL 8.0
- **Cache/Session**: Redis
- **Authentication**: Redis Session (JWT 미사용)
- **API**: RESTful API

### Frontend
- **Framework**: React 19
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand
- **Styling**: Tailwind CSS + shadcn/ui
- **HTTP Client**: Axios

### AI (예정)
- **Language**: Python
- **Framework**: FastAPI / Flask
- **Integration**: REST API 연동

---

## 🏗 아키텍처 특징

### 성능 최적화
- **N+1 문제 방지**: LEFT JOIN FETCH를 활용한 쿼리 최적화
- **Redis 캐싱**: 세션 관리 및 자주 조회되는 데이터 캐싱
- **Soft Delete**: 데이터 무결성 유지

### 인증 방식
- **Redis Session 기반 인증**
  - JWT 대신 Redis Session 활용
  - `HttpSession`을 통한 간편한 세션 관리
  - 서버 측 세션 제어로 보안성 강화

---

## 👥 팀원 및 역할

| 이름 | 담당 영역 |
|------|-----------|
| **김봉환** | Admin 기능, Redis 설정, Auth 설정, 백엔드 인프라 |
| **김동민** | 사용자(User) 관련 기능, 프로필 관리 |
| **최동원** | 모임(Meeting) 관련 기능, 모임 CRUD |
| **김보민** | 프론트엔드 UI/UX, 컴포넌트 개발 |
| **신의진** | 신고(Report) 기능, 커뮤니티 관리 |
| **박성훈** | 리뷰(Review) 기능, 평가 시스템 |

---

## 📁 프로젝트 구조

```
IT-DA/
├── backend/                    # Spring Boot 백엔드
│   ├── src/main/java/
│   │   └── com/example/itda/
│   │       ├── config/        # Redis, Security 설정
│   │       ├── controller/    # REST API 컨트롤러
│   │       ├── service/       # 비즈니스 로직
│   │       ├── repository/    # JPA Repository
│   │       ├── entity/        # JPA 엔티티
│   │       └── dto/           # 데이터 전송 객체
│   └── src/main/resources/
│       ├── application.yml    # 설정 파일
│       └── data.sql          # 초기 데이터
│
├── frontend/                  # React 프론트엔드
│   ├── src/
│   │   ├── components/       # 재사용 컴포넌트
│   │   ├── pages/           # 페이지 컴포넌트
│   │   ├── stores/          # Zustand 상태 관리
│   │   ├── api/             # API 호출 함수
│   │   ├── types/           # TypeScript 타입 정의
│   │   └── utils/           # 유틸리티 함수
│   ├── public/
│   └── package.json
│
└── ai/                       # Python AI 서버 (예정)
    ├── main.py
    ├── models/
    └── requirements.txt
```

---

## 🚀 시작하기

### 사전 요구사항
- Java 17+
- Node.js 18+
- MySQL 8.0+
- Redis 6.0+
- Python 3.9+ (AI 기능 사용 시)

### Backend 실행

```bash
cd backend

# MySQL 데이터베이스 생성
mysql -u root -p
CREATE DATABASE itda;

# Redis 서버 시작
redis-server

# 애플리케이션 실행
./mvnw spring-boot:run
```

### Frontend 실행

```bash
cd frontend

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

### AI 서버 실행 (예정)

```bash
cd ai

# 가상환경 생성 및 활성화
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
```

---

## 🔑 주요 API 엔드포인트

### 인증 (Authentication)
- `POST /api/auth/signup` - 회원가입
- `POST /api/auth/login` - 로그인
- `POST /api/auth/logout` - 로그아웃
- `GET /api/auth/check` - 세션 확인

### 사용자 (User)
- `GET /api/users/{id}` - 사용자 정보 조회
- `PUT /api/users/{id}` - 사용자 정보 수정
- `DELETE /api/users/{id}` - 회원 탈퇴

### 모임 (Meeting)
- `GET /api/meetings` - 모임 목록 조회
- `GET /api/meetings/{id}` - 모임 상세 조회
- `POST /api/meetings` - 모임 생성
- `PUT /api/meetings/{id}` - 모임 수정
- `DELETE /api/meetings/{id}` - 모임 삭제
- `POST /api/meetings/{id}/join` - 모임 참여

### 관리자 (Admin)
- `GET /api/admin/users` - 사용자 관리
- `GET /api/admin/meetings` - 모임 관리
- `GET /api/admin/reports` - 신고 관리

---

## 📊 데이터베이스 스키마

### 주요 테이블
- `users` - 사용자 정보
- `meetings` - 모임 정보
- `meeting_participants` - 모임 참여자
- `reports` - 신고 내역
- `reviews` - 리뷰 및 평가
- `categories` - 카테고리 정보

---

## 🔧 개발 가이드

### 코딩 컨벤션
- **Backend**: Java 표준 컨벤션 준수
- **Frontend**: Airbnb React/TypeScript Style Guide
- **Naming**: camelCase (변수/메서드), PascalCase (클래스/컴포넌트)

### Git 브랜치 전략
- `main` - 배포 가능한 안정 버전
- `develop` - 개발 통합 브랜치
- `feature/기능명` - 기능 개발 브랜치
- `hotfix/버그명` - 긴급 수정 브랜치

### Commit 메시지 규칙
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅
refactor: 코드 리팩토링
test: 테스트 코드
chore: 빌드/설정 변경
```

---

## 📝 개발 시 주의사항

### N+1 문제 방지
```java
// ❌ Bad - N+1 문제 발생
@Query("SELECT m FROM Meeting m WHERE m.deletedAt IS NULL")
List<Meeting> findAll();

// ✅ Good - JOIN FETCH 사용
@Query("SELECT m FROM Meeting m " +
       "LEFT JOIN FETCH m.participants " +
       "WHERE m.deletedAt IS NULL")
List<Meeting> findAllWithParticipants();
```

### Redis Session 활용
```java
// 세션에 사용자 정보 저장
session.setAttribute("userId", user.getId());

// 세션에서 사용자 정보 가져오기
Long userId = (Long) session.getAttribute("userId");
```

### Soft Delete 처리
```java
// 모든 조회 쿼리에 deletedAt 필터 추가
WHERE entity.deletedAt IS NULL
```

---

## 🧪 테스트

```bash
# Backend 테스트
./mvnw test

# Frontend 테스트
npm run test

# E2E 테스트
npm run test:e2e
```

---

## 📦 배포

### Backend
```bash
# JAR 파일 빌드
./mvnw clean package

# 실행
java -jar target/itda-0.0.1-SNAPSHOT.jar
```

### Frontend
```bash
# 프로덕션 빌드
npm run build

# 빌드 파일은 dist/ 폴더에 생성
```

---

## 📄 라이선스

This project is licensed under the MIT License.

---

## 🎯 향후 계획

- [ ] AI 기반 모임 추천 시스템 구현
- [ ] 실시간 채팅 기능 추가
- [ ] 모바일 앱 개발
- [ ] 결제 시스템 통합
- [ ] 알림 기능 강화
