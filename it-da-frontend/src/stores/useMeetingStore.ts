// src/stores/useMeetingStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import axios from "axios";
import { meetingAPI } from "@/api/meeting.api";
import { MeetingDetail } from "@/types/meeting.types";

interface Meeting {
  meetingId: number;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  locationName: string;
  meetingTime: string;
  maxParticipants: number;
  currentParticipants: number;
  expectedCost: number;
  vibe: string;
  imageUrl?: string;
  avgRating?: number;
  organizerId: number;
}

interface RecentItem {
  id: number;
  icon: string;
  title: string;
  time: string;
  type: "chat" | "meeting";
}

interface MeetingStore {
  meetings: Meeting[];
  recentItems: RecentItem[];
  aiRecommendation: Meeting | null;
  selectedCategory: string;
  searchQuery: string;
  isLoading: boolean;
  currentMeeting: MeetingDetail | null;
  error: string | null;

  fetchMeetings: () => Promise<void>;
  fetchRecentItems: () => Promise<void>;
  fetchAIRecommendation: (userId: number) => Promise<void>;
  setCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  searchMeetings: (query: string) => Promise<void>;
  fetchMeetingById: (id: number) => Promise<void>;
  fetchMeetingsByCategory: (
    category: string,
    subcategory?: string
  ) => Promise<void>;
}

const API_BASE_URL = "http://localhost:8080/api";

const normalizeMeeting = (m: any): Meeting => ({
  meetingId: m.meetingId ?? m.meeting_id,
  title: m.title,
  description: m.description,
  category: m.category,
  subcategory: m.subcategory,
  locationName: m.locationName ?? m.location_name,
  meetingTime: m.meetingTime ?? m.meeting_time,
  maxParticipants: m.maxParticipants ?? m.max_participants,
  currentParticipants: m.currentParticipants ?? m.current_participants,
  expectedCost: m.expectedCost ?? m.expected_cost,
  vibe: m.vibe,
  imageUrl: m.imageUrl ?? m.image_url,
  avgRating: m.avgRating ?? m.avg_rating,
  organizerId:
    m.organizerId ?? m.organizer?.user_id ?? m.organizer?.userId ?? 0,
});

export const useMeetingStore = create<MeetingStore>()(
  persist(
    (set, get) => ({
      // --------------------
      // State
      // --------------------
      meetings: [],
      recentItems: [],
      aiRecommendation: null,
      selectedCategory: "전체",
      searchQuery: "",
      isLoading: false,
      currentMeeting: null,
      error: null,

      // --------------------
      // Actions
      // --------------------
      fetchMeetings: async () => {
        set({ isLoading: true });
        try {
          const response = await axios.get(`${API_BASE_URL}/meetings`);
          const meetingsData = response.data.meetings || response.data || [];

          set({
            meetings: Array.isArray(meetingsData)
              ? meetingsData.map(normalizeMeeting)
              : [],
            isLoading: false,
          });
        } catch (error) {
          console.error("❌ 모임 조회 실패:", error);
          set({ meetings: [], isLoading: false });
        }
      },

      fetchRecentItems: async () => {
        const mockData: RecentItem[] = [
          {
            id: 1,
            icon: "🌅",
            title: "한강 선셋 피크닉",
            time: "2시간 전",
            type: "chat",
          },
          {
            id: 2,
            icon: "🏃",
            title: "주말 등산 모임",
            time: "어제",
            type: "chat",
          },
          {
            id: 3,
            icon: "📚",
            title: "독서 토론회",
            time: "3일 전",
            type: "meeting",
          },
          {
            id: 4,
            icon: "🎨",
            title: "수채화 그리기",
            time: "1주일 전",
            type: "meeting",
          },
        ];
        set({ recentItems: mockData });
      },

      fetchAIRecommendation: async (userId: number) => {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/ai/recommendations/personalized/${userId}`
          );

          if (!response.data?.success) {
            set({ aiRecommendation: null });
            return;
          }

          set({
            aiRecommendation: normalizeMeeting(response.data),
          });
        } catch (error) {
          console.error("❌ AI 추천 실패:", error);
          set({ aiRecommendation: null });
        }
      },

      setCategory: (category: string) => set({ selectedCategory: category }),
      setSearchQuery: (query: string) => set({ searchQuery: query }),

      searchMeetings: async (query: string) => {
        set({ isLoading: true, searchQuery: query });
        try {
          const response = await axios.post(`${API_BASE_URL}/meetings/search`, {
            keyword: query,
            page: 0,
            size: 50,
          });

          const meetingsData = response.data.meetings || [];
          set({
            meetings: Array.isArray(meetingsData)
              ? meetingsData.map(normalizeMeeting)
              : [],
            isLoading: false,
          });
        } catch (error) {
          console.error("❌ 모임 검색 실패:", error);
          set({ meetings: [], isLoading: false });
        }
      },

      fetchMeetingById: async (id: number) => {
        set({ isLoading: true, error: null });
        try {
          const meeting = await meetingAPI.getMeetingById(id);
          set({ currentMeeting: meeting, isLoading: false });
        } catch (error) {
          set({
            error: "모임 정보를 불러오는데 실패했습니다.",
            isLoading: false,
          });
        }
      },

      fetchMeetingsByCategory: async (
        category: string,
        subcategory?: string
      ) => {
        set({ isLoading: true, error: null });
        try {
          const response = subcategory
            ? await meetingAPI.getMeetingsByCategoryAndSubcategory(
                category,
                subcategory
              )
            : await meetingAPI.getMeetingsByCategory(category);

          set({
            meetings: response.meetings || [],
            isLoading: false,
          });
        } catch (error) {
          set({
            error: "모임 목록을 불러오는데 실패했습니다.",
            isLoading: false,
          });
        }
      },
    }),
    {
      name: "meeting-storage",
      partialize: (state) => ({
        recentItems: state.recentItems,
        selectedCategory: state.selectedCategory,
      }),
    }
  )
);
