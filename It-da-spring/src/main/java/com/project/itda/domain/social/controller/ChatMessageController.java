package com.project.itda.domain.social.controller;

import com.project.itda.domain.auth.dto.SessionUser;
import com.project.itda.domain.social.dto.response.ChatMessageResponse;
import com.project.itda.domain.social.entity.ChatMessage;
import com.project.itda.domain.social.service.ChatMessageService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessageSendingOperations;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/social/messages")
@RequiredArgsConstructor
public class ChatMessageController {

    private final ChatMessageService chatMessageService;
    private final HttpSession  httpSession;
    private final SimpMessageSendingOperations messagingTemplate;

    // 특정 채팅방의 이전 메시지 내역 가져오기
    @GetMapping("/{chatRoomId}")
    public ResponseEntity<List<ChatMessageResponse>> getChatMessages( @PathVariable Long chatRoomId,
                                                                      @RequestParam(defaultValue = "0") int page,
                                                                      @RequestParam(defaultValue = "50") int size) {
        // chatMessageService에서 DTO 변환 로직이 있는 getChatMessages를 호출합니다.
        return ResponseEntity.ok(chatMessageService.getChatMessages(chatRoomId, page, size));
    }
    @PostMapping
    public ResponseEntity<?> sendMessage(@RequestBody Map<String, Object> payload) {
        SessionUser user = (SessionUser) httpSession.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).build();

        Long chatRoomId = Long.valueOf(payload.get("chatRoomId").toString());
        String content = (String) payload.get("content");
// ✅ 1. 메시지 타입 추출 (기본값 TEXT)
        com.project.itda.domain.social.enums.MessageType type =
                com.project.itda.domain.social.enums.MessageType.valueOf(payload.getOrDefault("type", "TEXT").toString());

        // ✅ 2. 메타데이터 추출
        Object rawMetadata = payload.get("metadata");
        Map<String, Object> metadata = (rawMetadata instanceof Map) ? (Map<String, Object>) rawMetadata : null;

        // ✅ 3. 타입이 BILL이거나 메타데이터가 있는 경우 saveMessageWithMetadata 호출
        // 이 메서드가 내부적으로 진짜 DB ID를 metadata에 심어줍니다.
        if (type == com.project.itda.domain.social.enums.MessageType.BILL || metadata != null) {
            chatMessageService.saveMessageWithMetadata(user.getEmail(), chatRoomId, content, type, metadata);
        } else {
            chatMessageService.saveMessage(user.getEmail(), chatRoomId, content, type);
        }
        return ResponseEntity.ok("메시지 전송 성공");
    }
    @PostMapping(value="/{messageId}/bill/check",produces = "application/json")
    public ResponseEntity<?> checkBillPaid(@PathVariable Long messageId, @RequestBody Map<String, Object> payload) { // ✅ Long -> Object
        // 1. userId를 Object에서 가져와 문자열 변환 후 Long으로 변환
        Long targetUserId = Long.valueOf(payload.get("userId").toString());

        // 2. 서비스 로직 호출 및 갱신된 메타데이터 반환
        Map<String, Object> updatedMetadata = chatMessageService.updateBillStatus(messageId, targetUserId);

        // 3. roomId 조회 및 웹소켓 전송 (기존 로직 유지)
        Long roomId = chatMessageService.getRoomIdByMessageId(messageId);
        Map<String, Object> socketPayload = new HashMap<>();
        socketPayload.put("type", "BILL_UPDATE");
        socketPayload.put("targetMessageId", messageId);
        socketPayload.put("metadata", updatedMetadata);
        messagingTemplate.convertAndSend("/topic/room/" + roomId, socketPayload);

        return ResponseEntity.ok(updatedMetadata);
    }
}