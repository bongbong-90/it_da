import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  // ✅ 단순하게: 인증 안되면 → 로그인
  if (!isAuthenticated) {
    console.log("🚫 인증 안됨 → /login 리다이렉트");
    return <Navigate to="/login" replace />;
  }

  console.log("✅ 인증됨 → 페이지 렌더링");
  return <>{children}</>;
};

export default ProtectedRoute;
