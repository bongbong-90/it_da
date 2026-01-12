package com.project.itda.domain.social.dto.response;

import com.project.itda.domain.social.enums.MessageType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import java.time.LocalDateTime;

@Getter
@Builder
@AllArgsConstructor
public class ChatMessageResponse {
    private Long messageId;     // 메시지 고유 ID [cite: 263]
    private Long senderId;      // 발신자 ID [cite: 267]
    private String senderNickname; // 발신자 닉네임
    private String content;     // 내용 [cite: 273]
    private MessageType type;   // 타입 [cite: 270]
    private LocalDateTime sentAt; // 전송 시간 [cite: 280]
}