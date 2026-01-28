// src/hooks/notification/useNotificationWebSocket.ts
import React, { useEffect, useRef } from 'react';
import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useAuthStore } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import toast from 'react-hot-toast';
import { router } from '@/router/index';

const API_BASE_URL = "http://localhost:8080";

export const useNotificationWebSocket = () => {
    const user = useAuthStore((state) => state.user);
    const addNotification = useNotificationStore((state) => state.addNotificationFromBackend);
    const clientRef = useRef<Client | null>(null);

    useEffect(() => {
        if (!user?.userId) return;

        const client = new Client({
            webSocketFactory: () => new SockJS(`${API_BASE_URL}/ws`),
            reconnectDelay: 5000,
            onConnect: () => {
                console.log(`✅ 알림 서버 연결 성공 (UserId: ${user.userId})`);

                client.subscribe(`/topic/notification/${user.userId}`, (message: IMessage) => {
                    if (message.body) {
                        try {
                            const newNotification = JSON.parse(message.body);
                            console.log("📨 실시간 알림 수신:", newNotification);

                            addNotification(newNotification);

                            // 이동할 경로 확인 (linkUrl 또는 url 호환성 체크)
                            const targetUrl = newNotification.linkUrl || newNotification.url;

                            // 🔥 핵심: JSX(<div...>) 대신 React.createElement 사용
                            toast(
                                (t) => {
                                    return React.createElement(
                                        'div', // 태그 이름
                                        {
                                            // 1. 클릭 이벤트 (이동 로직)
                                            onClick: () => {
                                                if (targetUrl) {
                                                    console.log("🔗 이동:", targetUrl);
                                                    router.navigate(targetUrl).catch(() => {
                                                        window.location.href = targetUrl;
                                                    });
                                                }
                                                toast.dismiss(t.id);
                                            },
                                            // 2. 스타일 설정
                                            style: {
                                                cursor: 'pointer',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                gap: '4px',
                                                width: '100%'
                                            }
                                        },
                                        // 3. 자식 요소들 (제목, 내용)
                                        [
                                            React.createElement('div', {
                                                style: { fontWeight: 'bold', fontSize: '0.95rem' },
                                                key: 'title'
                                            }, newNotification.title || "알림"),

                                            React.createElement('div', {
                                                style: { fontSize: '0.85rem' },
                                                key: 'content'
                                            }, newNotification.content || "새로운 알림이 도착했습니다!")
                                        ]
                                    );
                                },
                                {
                                    duration: 5000,
                                    position: 'top-right',
                                    style: {
                                        background: '#333',
                                        color: '#fff',
                                        borderRadius: '12px',
                                        padding: '12px 16px',
                                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                                    },
                                }
                            );

                        } catch (e) {
                            console.error("알림 처리 에러:", e);
                        }
                    }
                });
            },
            onStompError: (frame) => {
                console.error('Broker error:', frame.headers['message']);
            },
        });

        client.activate();
        clientRef.current = client;

        return () => {
            if (client.connected) client.deactivate();
        };
    }, [user?.userId, addNotification]);
};