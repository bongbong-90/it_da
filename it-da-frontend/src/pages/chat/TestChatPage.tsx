// TestChatPage.tsx - 수정된 전체 코드

import React, { useEffect, useState } from "react";
import { useAuthStore } from "@/stores/useAuthStore.ts";
import axios from "axios";
import "./ChatRoomPage.css";
import "@/components/chat/ChatMemberList.css";
import "@/components/chat/BillInputModal.css";
import "@/components/chat/VoteCreateModal.css"
import "@/components/chat/ImageMessage.css";
import "@/components/chat/VoteMessage.css";


interface ChatRoomResponse {
    chatRoomId: number;
    roomName: string;
    participantCount: number;
    maxParticipants: number;
    lastMessage: string | null;
    lastMessageTime: string | null;
    category: string | null;
    imageUrl: string | null;
    locationName: string | null;
}

const TestChatPage: React.FC = () => {
    const { user } = useAuthStore();
    const [rooms, setRooms] = useState<ChatRoomResponse[]>([]);
    const [newRoomName, setNewRoomName] = useState("");
    const [loading, setLoading] = useState(false);

    const fetchRooms = async () => {
        try {
            const response = await axios.get("http://localhost:8080/api/social/chat/rooms", {
                params: { userId: user?.userId },
                withCredentials: true,
            });

            console.log("📋 채팅방 목록 응답:", response.data);
            const roomData = Array.isArray(response.data) ? response.data : (response.data.content || []);
            setRooms(roomData);
        } catch (error) {
            console.error("❌ 채팅방 목록 조회 실패:", error);
            setRooms([]);
        }
    };

    const createRoom = async () => {
        if (!newRoomName.trim()) return;
        setLoading(true);
        try {
            await axios.post("http://localhost:8080/api/social/chat/rooms", {
                roomName: newRoomName,
                maxParticipants: 10,
                creatorId: user?.userId,
            });
            setNewRoomName("");
            fetchRooms();
        } catch (error) {
            console.error("방 생성 실패:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRooms();
    }, [user]);

    if (!user) {
        return (
            <div style={{ padding: "20px", textAlign: "center" }}>
                <h2>로그인이 필요합니다</h2>
                <button onClick={() => (window.location.href = "/login")}>
                    로그인하기
                </button>
            </div>
        );
    }

    const cleanDuplicateName = (text: string | null) => {
        if (!text) return "최근 대화 내용이 없습니다.";

        console.log("🔍 원본 메시지:", text);

        // "신의진신의진" 같은 패턴 찾기
        const mid = Math.floor(text.length / 2);
        const firstHalf = text.substring(0, mid);
        const secondHalf = text.substring(mid);

        if (firstHalf === secondHalf && firstHalf.length > 0) {
            console.log("✅ 중복 발견! 앞부분만 반환:", firstHalf);
            return firstHalf;
        }

        // 정규식으로 반복 패턴 제거
        const cleaned = text.replace(/^(.+)\1+$/, '$1');
        console.log("✅ 정제된 메시지:", cleaned);
        return cleaned;
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#f8f9fa' }}>
            <header className="header">
                <div className="header-content">
                    <div className="header-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <button className="back-btn" onClick={() => window.history.back()} style={{ flexShrink: 0 }}>
                            ←
                        </button>
                        <div className="header-info">
                            <div className="room-title">💬 내 채팅 목록</div>
                            <div className="room-meta">참여 중인 모임을 확인하세요</div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="notice-banner" style={{ display: 'flex', gap: '10px', padding: '1rem' }}>
                <input
                    type="text"
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    placeholder="새로운 채팅방 이름을 입력하세요"
                    style={{
                        flex: 1,
                        padding: '10px 15px',
                        borderRadius: '20px',
                        border: '1px solid #ddd',
                        outline: 'none'
                    }}
                />
                <button
                    onClick={createRoom}
                    style={{ width: 'auto', padding: '0 20px', borderRadius: '20px', backgroundColor: '#667eea', color: 'white', border: 'none' }}
                    disabled={loading}
                >
                    {loading ? "생성 중..." : "방 만들기"}
                </button>
            </div>

            <main style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                {rooms.map((room) => (
                    <div
                        key={room.chatRoomId}
                        className="ai-banner"
                        style={{
                            marginBottom: '15px',
                            borderRadius: '15px',
                            cursor: 'pointer',
                            display: 'flex',
                            justifyContent: 'space-between',
                            color: 'white',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                        }}
                        onClick={() => window.location.href = `/chat/${room.chatRoomId}`}
                    >
                        <div className="ai-banner-content">
                            <div className="ai-banner-title">
                                {room.roomName}
                                <span style={{ fontSize: '0.8rem', opacity: 0.8, marginLeft: '8px' }}>
                                    ({room.participantCount}/{room.maxParticipants})
                                </span>
                            </div>
                            <div className="ai-banner-subtitle">
                                {cleanDuplicateName(room.lastMessage)}
                            </div>
                        </div>
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', opacity: 0.8 }}>
                            {room.lastMessageTime
                                ? new Date(room.lastMessageTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
                                : ""}
                            <div style={{ marginTop: '5px', fontSize: '1.2rem' }}>→</div>
                        </div>
                    </div>
                ))}

                {rooms.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '50px 20px', color: '#adb5bd' }}>
                        <div style={{ fontSize: '3rem', marginBottom: '10px' }}>💬</div>
                        <p>참여 중인 채팅방이 없습니다.</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default TestChatPage;