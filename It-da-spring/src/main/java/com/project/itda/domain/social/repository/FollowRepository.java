package com.project.itda.domain.social.repository;

import com.project.itda.domain.social.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import java.util.List;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    // follower.userId 필드를 참조하도록 수정
    List<Follow> findByFollowerUserId(Long followerId);

    // following.userId 필드를 참조하도록 수정
    List<Follow> findByFollowingUserId(Long followingId);

    // follower.userId와 following.userId를 모두 참조하도록 수정
    Optional<Follow> findByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);

    // 존재 여부 확인 메서드도 동일하게 수정
    boolean existsByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);

    // 삭제 메서드 수정
    void deleteByFollowerUserIdAndFollowingUserId(Long followerId, Long followingId);
}