import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { authAPI } from "@/api/auth.api";
import type { SignupRequest } from "@/types/auth.types";

interface User {
  userId: number;
  email: string;
  username: string;
  nickname?: string;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authAPI.login(credentials);

          console.log("✅ 로그인 성공:", response);

          set({
            user: {
              userId: response.userId,
              email: response.email,
              username: response.username,
              nickname: response.nickname,
            },
            isAuthenticated: true,
            isLoading: false,
          });

          console.log("💾 저장된 상태:", get());
        } catch (error: any) {
          console.error("❌ 로그인 실패:", error);
          set({
            error: error?.message || "로그인 실패",
            isLoading: false,
          });
          throw error;
        }
      },

      signup: async (signupData) => {
        set({ isLoading: true, error: null });
        try {
          console.log("📤 회원가입 요청:", signupData);
          await authAPI.signup(signupData);
          set({ isLoading: false });
        } catch (error: any) {
          console.error("❌ 회원가입 실패:", error);
          set({
            error: error?.message || "회원가입 실패",
            isLoading: false,
          });
          throw error;
        }
      },

      logout: async () => {
        set({ isLoading: true });
        try {
          await authAPI.logout();
          console.log("✅ 로그아웃 완료");
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        } catch (error) {
          console.error("❌ 로그아웃 에러:", error);
          // 에러가 나도 로컬 상태는 초기화
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      checkAuth: async () => {
        console.log("🔥 checkAuth 시작");

        // ✅ 이미 로딩 중이면 실행 안 함
        if (get().isLoading) {
          console.log("⏭️ 이미 로딩 중, 스킵");
          return;
        }

        set({ isLoading: true });

        try {
          const data = await authAPI.checkSession();
          console.log("✅ 세션 확인 성공:", data);

          set({
            user: {
              userId: data.userId,
              email: data.email,
              username: data.username,
              nickname: data.nickname,
            },
            isAuthenticated: true,
            isLoading: false,
          });

          console.log("💾 업데이트된 상태:", get());
        } catch (error) {
          console.log("❌ 세션 없음 또는 만료:", error);

          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage", // localStorage key
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// ❌ 삭제 - 자동 세션 체크 제거
// if (typeof window !== "undefined") {
//   console.log("🚀 앱 시작 - 자동 세션 체크");
//   useAuthStore.getState().checkAuth();
// }
