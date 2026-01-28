// offlineStorage.ts
// IndexedDB를 사용한 오프라인 데이터 관리

const DB_NAME = "itda-offline-db";
const DB_VERSION = 1;

// 저장소 이름들
export const STORES = {
  MEETINGS: "meetings",
  MESSAGES: "messages",
  PENDING_ACTIONS: "pending-actions",
  USER_PROFILE: "user-profile",
  CACHED_RECOMMENDATIONS: "cached-recommendations",
} as const;

interface PendingAction {
  id: string;
  type: "send-message" | "create-meeting" | "join-meeting" | "update-profile";
  data: any;
  timestamp: number;
  retryCount: number;
}

// IndexedDB 초기화
export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Meetings 저장소
      if (!db.objectStoreNames.contains(STORES.MEETINGS)) {
        const meetingStore = db.createObjectStore(STORES.MEETINGS, {
          keyPath: "id",
        });
        meetingStore.createIndex("category", "category", { unique: false });
        meetingStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // Messages 저장소
      if (!db.objectStoreNames.contains(STORES.MESSAGES)) {
        const messageStore = db.createObjectStore(STORES.MESSAGES, {
          keyPath: "id",
        });
        messageStore.createIndex("chatId", "chatId", { unique: false });
        messageStore.createIndex("timestamp", "timestamp", { unique: false });
        messageStore.createIndex("isSent", "isSent", { unique: false });
      }

      // Pending Actions 저장소 (오프라인 중 발생한 액션들)
      if (!db.objectStoreNames.contains(STORES.PENDING_ACTIONS)) {
        const actionStore = db.createObjectStore(STORES.PENDING_ACTIONS, {
          keyPath: "id",
        });
        actionStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      // User Profile 저장소
      if (!db.objectStoreNames.contains(STORES.USER_PROFILE)) {
        db.createObjectStore(STORES.USER_PROFILE, { keyPath: "userId" });
      }

      // Cached Recommendations 저장소
      if (!db.objectStoreNames.contains(STORES.CACHED_RECOMMENDATIONS)) {
        const recStore = db.createObjectStore(STORES.CACHED_RECOMMENDATIONS, {
          keyPath: "id",
        });
        recStore.createIndex("userId", "userId", { unique: false });
        recStore.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
  });
};

// 데이터 저장
export const saveData = async <T>(
  storeName: string,
  data: T,
): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.put(data);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 데이터 가져오기
export const getData = async <T>(
  storeName: string,
  key: IDBValidKey,
): Promise<T | undefined> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 모든 데이터 가져오기
export const getAllData = async <T>(storeName: string): Promise<T[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 데이터 삭제
export const deleteData = async (
  storeName: string,
  key: IDBValidKey,
): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.delete(key);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 저장소 전체 비우기
export const clearStore = async (storeName: string): Promise<void> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readwrite");
    const store = transaction.objectStore(storeName);
    const request = store.clear();

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// 인덱스로 데이터 검색
export const getDataByIndex = async <T>(
  storeName: string,
  indexName: string,
  indexValue: IDBValidKey,
): Promise<T[]> => {
  const db = await initDB();

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([storeName], "readonly");
    const store = transaction.objectStore(storeName);
    const index = store.index(indexName);
    const request = index.getAll(indexValue);

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// 오프라인 액션 추가
export const addPendingAction = async (
  type: PendingAction["type"],
  data: any,
): Promise<void> => {
  const action: PendingAction = {
    id: `${type}-${Date.now()}-${Math.random()}`,
    type,
    data,
    timestamp: Date.now(),
    retryCount: 0,
  };

  await saveData(STORES.PENDING_ACTIONS, action);
  console.log("오프라인 액션 저장:", action);

  // Background Sync 등록 (지원되는 경우)
  if (
    "serviceWorker" in navigator &&
    "sync" in ServiceWorkerRegistration.prototype
  ) {
    try {
      const registration = await navigator.serviceWorker.ready;
      // @ts-ignore - sync API는 실험적 기능
      await registration.sync.register("sync-pending-actions");
      console.log("Background Sync 등록 완료");
    } catch (error) {
      console.error("Background Sync 등록 실패:", error);
    }
  }
};

// 대기 중인 액션 모두 가져오기
export const getPendingActions = async (): Promise<PendingAction[]> => {
  return await getAllData<PendingAction>(STORES.PENDING_ACTIONS);
};

// 대기 중인 액션 실행 및 삭제
export const processPendingActions = async (
  executeAction: (action: PendingAction) => Promise<boolean>,
): Promise<void> => {
  const actions = await getPendingActions();

  for (const action of actions) {
    try {
      const success = await executeAction(action);

      if (success) {
        await deleteData(STORES.PENDING_ACTIONS, action.id);
        console.log("액션 처리 완료:", action.id);
      } else {
        // 실패 시 재시도 카운트 증가
        action.retryCount += 1;

        if (action.retryCount >= 3) {
          // 3번 실패하면 삭제
          await deleteData(STORES.PENDING_ACTIONS, action.id);
          console.error("액션 처리 실패 (최대 재시도 초과):", action.id);
        } else {
          await saveData(STORES.PENDING_ACTIONS, action);
        }
      }
    } catch (error) {
      console.error("액션 처리 중 오류:", error);
    }
  }
};

// 오프라인 메시지 저장
export const saveOfflineMessage = async (message: any): Promise<void> => {
  await saveData(STORES.MESSAGES, {
    ...message,
    isSent: false,
    timestamp: Date.now(),
  });

  await addPendingAction("send-message", message);
};

// 채팅방의 메시지들 가져오기
export const getChatMessages = async (chatId: string): Promise<any[]> => {
  return await getDataByIndex(STORES.MESSAGES, "chatId", chatId);
};

// 모임 데이터 캐싱
export const cacheMeetings = async (meetings: any[]): Promise<void> => {
  for (const meeting of meetings) {
    await saveData(STORES.MEETINGS, meeting);
  }
  console.log(`${meetings.length}개 모임 캐싱 완료`);
};

// 캐시된 모임 가져오기
export const getCachedMeetings = async (): Promise<any[]> => {
  return await getAllData(STORES.MEETINGS);
};

// 사용자 프로필 캐싱
export const cacheUserProfile = async (profile: any): Promise<void> => {
  await saveData(STORES.USER_PROFILE, profile);
};

// 캐시된 프로필 가져오기
export const getCachedUserProfile = async (
  userId: string,
): Promise<any | undefined> => {
  return await getData(STORES.USER_PROFILE, userId);
};

// AI 추천 결과 캐싱
export const cacheRecommendations = async (
  userId: string,
  recommendations: any[],
): Promise<void> => {
  const cachedData = {
    id: `rec-${userId}-${Date.now()}`,
    userId,
    recommendations,
    timestamp: Date.now(),
  };

  await saveData(STORES.CACHED_RECOMMENDATIONS, cachedData);
};

// 캐시된 추천 가져오기 (최신 것만)
export const getCachedRecommendations = async (
  userId: string,
): Promise<any[] | null> => {
  const allRecs = await getDataByIndex<any>(
    STORES.CACHED_RECOMMENDATIONS,
    "userId",
    userId,
  );

  if (allRecs.length === 0) return null;

  // 가장 최신 추천만 반환
  const latest = allRecs.reduce((prev, current) =>
    prev.timestamp > current.timestamp ? prev : current,
  );

  // 24시간 이내의 추천만 유효
  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
  if (latest.timestamp < oneDayAgo) {
    return null;
  }

  return latest.recommendations;
};

// 오래된 캐시 정리 (7일 이상 된 데이터)
export const cleanOldCache = async (): Promise<void> => {
  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;

  // 오래된 모임 삭제
  const meetings = await getAllData<any>(STORES.MEETINGS);
  for (const meeting of meetings) {
    if (meeting.timestamp && meeting.timestamp < sevenDaysAgo) {
      await deleteData(STORES.MEETINGS, meeting.id);
    }
  }

  // 오래된 추천 삭제
  const recommendations = await getAllData<any>(STORES.CACHED_RECOMMENDATIONS);
  for (const rec of recommendations) {
    if (rec.timestamp < sevenDaysAgo) {
      await deleteData(STORES.CACHED_RECOMMENDATIONS, rec.id);
    }
  }

  console.log("오래된 캐시 정리 완료");
};

// 전체 DB 초기화 (로그아웃 시)
export const clearAllData = async (): Promise<void> => {
  const db = await initDB();
  const storeNames = Array.from(db.objectStoreNames);

  for (const storeName of storeNames) {
    await clearStore(storeName);
  }

  console.log("모든 오프라인 데이터 삭제 완료");
};
