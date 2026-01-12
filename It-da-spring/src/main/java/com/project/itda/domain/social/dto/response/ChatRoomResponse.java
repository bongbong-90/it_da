package com.project.itda.domain.social.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class ChatRoomResponse {
    private Long chatRoomId;   // 채팅방 ID [cite: 251]
    private String roomName;    // 채팅방 이름 [cite: 254]
    private int participantCount; // 현재 참여 인원 [cite: 152]
    private String lastMessage; // 마지막 메시지 요약 [cite: 273]
}