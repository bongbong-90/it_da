package com.project.itda.domain.social.controller;

import com.project.itda.domain.social.enums.MessageType;
import com.project.itda.domain.social.repository.ChatParticipantRepository;
import com.project.itda.domain.social.service.ChatMessageService;
import com.project.itda.domain.social.service.ChatRoomService;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.DestinationVariable;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.stereotype.Controller;
import java.util.Map;

@Controller
@RequiredArgsConstructor
public class ChatStompController {

    private final ChatParticipantRepository chatParticipantRepository;
    private final SimpMessageSendingOperations messagingTemplate;
    private final ChatMessageService chatMessageService;
    private final ChatRoomService chatRoomService;
    private final UserRepository userRepository;


    // ChatStompController.java 수정
    @MessageMapping("/chat/send/{roomId}")
    public void sendMessage(@DestinationVariable Long roomId, Map<String, Object> message, SimpMessageHeaderAccessor headerAccessor) {
        String email =(String) message.get("email");
        User sender = userRepository.findByEmail(email).orElseThrow();

        chatRoomService.updateLastReadAt(roomId, email);

        String finalNickname = (sender.getNickname() != null && !sender.getNickname().trim().isEmpty())
                ? sender.getNickname()
                : sender.getUsername();

        // 💡 1. 자신의 상태를 먼저 DB에 반영 (인원수 카운트 정확도 향상)
        long totalparticipants = chatParticipantRepository.countByChatRoomId(roomId);
        int initialUnreadCount =(int) Math.max(0, totalparticipants - 1);

        // ✅ 2. 데이터 타입에 맞게 값 설정 (String.valueOf 제거 가능)
        message.put("senderNickname", finalNickname);
        message.put("unreadCount",  initialUnreadCount);
        message.put("senderId", sender.getUserId());
        message.put("messageId", String.valueOf(System.currentTimeMillis()));

        String typeStr = message.getOrDefault("type", "TALK").toString();
        com.project.itda.domain.social.enums.MessageType messageType;
        try {
            messageType = com.project.itda.domain.social.enums.MessageType.valueOf(typeStr);
        } catch (IllegalArgumentException e) {
            messageType = com.project.itda.domain.social.enums.MessageType.TALK;
        }

        Object rawMetadata = message.get("metadata");
        Map<String, Object> metadata = (rawMetadata instanceof Map) ? (Map<String, Object>) rawMetadata : null;

        if (messageType == MessageType.BILL || metadata != null) {
            chatMessageService.saveMessageWithMetadata(email, roomId, (String) message.get("content"), messageType, metadata);
        } else {
            chatMessageService.saveMessage(email, roomId, (String) message.get("content"), messageType);
        }

        messagingTemplate.convertAndSend("/topic/room/" + roomId, message);
    }
    @MessageMapping("/chat/read/{roomId}")
    public void markAsRead(@DestinationVariable Long roomId, Map<String, String> payload, SimpMessageHeaderAccessor headerAccessor) {
        String email = payload.get("email");

        // ✅ 핵심: 입장(Read) 신호가 올 때 세션에 정보를 저장해야
        // 나중에 WebSocketEventListener가 누구인지 알고 지울 수 있습니다.
        headerAccessor.getSessionAttributes().put("userEmail", email);
        headerAccessor.getSessionAttributes().put("roomId", roomId);

        chatRoomService.userJoined(roomId, email);

        chatRoomService.updateLastReadAt(roomId, email);
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/read", payload);
    }
}