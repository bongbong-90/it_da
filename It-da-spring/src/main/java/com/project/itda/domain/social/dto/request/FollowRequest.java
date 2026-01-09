package com.project.itda.domain.social.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class FollowRequest {
    private Long targetUserId; // 팔로우할 대상 ID (followee_id) [cite: 240]
    private boolean notifyOnMeeting; // 모임 알림 여부 [cite: 242]
    private boolean notifyOnReview;  // 후기 알림 여부 [cite: 244]
}