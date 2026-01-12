package com.project.itda.domain.review.dto.response;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * 후기 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewResponse {

    /**
     * 후기 ID
     */
    private Long reviewId;

    /**
     * 작성자 ID
     */
    private Long userId;

    /**
     * 작성자 닉네임
     */
    private String username;

    /**
     * 작성자 프로필 이미지
     */
    private String userProfileImage;

    /**
     * 모임 ID
     */
    private Long meetingId;

    /**
     * 평점 (1~5)
     */
    private Integer rating;

    /**
     * 후기 내용
     */
    private String reviewText;

    // ========================================
    // AI 감성 분석 결과
    // ========================================

    /**
     * 감성 타입
     * POSITIVE, NEUTRAL, NEGATIVE
     */
    private String sentiment;

    /**
     * 감성 점수 (0~1)
     */
    private Double sentimentScore;

    /**
     * 감성 아이콘
     * 😊, 😐, 😞
     */
    private String sentimentIcon;

    /**
     * 감성 텍스트
     * "긍정적인 후기예요", "보통이에요", "부정적인 후기예요"
     */
    private String sentimentText;

    // ========================================

    /**
     * 공개 여부
     */
    private Boolean isPublic;

    /**
     * 작성 일시
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;

    /**
     * 수정 일시
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updatedAt;
}