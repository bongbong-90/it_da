import { useEffect, useRef, useState } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { ChatMessage } from "../../types/chat.types";

export const useWebSocket = (
  roomId: number,
  onMessageReceived: (msg: ChatMessage) => void
) => {
  const stompClient = useRef<Client | null>(null);

  useEffect(() => {
    const socket = new SockJS("http://localhost:8080/ws");
    stompClient.current = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        // 메시지 구독 (MySQL에서 저장 후 브로드캐스트된 데이터 수신)
        stompClient.current?.subscribe(`/topic/room/${roomId}`, (frame) => {
          onMessageReceived(JSON.parse(frame.body));
        });
      },
    });

    stompClient.current.activate();
    return () => stompClient.current?.deactivate();
  }, [roomId]);

  const sendMessage = (content: string, email: string) => {
    if (stompClient.current?.connected) {
      stompClient.current.publish({
        destination: `/app/chat/send/${roomId}`,
        body: JSON.stringify({ email, content }),
      });
    }
  };

  return { sendMessage };
};
