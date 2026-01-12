package com.project.itda.domain.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 만족도 예측 결과 DTO (클라이언트에게 반환)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionPredictionDTO {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 사용자 ID
     */
    private Long userId;

    /**
     * 모임 ID
     */
    private Long meetingId;

    /**
     * 예측 평점 (1.0~5.0)
     */
    private Double predictedRating;

    /**
     * 예측 등급 (별점 텍스트)
     * 예: "⭐⭐⭐⭐⭐", "⭐⭐⭐⭐", ...
     */
    private String ratingStars;

    /**
     * 만족도 수준
     * 예: "매우 높음", "높음", "보통", "낮음"
     */
    private String satisfactionLevel;

    /**
     * 추천 여부
     */
    private Boolean recommended;

    /**
     * 추천 이유 목록
     */
    private List<ReasonItem> reasons;

    /**
     * 거리 (km)
     */
    private Double distanceKm;

    /**
     * 추천 이유 항목
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReasonItem {
        private String icon;
        private String text;
    }
}