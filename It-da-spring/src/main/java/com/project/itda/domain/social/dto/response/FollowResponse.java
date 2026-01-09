package com.project.itda.domain.social.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
@AllArgsConstructor
public class FollowResponse {
    private Long followId;    // 생성된 팔로우 고유 ID [cite: 235]
    private String followerName; // 팔로우한 사람 이름 [cite: 10, 239]
    private String followeeName; // 팔로우 대상 이름 [cite: 10, 241]
}