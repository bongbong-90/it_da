import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { chatApi } from '../../api/chat.api';
import { ChatRoomInfo } from '../../types/chat.types';

const ChatPreviewPage: React.FC = () => {
    const [rooms, setRooms] = useState<ChatRoomInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // 1. 참여 중인 채팅방 목록 가져오기 (MySQL 연동)
        const fetchRooms = async () => {
            try {
                const data = await chatApi.getRooms();
                setRooms(data);
            } catch (error) {
                console.error('방 목록 로드 실패:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchRooms();
    }, []);

    const handleRoomClick = (roomId: number) => {
        // 클릭 시 해당 채팅방 상세 페이지로 이동
        navigate(`/chat/${roomId}`);
    };

    if (isLoading) return <div className="p-10 text-center">로딩 중...</div>;

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* 헤더 */}
            <header className="p-4 border-b border-gray-100 flex justify-between items-center">
                <h1 className="text-xl font-bold text-gray-800">채팅</h1>
                <button className="text-2xl text-gray-600">🔍</button>
            </header>

            {/* 채팅방 목록 영역 */}
            <div className="flex-1 overflow-y-auto">
                {rooms.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <span className="text-4xl mb-2">💬</span>
                        <p>참여 중인 채팅방이 없습니다.</p>
                    </div>
                ) : (
                    rooms.map((room) => (
                        <div
                            key={room.roomId}
                            onClick={() => handleRoomClick(room.roomId)}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-50"
                        >
                            {/* 방 아이콘 (HTML 디자인 반영) */}
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xl shadow-sm flex-shrink-0">
                                🌅
                            </div>

                            {/* 방 정보 */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="font-bold text-gray-900 truncate">{room.roomName}</h3>
                                    <span className="text-[11px] text-gray-400">오후 2:15</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-gray-500 truncate">
                                        새로운 메시지가 있습니다.
                                    </p>
                                    {/* 알림 배지 */}
                                    <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    2
                  </span>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* 하단 탭 바 (생략 가능) */}
            <nav className="border-t border-gray-100 p-4 flex justify-around text-gray-400">
                <button>🏠</button>
                <button className="text-indigo-600">💬</button>
                <button>👥</button>
                <button>⚙️</button>
            </nav>
        </div>
    );
};

export default ChatPreviewPage;