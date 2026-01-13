import { Client, IMessage } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import axios from 'axios';

export interface ChatMessage {
    id?: number;
    senderEmail: string;
    senderName?: string;
    content: string;
    roomId: number;
    createdAt?: string;
}

class ChatApi {
    private client: Client | null = null;

    async getRooms() {
        const response = await axios.get('/api/social/rooms');
        return response.data;
    }

    async getChatMessages(roomId: number) {
        const response = await axios.get(`/api/social/messages/${roomId}`);
        return response.data;
    }

    connect(roomId: number, onMessageReceived: (msg: ChatMessage) => void) {
        // 1. SockJS 사용: 변수를 생성자에서 호출하여 TS6133 해결
        const socket = new SockJS('http://localhost:8080/ws');

        this.client = new Client({
            webSocketFactory: () => socket, // 여기서 SockJS가 사용됨
            debug: (str) => console.log(str),
            onConnect: () => {
                console.log(`채팅방 ${roomId} 연결 성공`);

                // 2. IMessage 사용: 콜백 인자의 타입을 정의하여 TS6133 해결
                this.client?.subscribe(`/topic/room/${roomId}`, (message: IMessage) => {
                    onMessageReceived(JSON.parse(message.body));
                });
            },
        });
        this.client.activate();
    }

    sendMessage(roomId: number, email: string, content: string) {
        if (this.client?.connected) {
            const payload: ChatMessage = {
                senderEmail: email,
                content: content,
                roomId: roomId
            };
            this.client.publish({
                destination: `/app/chat/send/${roomId}`,
                body: JSON.stringify(payload),
            });
        }
    }

    disconnect() {
        this.client?.deactivate();
    }
}

export const chatApi = new ChatApi();