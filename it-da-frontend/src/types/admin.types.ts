// 관리자 타입 정의

export interface AdminUser {
    adminId: number;
    name: string;
    email: string;
    role: 'SUPER_ADMIN' | 'MODERATOR' | 'SUPPORT';
    lastLoginAt: string | null;
}

export interface AdminDashboard {
    adminId: number;
    name: string;
    email: string;
    role: string;
    lastLoginAt: string | null;
    // 통계
    pendingReportsCount: number;
    todayAnnouncementsCount: number;
    activeUsersCount: number;
    totalUsersCount: number;
    totalMeetingsCount: number;
    todayJoinedUsersCount: number;
    activeMeetingsCount: number;
    userGrowthRate: number;
    meetingGrowthRate: number;
    pendingInquiriesCount: number;
}

export interface RecentUser {
    userId: number;
    username: string;
    email: string;
    createdAt: string;
    status: string;
}

export interface RecentMeeting {
    meetingId: number;
    title: string;
    categoryName: string;
    currentMembers: number;
    createdAt: string;
}

export interface DashboardResponse {
    dashboard: AdminDashboard;
    recentUsers: RecentUser[];
    recentMeetings: RecentMeeting[];
}


export interface AdminCheckResponse {
    isAuthenticated: boolean;
    adminId?: number;
    name?: string;
    email?: string;
    role?: string;
}

// ========== 회원 관리 관련 타입 ==========

export interface UserManageResponse {
    userId: number;
    email: string;
    username: string;
    nickname?: string;
    phone?: string;
    address?: string;
    status: string;
    createdAt: string;
    lastLoginAt?: string;
    meetingCount?: number;
    rating?: number;
}

export interface UserListResponse {
    users: UserManageResponse[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
}

export interface UserStatusRequest {
    status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
}


// ========== 모임 관리 관련 타입 ==========

export interface MeetingItem {
    meetingId: number;
    title: string;
    categoryName: string;
    subcategoryName: string;
    leaderName: string;
    currentMembers: number;
    maxMembers: number;
    meetingDate: string;
    location: string;
    status: string;
    createdAt: string;
}

export interface MeetingListResponse {
    meetings: MeetingItem[];
    totalElements: number;
    totalPages: number;
    currentPage: number;
}

export interface MeetingManageResponse {
    meetingId: number;
    title: string;
    categoryName: string;
    subcategoryName: string;
    leaderName: string;
    leaderEmail: string;

    meetingDate: string;
    location: string;

    maxMembers: number;
    currentMembers: number;

    expectedCost: number | null;
    avgRating: number | null;
    reviewCount: number | null;

    status: string;
    createdAt: string;
}

export interface MeetingStatusRequest {
    status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED' | 'DELETED';
}

// ========== 신고 관리 관련 타입 ==========

export type ReportStatus = 'PENDING' | 'REVIEWING' | 'RESOLVED' | 'REJECTED';
export type ReportedType = 'USER' | 'MEETING';

export interface ReportResponse {
    reportId: number;
    reporterId: number;
    reportedType: ReportedType;
    reportedId: number;
    reason: string;
    description: string;
    status: ReportStatus;
    adminNote: string | null;
    resolvedById: number | null;
    resolvedByName: string | null;
    createdAt: string;
    resolvedAt: string | null;
}

export interface ReportListResponse {
    content: ReportResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface ReportStatusRequest {
    status: ReportStatus;
    adminNote: string;
}

// ========== 1:1 문의 관리 관련 타입 ==========

export type InquiryStatus = 'PENDING' | 'ANSWERED' | 'CLOSED';
export type InquiryCategory = 'ACCOUNT' | 'MEETING' | 'PAYMENT' | 'BUG' | 'SUGGESTION' | 'ETC';

export interface InquiryResponse {
    inquiryId: number;
    userId: number;
    username: string;
    email: string;
    category: InquiryCategory;
    title: string;
    content: string;
    status: InquiryStatus;
    answer: string | null;
    answeredById: number | null;
    answeredByName: string | null;
    answeredAt: string | null;
    createdAt: string;
}

export interface InquiryListResponse {
    content: InquiryResponse[];
    totalElements: number;
    totalPages: number;
    number: number;
    size: number;
}

export interface InquiryAnswerRequest {
    status?: string;   // "PENDING" | "ANSWERED" | "CLOSED"
    answer?: string;   // 답변 내용
}

// ========== 공지사항 관련 타입 ==========

export type NoticeCategory =
    | 'NOTICE'
    | 'EVENT'
    | 'UPDATE'
    | 'MAINTENANCE'
    | 'GUIDE';

export type NoticeStatus =
    | 'DRAFT'
    | 'PUBLISHED'
    | 'HIDDEN';

export interface NoticeResponse {
    announcementId: number;
    authorId: number;
    authorName: string;
    category: NoticeCategory;
    title: string;
    content: string;
    isPinned: boolean;
    isImportant: boolean;
    viewCount: number;
    status: NoticeStatus;
    publishedAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface NoticeListResponse {
    content: NoticeResponse[];
    currentPage: number;
    totalPages: number;
    totalElements: number;
}

export interface NoticeCreateRequest {
    category: NoticeCategory;
    title: string;
    content: string;
    isPinned?: boolean;
    isImportant?: boolean;
    status: NoticeStatus;
    publishedAt?: string;
}

export interface NoticeUpdateRequest {
    category: NoticeCategory;
    title: string;
    content: string;
    isPinned?: boolean;
    isImportant?: boolean;
    status: NoticeStatus;
    publishedAt?: string;
}

