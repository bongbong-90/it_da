package com.project.itda.domain.social.dto.request;

import com.project.itda.domain.social.enums.MessageType;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class ChatMessageRequest {
    private Long chatRoomId; // 대상 채팅방 ID [cite: 265]
    private String content;   // 메시지 내용 [cite: 273]
    private MessageType messageType; // 메시지 타입 (TEXT, IMAGE 등) [cite: 270, 272]
}