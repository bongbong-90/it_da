import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icon-192x192.png", "icon-512x512.png"],
      manifest: {
        name: "IT-DA - AI 모임 매칭 플랫폼",
        short_name: "IT-DA",
        description: "AI 기반 취향 맞춤 모임 추천 서비스",
        theme_color: "#4F46E5",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/icon-192x192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
        categories: ["social", "lifestyle"],
        shortcuts: [
          {
            name: "새 모임 찾기",
            short_name: "모임 찾기",
            url: "/meetings",
            icons: [{ src: "/icon-192x192.png", sizes: "192x192" }],
          },
        ],
      },
      workbox: {
        // API 요청 캐싱 전략
        runtimeCaching: [
          {
            // API 요청 (localhost:8080)
            urlPattern: /^http:\/\/localhost:8080\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5분
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // 이미지 캐싱
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 30 * 24 * 60 * 60, // 30일
              },
            },
          },
          {
            // 폰트 캐싱
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "font-cache",
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 365 * 24 * 60 * 60, // 1년
              },
            },
          },
          {
            // 외부 API (카카오 맵 등)
            urlPattern: /^https:\/\/(dapi\.kakao\.com|t1\.daumcdn\.net)\/.*/i,
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "external-api-cache",
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 24 * 60 * 60, // 1일
              },
            },
          },
        ],
        // 오프라인 폴백
        navigateFallback: "/index.html",
        navigateFallbackDenylist: [/^\/api/],
      },
      devOptions: {
        enabled: true, // 개발 모드에서도 PWA 테스트 가능
        type: "module",
        suppressWarnings: true, // ← 이 줄 추가
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    proxy: {
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
    },
  },
  define: {
    global: "window",
  },
});
