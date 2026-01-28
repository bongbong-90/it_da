/* eslint-disable no-restricted-globals */

const CACHE_NAME = "itda-v1.0.0";
const RUNTIME_CACHE = "itda-runtime";

// 캐시할 정적 리소스 목록
const STATIC_CACHE_URLS = [
  "/",
  "/index.html",
  "/static/css/main.css",
  "/static/js/main.js",
  "/manifest.json",
  "/icons/icon-192x192.png",
  "/icons/icon-512x512.png",
];

// API 요청 캐시 전략 설정
const API_CACHE_URLS = ["/api/meetings", "/api/profile"];

// Install 이벤트 - 정적 리소스 캐싱
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Install Event");

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching static assets");
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        return self.skipWaiting(); // 즉시 활성화
      }),
  );
});

// Activate 이벤트 - 오래된 캐시 삭제
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activate Event");

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim(); // 모든 클라이언트 즉시 제어
      }),
  );
});

// Fetch 이벤트 - 네트워크 요청 처리
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // WebSocket 연결은 Service Worker에서 처리하지 않음
  if (url.protocol === "ws:" || url.protocol === "wss:") {
    return;
  }

  // API 요청: Network First 전략
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(networkFirst(request));
    return;
  }

  // 정적 리소스: Cache First 전략
  event.respondWith(cacheFirst(request));
});

// Cache First 전략 - 캐시 우선, 없으면 네트워크
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    // 성공한 응답만 캐시에 저장
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.error("[Service Worker] Fetch failed:", error);

    // 오프라인 폴백 페이지 반환 (선택사항)
    if (request.mode === "navigate") {
      const cache = await caches.open(CACHE_NAME);
      return cache.match("/index.html");
    }

    throw error;
  }
}

// Network First 전략 - 네트워크 우선, 실패하면 캐시
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);

    // API 응답 캐싱 (GET 요청만)
    if (request.method === "GET" && networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log("[Service Worker] Network failed, trying cache:", request.url);

    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    throw error;
  }
}

// Push 알림 이벤트
self.addEventListener("push", (event) => {
  console.log("[Service Worker] Push Event");

  let notificationData = {
    title: "IT-DA",
    body: "새로운 알림이 있습니다.",
    icon: "/icons/icon-192x192.png",
    badge: "/icons/icon-72x72.png",
    actions: [],
  };

  if (event.data) {
    try {
      notificationData = event.data.json();
    } catch (error) {
      notificationData.body = event.data.text();
    }
  }

  // 알림 타입에 따라 actions 추가
  const actions = notificationData.actions || [];
  if (notificationData.type === "match") {
    actions.push(
      { action: "view", title: "보러가기", icon: "/icons/icon-72x72.png" },
      { action: "close", title: "닫기" },
    );
  } else if (notificationData.type === "message") {
    actions.push(
      { action: "view", title: "보기", icon: "/icons/icon-72x72.png" },
      { action: "close", title: "닫기" },
    );
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, {
      body: notificationData.body,
      icon: notificationData.icon,
      badge: notificationData.badge,
      vibrate: [200, 100, 200],
      tag: notificationData.tag || "default",
      data: notificationData.data,
      actions: actions,
      requireInteraction: notificationData.requireInteraction || false,
    }),
  );
});

// 알림 클릭 이벤트
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification Click:", event.action);

  event.notification.close();

  // action이 'close'면 아무것도 하지 않음
  if (event.action === "close") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    self.clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열린 창이 있으면 포커스
        for (const client of clientList) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }

        // 없으면 새 창 열기
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      }),
  );
});

// Background Sync 이벤트 (오프라인 데이터 동기화)
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background Sync:", event.tag);

  if (event.tag === "sync-messages") {
    event.waitUntil(syncMessages());
  }
});

async function syncMessages() {
  // IndexedDB에서 미전송 메시지 가져와서 전송
  console.log("[Service Worker] Syncing messages...");
  // 실제 구현은 IndexedDB와 연동 필요
}

// Periodic Background Sync (실험적 기능)
self.addEventListener("periodicsync", (event) => {
  if (event.tag === "update-meetings") {
    event.waitUntil(updateMeetings());
  }
});

async function updateMeetings() {
  console.log("[Service Worker] Updating meetings...");
  // 주기적으로 새 모임 정보 업데이트
}
