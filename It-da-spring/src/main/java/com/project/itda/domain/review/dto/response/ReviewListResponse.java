package com.project.itda.domain.review.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 후기 목록 응답
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReviewListResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 후기 목록
     */
    private List<ReviewResponse> reviews;

    /**
     * 총 개수
     */
    private Integer totalCount;

    /**
     * 평균 평점
     */
    private Double avgRating;

    /**
     * 감성 통계
     */
    private SentimentStats sentimentStats;

    /**
     * 감성 통계
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentStats {
        /**
         * 긍정 후기 개수
         */
        private Long positiveCount;

        /**
         * 중립 후기 개수
         */
        private Long neutralCount;

        /**
         * 부정 후기 개수
         */
        private Long negativeCount;

        /**
         * 긍정 비율 (%)
         */
        private Double positivePercent;
    }
}