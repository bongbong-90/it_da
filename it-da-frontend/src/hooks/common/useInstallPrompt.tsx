import { useState, useEffect } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

interface UseInstallPromptReturn {
  isInstallable: boolean;
  isInstalled: boolean;
  promptInstall: () => Promise<void>;
  dismissPrompt: () => void;
}

export const useInstallPrompt = (): UseInstallPromptReturn => {
  const [installPromptEvent, setInstallPromptEvent] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // PWA가 이미 설치되어 있는지 확인
    const checkIfInstalled = () => {
      // Standalone 모드로 실행 중인지 확인
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        setIsInstallable(false);
        return true;
      }

      // iOS Safari에서 홈 화면에 추가되었는지 확인
      if ((window.navigator as any).standalone === true) {
        setIsInstalled(true);
        setIsInstallable(false);
        return true;
      }

      return false;
    };

    if (checkIfInstalled()) {
      console.log("✅ PWA가 이미 설치되어 있습니다.");
      return;
    }

    // beforeinstallprompt 이벤트 리스너
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;

      console.log("💾 PWA 설치 가능!");
      setInstallPromptEvent(promptEvent);
      setIsInstallable(true);
    };

    // PWA 설치 완료 이벤트
    const handleAppInstalled = () => {
      console.log("✅ PWA 설치 완료!");
      setIsInstalled(true);
      setIsInstallable(false);
      setInstallPromptEvent(null);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // 설치 프롬프트 표시
  const promptInstall = async () => {
    if (!installPromptEvent) {
      console.warn("설치 프롬프트를 사용할 수 없습니다.");
      return;
    }

    try {
      await installPromptEvent.prompt();
      const choiceResult = await installPromptEvent.userChoice;

      if (choiceResult.outcome === "accepted") {
        console.log("✅ 사용자가 설치를 수락했습니다.");
      } else {
        console.log("❌ 사용자가 설치를 거부했습니다.");
      }

      setInstallPromptEvent(null);
      setIsInstallable(false);
    } catch (error) {
      console.error("설치 프롬프트 에러:", error);
    }
  };

  // 설치 프롬프트 닫기
  const dismissPrompt = () => {
    setIsInstallable(false);
  };

  return {
    isInstallable,
    isInstalled,
    promptInstall,
    dismissPrompt,
  };
};

// iOS 설치 안내 표시 여부 확인
export const useIOSInstallPrompt = () => {
  const [showIOSPrompt, setShowIOSPrompt] = useState(false);

  useEffect(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isInStandaloneMode =
      "standalone" in window.navigator && (window.navigator as any).standalone;

    // iOS이고 아직 설치되지 않은 경우
    if (isIOS && !isInStandaloneMode) {
      // 이전에 닫았는지 확인
      const dismissed = localStorage.getItem("ios-install-prompt-dismissed");
      if (!dismissed) {
        setShowIOSPrompt(true);
      }
    }
  }, []);

  const dismissIOSPrompt = () => {
    setShowIOSPrompt(false);
    localStorage.setItem("ios-install-prompt-dismissed", "true");
  };

  return { showIOSPrompt, dismissIOSPrompt };
};
