import axios from 'axios';
import type {
    NoticeListResponse,
    NoticeResponse
} from '../types/admin.types';

const BASE_URL = '/api/public';

/**
 * 공개 공지사항 목록 조회 (인증 불필요)
 */
export const getPublicNoticeList = async (
    page: number = 0,
    size: number = 10
): Promise<NoticeListResponse> => {
    const response = await axios.get<NoticeListResponse>(
        `${BASE_URL}/announcements`,
        {
            params: {
                page,
                size,
                status: 'PUBLISHED',
            },
        }
    );

    return response.data;
};

/**
 * 공개 공지사항 상세 조회 (인증 불필요)
 */
export const getPublicNoticeDetail = async (
    noticeId: number
): Promise<NoticeResponse> => {
    const response = await axios.get<NoticeResponse>(
        `${BASE_URL}/announcements/${noticeId}`
    );
    return response.data;
};