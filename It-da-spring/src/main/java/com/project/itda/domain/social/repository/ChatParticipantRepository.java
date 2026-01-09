package com.project.itda.domain.social.repository;

import com.project.itda.domain.social.entity.ChatParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ChatParticipantRepository extends JpaRepository<ChatParticipant, Long> {
    List<ChatParticipant> findByUserUserId(Long userId);
    List<ChatParticipant> findByChatRoomId(Long chatRoomId);
}