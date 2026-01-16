// src/types/meeting.types.ts

/**
 * 모임 엔티티 타입
 */
export interface Meeting {
  meetingId: number;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  locationName: string;
  locationAddress?: string;
  latitude?: number;
  longitude?: number;
  locationType?: "INDOOR" | "OUTDOOR";
  meetingTime: string; // ISO 8601 format
  timeSlot?: "MORNING" | "AFTERNOON" | "EVENING";
  vibe: string;
  maxParticipants: number;
  currentParticipants: number;
  expectedCost: number;
  status?: "RECRUITING" | "FULL" | "CANCELLED" | "COMPLETED";
  isPublic?: boolean;
  imageUrl?: string;
  tags?: string;
  avgRating?: number;
  ratingCount?: number;
  organizerId: number;
  organizer?: {
    userId: number;
    nickname?: string;
    profileImage?: string;
  };
  createdAt?: string;
  updatedAt?: string;

  // ⭐ 프론트 전용 필드 (동적 계산)
  distanceKm?: number;
  matchScore?: number;

  aiMatchPercentage?: number;
}

/**
 * 모임 생성 요청 DTO
 */
export interface MeetingCreateRequest {
  title: string;
  description: string;
  category: string;
  subcategory: string;
  meetingTime: string;
  locationName: string;
  locationAddress: string;
  latitude?: number;
  longitude?: number;
  locationType: "INDOOR" | "OUTDOOR";
  vibe: string;
  timeSlot: "MORNING" | "AFTERNOON" | "EVENING";
  maxParticipants: number;
  expectedCost: number;
  imageUrl?: string;
  tags?: string;
}

/**
 * 모임 수정 요청 DTO
 */
export interface MeetingUpdateRequest extends MeetingCreateRequest {
  meetingId: number;
}

/**
 * 모임 검색 요청
 */
export interface MeetingSearchRequest {
  keyword?: string;
  category?: string;
  subcategory?: string;
  minParticipants?: number;
  maxParticipants?: number;
  minCost?: number;
  maxCost?: number;
  startDate?: string;
  endDate?: string;
  latitude?: number;
  longitude?: number;
  radiusKm?: number;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: "ASC" | "DESC";
}

/**
 * 모임 검색 응답
 */
export interface MeetingSearchResponse {
  success: boolean;
  meetings: Meeting[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNext: boolean;
}

/**
 * 모임 상세 응답
 */
export interface MeetingDetailResponse {
  success: boolean;
  meeting: Meeting;
  isParticipant?: boolean;
  isOrganizer?: boolean;
}

/**
 * 최근 활동 아이템
 */
export interface RecentItem {
  id: number;
  icon: string;
  title: string;
  time: string;
  type: "chat" | "meeting";
  meetingId?: number;
}

/**
 * AI 추천 응답
 */
export interface AIRecommendationResponse {
  success: boolean;
  message?: string;
  meeting: Meeting | null;
  matchScore?: number;
  predictedRating?: number;
}

// ✅ 상세 페이지용 확장 타입
export interface MeetingDetail extends Meeting {
  organizerUsername: string;
  organizerProfileImage?: string;
  locationAddress: string;
  latitude: number;
  longitude: number;
  locationType?: "INDOOR" | "OUTDOOR";
  timeSlot?: "MORNING" | "AFTERNOON" | "EVENING";
  status?: "RECRUITING" | "FULL" | "CANCELLED" | "COMPLETED";
  reviewCount: number;
  createdAt: string;
  isFull: boolean;
  dDay: number;
}

// ✅ 리스트 응답 (API 응답 구조)
export interface MeetingListResponse {
  success: boolean;
  message: string;
  meetings: Meeting[];
  totalCount: number;
  currentPage?: number;
  totalPages?: number;
}
