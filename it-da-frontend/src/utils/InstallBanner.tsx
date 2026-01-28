import React from "react";
import {
  useInstallPrompt,
  useIOSInstallPrompt,
} from "../hooks/common/useInstallPrompt";

// Android/Desktop 설치 배너
export const InstallBanner: React.FC = () => {
  const { isInstallable, promptInstall, dismissPrompt } = useInstallPrompt();

  if (!isInstallable) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg z-50">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center">
            <img
              src="/icons/icon-192x192.png"
              alt="IT-DA"
              className="w-10 h-10"
            />
          </div>
          <div>
            <h3 className="font-bold text-lg">IT-DA 앱 설치</h3>
            <p className="text-sm opacity-90">
              홈 화면에 추가하고 빠르게 접속하세요!
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={dismissPrompt}
            className="px-4 py-2 text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            나중에
          </button>
          <button
            onClick={promptInstall}
            className="px-6 py-2 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors"
          >
            설치하기
          </button>
        </div>
      </div>
    </div>
  );
};

// iOS 설치 안내 모달
export const IOSInstallPrompt: React.FC = () => {
  const { showIOSPrompt, dismissIOSPrompt } = useIOSInstallPrompt();

  if (!showIOSPrompt) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50 animate-fadeIn">
      <div className="bg-white rounded-t-3xl w-full max-w-md p-6 animate-slideUp">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-3">
            <img
              src="/icons/icon-192x192.png"
              alt="IT-DA"
              className="w-12 h-12 rounded-xl"
            />
            <div>
              <h3 className="font-bold text-lg text-gray-900">IT-DA 설치</h3>
              <p className="text-sm text-gray-600">홈 화면에 추가하기</p>
            </div>
          </div>
          <button
            onClick={dismissIOSPrompt}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700">
            IT-DA를 홈 화면에 추가하면 앱처럼 사용할 수 있어요!
          </p>

          <div className="bg-gray-50 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-sm font-bold">1</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium">공유 버튼 탭하기</p>
                <p className="text-sm text-gray-600">
                  Safari 하단의{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-200 rounded text-xs mx-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </span>{" "}
                  버튼을 눌러주세요
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-sm font-bold">2</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium">
                  "홈 화면에 추가" 선택
                </p>
                <p className="text-sm text-gray-600">
                  메뉴에서{" "}
                  <span className="inline-flex items-center px-1.5 py-0.5 bg-gray-200 rounded text-xs mx-1">
                    <svg
                      className="w-3 h-3"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" />
                    </svg>
                  </span>{" "}
                  아이콘을 찾아주세요
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-indigo-600 text-sm font-bold">3</span>
              </div>
              <div>
                <p className="text-gray-800 font-medium">"추가" 버튼 탭</p>
                <p className="text-sm text-gray-600">
                  우측 상단의 "추가" 버튼을 눌러주세요
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={dismissIOSPrompt}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
          >
            알겠어요!
          </button>
        </div>
      </div>
    </div>
  );
};

// 간단한 설치 버튼 (헤더나 설정에서 사용)
export const InstallButton: React.FC = () => {
  const { isInstallable, isInstalled, promptInstall } = useInstallPrompt();

  if (isInstalled) {
    return (
      <div className="flex items-center gap-2 text-green-600 text-sm">
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
        <span className="font-medium">설치됨</span>
      </div>
    );
  }

  if (!isInstallable) return null;

  return (
    <button
      onClick={promptInstall}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
        />
      </svg>
      <span className="font-medium">앱 설치</span>
    </button>
  );
};
