package com.project.itda.domain.social.service;

import com.project.itda.domain.social.entity.ChatMessage;
import com.project.itda.domain.social.entity.ChatRoom;
import com.project.itda.domain.social.enums.MessageType;
import com.project.itda.domain.social.repository.ChatMessageRepository;
import com.project.itda.domain.social.repository.ChatRoomRepository;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ChatMessageService {
    private final ChatMessageRepository chatMessageRepository;
    private final UserRepository userRepository; // 유저 조회를 위해 추가
    private final ChatRoomRepository chatRoomRepository; // 방 조회를 위해 추가

    public List<ChatMessage> getMessagesByRoom(Long roomId) {
        return chatMessageRepository.findByChatRoomIdOrderByCreatedAtAsc(roomId);
    }

    @Transactional
    public void saveMessage(String email, Long chatRoomId, String content) {
        // 1. 보낸 사람 조회
        User sender = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없음"));

        // 2. 채팅방 조회
        ChatRoom room = chatRoomRepository.findById(chatRoomId)
                .orElseThrow(() -> new RuntimeException("채팅방을 찾을 수 없음"));

        // 3. 메시지 엔티티 생성 및 저장
        ChatMessage message = ChatMessage.builder()
                .sender(sender)
                .chatRoom(room)
                .content(content)
                .type(MessageType.TEXT) // 기본 타입 설정
                .build();

        chatMessageRepository.save(message);
    }
}