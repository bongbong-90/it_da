package com.project.itda.domain.social.service;

import com.project.itda.domain.social.entity.Follow;
import com.project.itda.domain.social.repository.FollowRepository;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
public class FollowService {
    private final FollowRepository followRepository;
    private final UserRepository userRepository; // 추가 필요

    public void follow(String followerEmail, Long followingId) {
        // 1. 나(follower) 찾기
        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // 2. 상대방(following) 찾기
        User following = userRepository.findById(followingId)
                .orElseThrow(() -> new IllegalArgumentException("대상 사용자를 찾을 수 없습니다."));

        // 3. 관계 저장
        Follow follow = Follow.builder()
                .follower(follower)
                .following(following)
                .build();
        followRepository.save(follow);
    }

    public void unfollow(String followerEmail, Long followingId) {
        User follower = userRepository.findByEmail(followerEmail)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        // Repository 메서드명에 맞춰 호출
        followRepository.deleteByFollowerUserIdAndFollowingUserId(follower.getUserId(), followingId);
    }
}