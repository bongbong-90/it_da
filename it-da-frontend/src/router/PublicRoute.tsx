import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthStore } from "@/stores/useAuthStore";

interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();

  if (isAuthenticated) {
    console.log("✅ 이미 로그인됨 → / 리다이렉트");
    return <Navigate to="/" replace />;
  }

  console.log("🔓 비로그인 → 로그인 페이지 렌더링");
  return <>{children}</>;
};

export default PublicRoute;
