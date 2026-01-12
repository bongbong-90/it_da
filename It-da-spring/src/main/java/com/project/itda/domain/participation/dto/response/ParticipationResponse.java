package com.project.itda.domain.participation.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 참여 응답
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationResponse {

    /**
     * 참여 ID
     */
    private Long participationId;

    /**
     * 사용자 ID
     */
    private Long userId;

    /**
     * 사용자 닉네임
     */
    private String username;

    /**
     * 사용자 프로필 이미지
     */
    private String userProfileImage;

    /**
     * 모임 ID
     */
    private Long meetingId;

    /**
     * 모임 제목
     */
    private String meetingTitle;

    /**
     * 상태 (PENDING/APPROVED/REJECTED/CANCELLED/COMPLETED)
     */
    private String status;

    /**
     * 신청 메시지
     */
    private String applicationMessage;

    /**
     * 거절 사유
     */
    private String rejectionReason;

    /**
     * 거리 (km)
     */
    private Double distanceKm;

    /**
     * 추천 유형 (AI/SEARCH/DIRECT)
     */
    private String recommendationType;

    /**
     * 예측 만족도
     */
    private Double predictedRating;

    /**
     * 신청일
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime appliedAt;

    /**
     * 승인일
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime approvedAt;

    /**
     * 완료일
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime completedAt;
}