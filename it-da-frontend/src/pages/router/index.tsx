import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/home/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import AIMatchingPage from "@/pages/ai/AiMatchingPage";
import MyPage from "@/pages/mypage/MyPage";
import ProfileEditPage from "@/pages/mypage/components/ProfileEditPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import OAuth2CallbackPage from "@/pages/auth/OAuth2CallbackPage";
import ChatRoomPage from "@/pages/chat/ChatRoomPage";
import TestChatPage from "@/pages/chat/TestChatPage.tsx";
import MeetingCreatePage from "@/pages/meeting/MeetingCreatePage";
import MeetingDetailPage from "@/pages/meeting/MeetingDetailPage";
import { PreferenceGuard } from "@/components/auth/PreferenceGuard.tsx";
import UserPreferenceSetupPage from "@/pages/auth/UserPreferenceSetupPage.tsx";
import CategoryListPage from "@/pages/category/CategoryListPage";
import CategoryDetailPage from "@/pages/category/CategoryDetailPage";
import MeetingListPage from "@/pages/meeting/MeetingListPage";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: (
        <PreferenceGuard>
          <HomePage />
        </PreferenceGuard>
      ),
    },
    {
      path: "/user-preference/setup",
      element: (
        <ProtectedRoute>
          <UserPreferenceSetupPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/login",
      element: (
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      ),
    },
    {
      path: "/signup",
      element: (
        <PublicRoute>
          <SignupPage />
        </PublicRoute>
      ),
    },
    {
      path: "/ai-matching",
      element: (
        <PreferenceGuard>
          {" "}
          {/* ✅ 매칭 서비스 이용 전 성향표 체크 */}
          <ProtectedRoute>
            <AIMatchingPage />
          </ProtectedRoute>
        </PreferenceGuard>
      ),
    },
    {
      path: "/my-meetings",
      element: <MyPage />,
    },
    {
      path: "/mypage",
      element: <MyPage />,
    },
    {
      path: "/profile",
      element: <MyPage />,
    },
    {
      path: "/profile/edit",
      element: <ProfileEditPage />,
    },
    {
      path: "/auth/callback",
      element: <OAuth2CallbackPage />,
    },
    {
      path: "/chat/:roomId",
      element: (
        <ProtectedRoute>
          <ChatRoomPage />
        </ProtectedRoute>
      ),
    },
    {
      path: "/test-chat", // ✅ 추가
      element: (
        <ProtectedRoute>
          <TestChatPage />
        </ProtectedRoute>
      ),
    },
    // ✅ 모임 생성 페이지
    {
      path: "meetings/create",
      element: (
        <ProtectedRoute>
          <MeetingCreatePage />
        </ProtectedRoute>
      ),
    },
    {
      path: "meetings/:meetingId",
      element: <MeetingDetailPage />,
    },
    {
      path: "/category",
      element: <CategoryListPage />,
    },
    {
      path: "/category/:category",
      element: <CategoryDetailPage />,
    },
    {
      path: "/meetings",
      element: <MeetingListPage />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  } as any
);
