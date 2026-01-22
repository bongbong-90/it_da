package com.project.itda.domain.social.dto.request;

import com.project.itda.domain.social.enums.MessageType;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
public class ChatMessageRequest {
    private String email;
    private Long roomId;
    private String content;
    private MessageType type;
    private Map<String, Object> metadata;
}