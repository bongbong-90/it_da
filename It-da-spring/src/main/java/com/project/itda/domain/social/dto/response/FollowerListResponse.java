package com.project.itda.domain.social.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FollowerListResponse {
    private Long userId;       // 사용자 ID [cite: 4]
    private String nickname;   // 닉네임
    private String profileImage; // 프로필 이미지 URL
}