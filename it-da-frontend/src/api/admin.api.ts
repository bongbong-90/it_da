import client from './client';
import type {
    AdminCheckResponse,
    DashboardResponse,
    UserListResponse,
    UserManageResponse,
    UserStatusRequest,
    MeetingListResponse,
    MeetingManageResponse,
    MeetingStatusRequest,
    ReportResponse,
    ReportListResponse,
    ReportStatusRequest,
    InquiryResponse,
    InquiryListResponse,
    NoticeResponse,
    NoticeListResponse,
    NoticeCreateRequest,
    NoticeUpdateRequest
} from '../types/admin.types';

const BASE_URL = '/api/admin';


/**
 * 관리자 로그아웃
 */
export const adminLogout = async (): Promise<void> => {
    await client.post(`${BASE_URL}/logout`);
};

/**
 * 관리자 세션 체크
 */
export const checkAdminSession = async (): Promise<AdminCheckResponse> => {
    const response = await client.get<AdminCheckResponse>(`${BASE_URL}/check`);
    return response.data;
};

/**
 * 대시보드 데이터 조회
 */
export const getDashboard = async (): Promise<DashboardResponse> => {
    const response = await client.get<DashboardResponse>(`${BASE_URL}/dashboard`);
    return response.data;
};


// ========== 회원 관리 ==========

/**
 * 회원 목록 조회
 */
export const getUserList = async (
    page: number = 0,
    size: number = 10,
    search?: string
): Promise<UserListResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (search) {
        params.append('search', search);
    }

    const response = await client.get<UserListResponse>(`${BASE_URL}/users`, { params });
    return response.data;
};

/**
 * 회원 상세 조회
 */
export const getUserDetail = async (userId: number): Promise<UserManageResponse> => {
    const response = await client.get<UserManageResponse>(`${BASE_URL}/users/${userId}`);
    return response.data;
};

/**
 * 회원 상태 변경
 */
export const updateUserStatus = async (
    userId: number,
    status: UserStatusRequest
): Promise<string> => {
    const response = await client.patch<string>(`${BASE_URL}/users/${userId}/status`, status);
    return response.data;
};


// ========== 모임 관리 ==========

/**
 * 모임 목록 조회
 */
export const getMeetingList = async (
    page: number = 0,
    size: number = 10,
    search?: string,
    category?: string,
    status?: string
): Promise<MeetingListResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });

    if (search) params.append('search', search);
    if (category) params.append('category', category);
    if (status) params.append('status', status);

    const response = await client.get<MeetingListResponse>(
        `${BASE_URL}/meetings`,
        { params }
    );
    return response.data;
};

/**
 * 모임 상세 조회
 */
export const getMeetingDetail = async (meetingId: number): Promise<MeetingManageResponse> => {
    const response = await client.get<MeetingManageResponse>(
        `${BASE_URL}/meetings/${meetingId}`
    );
    return response.data;
};

/**
 * 모임 상태 변경
 */
export const updateMeetingStatus = async (
    meetingId: number,
    request: MeetingStatusRequest
): Promise<string> => {
    const response = await client.patch<string>(
        `${BASE_URL}/meetings/${meetingId}/status`,
        request
    );
    return response.data;
};

// ========== 신고 관리 API ==========

// 신고 목록 조회 (페이지네이션)
export const getReportsPaged = async (params: {
    page?: number;
    size?: number;
    status?: string;
}): Promise<ReportListResponse> => {
    const response = await client.get(`${BASE_URL}/reports/paged`, { params });
    return response.data;
};

// 신고 목록 조회 (전체 또는 상태별)
export const getReports = async (status?: string): Promise<ReportResponse[]> => {
    const params = status ? { status } : {};
    const response = await client.get(`${BASE_URL}/reports`, { params });
    return response.data;
};

// 신고 상세 조회
export const getReportById = async (reportId: number): Promise<ReportResponse> => {
    const response = await client.get(`${BASE_URL}/reports/${reportId}`);
    return response.data;
};

// 신고 상태 업데이트
export const updateReportStatus = async (
    reportId: number,
    request: ReportStatusRequest
): Promise<ReportResponse> => {
    const response = await client.patch(`${BASE_URL}/reports/${reportId}/status`, request);
    return response.data;
};

// 특정 대상의 신고 목록 조회
export const getReportsByTarget = async (
    type: 'USER' | 'MEETING',
    targetId: number
): Promise<ReportResponse[]> => {
    const response = await client.get(`${BASE_URL}/reports/target/${type}/${targetId}`);
    return response.data;
};

// ========== 1:1 문의 관리 API ==========

/**
 * 문의 목록 조회 (페이징 + 검색)
 */
export const getInquiriesPaged = async (params: {
    page?: number;
    size?: number;
    search?: string;
}): Promise<InquiryListResponse> => {
    const queryParams = new URLSearchParams({
        page: (params.page ?? 0).toString(),
        size: (params.size ?? 10).toString(),
    });

    if (params.search) {
        queryParams.append('search', params.search);
    }

    const response = await client.get<InquiryListResponse>(
        `${BASE_URL}/inquiries?${queryParams.toString()}`
    );
    return response.data;
};

/**
 * 문의 상세 조회
 */
export const getInquiryById = async (inquiryId: number): Promise<InquiryResponse> => {
    const response = await client.get<InquiryResponse>(
        `${BASE_URL}/inquiries/${inquiryId}`
    );
    return response.data;
};

/**
 * 문의 답변 작성 및 상태 변경
 * status: "PENDING" | "ANSWERED" | "CLOSED"
 * answer: 답변 내용 (선택사항)
 */
export const updateInquiryStatus = async (
    inquiryId: number,
    request: { status?: string; answer?: string }
): Promise<string> => {
    const response = await client.patch<string>(
        `${BASE_URL}/inquiries/${inquiryId}/status`,
        request
    );
    return response.data;
};

// ========== 공지사항 관리 API ==========


/**
 * 공지사항 목록 조회
 */
export const getNoticeList = async (
    page: number = 0,
    size: number = 10,
    status?: string
): Promise<NoticeListResponse> => {
    const params = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
    });
    if (status) {
        params.append('status', status);
    }

    const response = await client.get<NoticeListResponse>(
        `${BASE_URL}/announcements?${params.toString()}`
    );
    return response.data;
};

/**
 * 공지사항 상세 조회
 */
export const getNoticeDetail = async (
    noticeId: number
): Promise<NoticeResponse> => {
    const response = await client.get<NoticeResponse>(
        `${BASE_URL}/announcements/${noticeId}`
    );
    return response.data;
};

/**
 * 공지사항 생성
 */
export const createNotice = async (
    request: NoticeCreateRequest
): Promise<NoticeResponse> => {
    const response = await client.post<NoticeResponse>(
        `${BASE_URL}/announcements`,
        request
    );
    return response.data;
};

/**
 * 공지사항 수정
 */
export const updateNotice = async (
    noticeId: number,
    request: NoticeUpdateRequest
): Promise<NoticeResponse> => {
    const response = await client.put<NoticeResponse>(
        `${BASE_URL}/announcements/${noticeId}`,
        request
    );
    return response.data;
};

/**
 * 공지사항 삭제
 */
export const deleteNotice = async (
    noticeId: number
): Promise<string> => {
    const response = await client.delete<string>(
        `${BASE_URL}/announcements/${noticeId}`
    );
    return response.data;
};

/**
 * 공지사항 상단 고정 토글
 */
export const toggleNoticePin = async (
    noticeId: number
): Promise<string> => {
    const response = await client.patch<string>(
        `${BASE_URL}/announcements/${noticeId}/pin`
    );
    return response.data;
};

