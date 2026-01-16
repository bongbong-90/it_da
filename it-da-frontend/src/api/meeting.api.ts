// src/api/meeting.api.ts
import axios from 'axios';
import { Meeting, MeetingDetail, MeetingListResponse } from '@/types/meeting.types';

const API_BASE_URL = 'http://localhost:8080/api';

// Axios 인스턴스 (세션 쿠키 포함)
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true,
});

export const meetingAPI = {
    /**
     * 전체 모임 조회 (팀원 코드와 동일)
     */
    getAllMeetings: async (): Promise<MeetingListResponse> => {
        const response = await axiosInstance.get('/meetings');
        return response.data;
    },

    /**
     * 모임 상세 조회 (새로 추가)
     */
    getMeetingById: async (id: number): Promise<MeetingDetail> => {
        const response = await axiosInstance.get(`/meetings/${id}`);
        return response.data;
    },

    /**
     * 카테고리별 조회 (새로 추가)
     */
    getMeetingsByCategory: async (category: string): Promise<MeetingListResponse> => {
        const response = await axiosInstance.get('/meetings/search', {
            params: { category },
        });
        return response.data;
    },

    /**
     * 카테고리 + 서브카테고리 조회 (새로 추가)
     */
    getMeetingsByCategoryAndSubcategory: async (
        category: string,
        subcategory: string
    ): Promise<MeetingListResponse> => {
        const response = await axiosInstance.get('/meetings/search', {
            params: { category, subcategory },
        });
        return response.data;
    },

    /**
     * 키워드 검색 (팀원 코드와 동일)
     */
    searchMeetings: async (keyword: string): Promise<MeetingListResponse> => {
        const response = await axiosInstance.get('/meetings/search', {
            params: { keyword },
        });
        return response.data;
    },
};