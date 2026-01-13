import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useChatStore } from "../../stores/useChatStore";
import { useWebSocket } from "../../hooks/chat/useWebSocket";
import { chatApi } from "../../api/chat.api";
import ChatInput from "../../components/chat/ChatInput";
import ChatMessageItem from "../../components/chat/ChatMessage";
import ChatMemberList from "../../components/chat/ChatMemberList";

const ChatRoomPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const { messages, addMessage, setMessages } = useChatStore();
  const [isMenuOpen, setIsMenuOpen] = useState<any>(null);

  // 1. 과거 내역 조회 (MySQL)
  useEffect(() => {
    const initChat = async () => {
      const history = await chatApi.getChatMessages(Number(roomId));
      setMessages(history);
    };
    initChat();
  }, [roomId,setMessages]);

  // 2. 실시간 연결 (WebSocket)
  const { sendMessage } = useWebSocket(Number(roomId), (newMsg) => {
    addMessage(newMsg);
  });

    return (
        <div className="flex flex-col h-screen bg-gray-50 relative">
            {/* 헤더: 메뉴 버튼 포함 */}
            <header className="p-4 bg-white border-b flex justify-between items-center">
                <h2 className="font-bold">채팅방 {roomId}</h2>
                <button onClick={() => setIsMenuOpen(!isMenuOpen)}>☰</button>
            </header>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, idx) => (
                    <ChatMessageItem
                        key={msg.id || idx}
                        message={msg}
                        isMine={msg.senderEmail === "my-email@test.com"}
                    />
                ))}
            </div>

            {/* ChatInput의 Props 형식을 정의된 컴포넌트와 일치시킵니다 */}
            <ChatInput
                onSend={(text) => sendMessage(text, "my-email@test.com")}
                onShowFeature={(feature) => alert(feature)}
            />

            {/* 사이드 메뉴 렌더링 */}
            {isMenuOpen && (
                <div className="absolute right-0 top-0 w-64 h-full bg-white shadow-xl z-50 p-4">
                    <ChatMemberList members={[]} onFollow={()=>{}} onReport={()=>{}} />
                </div>
            )}
        </div>
    );
};

export default ChatRoomPage;
