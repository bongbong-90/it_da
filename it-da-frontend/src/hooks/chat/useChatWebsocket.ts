// src/hooks/chat/useChatWebsocket.ts
import { useChatStore, ChatMessage as StoreMessageType } from "@/stores/useChatStore"; // 스토어 타입 명시
import { useWebSocket } from "@/hooks/chat/useWebSocket";

export const useChatWebsocket = (roomId: number) => {
    const { addMessage } = useChatStore();

    // useWebSocket에서 수신된 데이터를 StoreMessageType으로 매핑
    const { sendMessage } = useWebSocket(roomId, (msg) => {
        // 백엔드 응답(ChatMessageResponse) 구조를 스토어 인터페이스에 맞춰 변환
        // msg의 타입이 chat.types.ts 기준이므로 스토어 형식인 messageId 등으로 맞춰줍니다.
        const formattedMsg: StoreMessageType = {
            messageId: msg.id || 0,
            senderId: 0, // 필요 시 msg 내 유저 ID 필드로 매핑
            senderNickname: msg.senderName || "익명",
            content: msg.content,
            type: msg.type,
            sentAt: msg.createdAt,
            unreadCount: msg.unreadCount || 0,
            metadata: msg.metadata
        };

        addMessage(formattedMsg);
    });

    return { sendMessage };
};