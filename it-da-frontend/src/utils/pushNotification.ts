// pushNotification.ts
// Push 알림 권한 요청 및 구독 관리

import React from "react";

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

// Push 알림 지원 여부 확인
export const isPushNotificationSupported = (): boolean => {
  return "serviceWorker" in navigator && "PushManager" in window;
};

// 현재 알림 권한 상태 확인
export const getNotificationPermission = (): NotificationPermission => {
  if (!("Notification" in window)) {
    return "denied";
  }
  return Notification.permission;
};

// 알림 권한 요청
export const requestNotificationPermission =
  async (): Promise<NotificationPermission> => {
    if (!("Notification" in window)) {
      console.warn("이 브라우저는 알림을 지원하지 않습니다.");
      return "denied";
    }

    try {
      const permission = await Notification.requestPermission();
      console.log("알림 권한:", permission);
      return permission;
    } catch (error) {
      console.error("알림 권한 요청 실패:", error);
      return "denied";
    }
  };

// Push 구독 생성
export const subscribeToPushNotifications = async (
  vapidPublicKey: string,
): Promise<PushSubscriptionData | null> => {
  if (!isPushNotificationSupported()) {
    console.warn("Push 알림이 지원되지 않습니다.");
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // 기존 구독 확인
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // 새 구독 생성
      const applicationServerKey = urlBase64ToUint8Array(vapidPublicKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });
    }

    // 구독 정보를 서버로 전송할 수 있는 형태로 변환
    const subscriptionData: PushSubscriptionData = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: arrayBufferToBase64(subscription.getKey("p256dh")),
        auth: arrayBufferToBase64(subscription.getKey("auth")),
      },
    };

    console.log("Push 구독 성공:", subscriptionData);
    return subscriptionData;
  } catch (error) {
    console.error("Push 구독 실패:", error);
    return null;
  }
};

// Push 구독 해제
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      const successful = await subscription.unsubscribe();
      console.log("Push 구독 해제:", successful);
      return successful;
    }

    return false;
  } catch (error) {
    console.error("Push 구독 해제 실패:", error);
    return false;
  }
};

// 로컬 알림 표시 (테스트용)
export const showLocalNotification = async (
  title: string,
  options?: NotificationOptions,
): Promise<void> => {
  if (!("Notification" in window)) {
    console.warn("이 브라우저는 알림을 지원하지 않습니다.");
    return;
  }

  if (Notification.permission !== "granted") {
    console.warn("알림 권한이 없습니다.");
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    // any 타입으로 vibrate 속성 에러 우회
    const notificationOptions: any = {
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-72x72.png",
      vibrate: [200, 100, 200],
      ...options,
    };

    await registration.showNotification(title, notificationOptions);
  } catch (error) {
    console.error("알림 표시 실패:", error);
  }
};

// 알림 템플릿 - 새 매칭
export const notifyNewMatch = async (matchName: string, matchType: string) => {
  await showLocalNotification("🎉 새로운 매칭!", {
    body: `${matchName} 모임이 추천되었습니다.`,
    tag: "new-match",
    data: { url: "/meetings", type: "match" },
  });
};

// 알림 템플릿 - 새 채팅 메시지
export const notifyNewMessage = async (
  senderName: string,
  message: string,
  chatId: string,
) => {
  await showLocalNotification(`💬 ${senderName}`, {
    body: message.length > 50 ? message.substring(0, 50) + "..." : message,
    tag: `chat-${chatId}`,
    data: { url: `/chat/${chatId}`, type: "message" },
  });
};

// 알림 템플릿 - 모임 시작 알림
export const notifyMeetingStart = async (
  meetingName: string,
  startTime: string,
) => {
  await showLocalNotification("⏰ 모임 시작 알림", {
    body: `${meetingName} 모임이 ${startTime}에 시작됩니다.`,
    tag: "meeting-reminder",
    data: { url: "/meetings", type: "reminder" },
    requireInteraction: true,
  });
};

// Helper: VAPID public key를 Uint8Array로 변환
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

// Helper: ArrayBuffer를 Base64로 변환
function arrayBufferToBase64(buffer: ArrayBuffer | null): string {
  if (!buffer) return "";

  const bytes = new Uint8Array(buffer);
  let binary = "";

  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }

  return window.btoa(binary);
}

// Push 구독 상태 확인
export const getPushSubscription =
  async (): Promise<PushSubscription | null> => {
    if (!isPushNotificationSupported()) {
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      return await registration.pushManager.getSubscription();
    } catch (error) {
      console.error("Push 구독 상태 확인 실패:", error);
      return null;
    }
  };

// React Hook으로 사용할 수 있는 알림 관리
export const usePushNotifications = () => {
  const [permission, setPermission] = React.useState<NotificationPermission>(
    getNotificationPermission(),
  );
  const [subscription, setSubscription] =
    React.useState<PushSubscription | null>(null);

  React.useEffect(() => {
    getPushSubscription().then(setSubscription);
  }, []);

  const requestPermission = async () => {
    const newPermission = await requestNotificationPermission();
    setPermission(newPermission);
    return newPermission;
  };

  const subscribe = async (vapidPublicKey: string) => {
    const subscriptionData = await subscribeToPushNotifications(vapidPublicKey);
    if (subscriptionData) {
      const newSubscription = await getPushSubscription();
      setSubscription(newSubscription);
    }
    return subscriptionData;
  };

  const unsubscribe = async () => {
    const success = await unsubscribeFromPushNotifications();
    if (success) {
      setSubscription(null);
    }
    return success;
  };

  return {
    permission,
    subscription,
    isSupported: isPushNotificationSupported(),
    requestPermission,
    subscribe,
    unsubscribe,
  };
};
