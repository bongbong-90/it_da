package com.project.itda.domain.social.controller;

import com.project.itda.domain.social.service.ChatMessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatMessageService chatMessageService;

   // 클라이언트에서 /app/chat/{roomId}로 보낸 메시지를 처리
    @MessageMapping("/chat/send/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId,Map<String,String> message) {
        String email = (String) message.get("email"); // 실제 구현시에는 인증 세션이나 토큰에서 추출 권장
        String content = (String) message.get("content");

        // 1. 기존에 만든 서비스 로직으로 DB에 저장
        chatMessageService.saveMessage(email, roomId, content);

        // 2. 해당 방을 구독 중인 모든 클라이언트에게 실시간 메시지 전달
        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
}