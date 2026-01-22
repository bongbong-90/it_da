package com.project.itda.domain.social.repository;

import com.project.itda.domain.social.entity.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    // 특정 방의 가장 최근 투표 1개 가져오기 (필요 시)
    Optional<Vote> findFirstByChatRoomIdOrderByCreatedAtDesc(Long chatRoomId);
}