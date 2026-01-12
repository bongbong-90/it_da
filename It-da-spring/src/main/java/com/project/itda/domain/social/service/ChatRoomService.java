package com.project.itda.domain.social.service;

import com.project.itda.domain.social.entity.ChatRoom;
import com.project.itda.domain.social.repository.ChatRoomRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@Transactional(readOnly = true)
@RequiredArgsConstructor
public class ChatRoomService {
    private final ChatRoomRepository chatRoomRepository;

    @Transactional
    public ChatRoom createChatRoom(String name) {
        ChatRoom chatRoom = ChatRoom.builder()
                .roomName(name)
                .isActive(true)
                .build();
        return chatRoomRepository.save(chatRoom); // Long이 아닌 ChatRoom 반환
    }

    public List<ChatRoom> findAllRooms() {
        return chatRoomRepository.findAll();
    }
}