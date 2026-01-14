import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/home/HomePage";
import LoginPage from "@/pages/auth/LoginPage";
import SignupPage from "@/pages/auth/SignupPage";
import AIMatchingPage from "@/pages/ai/AiMatchingPage";
import ProtectedRoute from "./ProtectedRoute";
import PublicRoute from "./PublicRoute";
import OAuth2CallbackPage from "@/pages/auth/OAuth2CallbackPage";
import ChatRoomPage from "@/pages/chat/ChatRoomPage";
import TestChatPage from "@/pages/chat/TestChatPage.tsx";

export const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <HomePage />,
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
      element: <AIMatchingPage />,
    },
    {
      // 2. 백엔드에서 단순히 /auth/callback으로만 보낼 경우 (404 방지)
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
          path: "/test-chat",  // ✅ 추가
          element: (
              <ProtectedRoute>
                  <TestChatPage/>
              </ProtectedRoute>
          ),
      },
  ],

  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  } as any
);
