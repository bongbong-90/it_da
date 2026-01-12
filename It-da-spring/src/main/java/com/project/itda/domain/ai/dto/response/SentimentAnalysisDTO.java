package com.project.itda.domain.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 감성 분석 결과 DTO (클라이언트에게 반환)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentAnalysisDTO {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 감성 유형
     * POSITIVE, NEUTRAL, NEGATIVE
     */
    private String sentimentType;

    /**
     * 감성 점수 (0~1)
     * 긍정 또는 부정의 확률
     */
    private Double sentimentScore;

    /**
     * 감성 아이콘
     * 😊 긍정, 😐 중립, 😞 부정
     */
    private String sentimentIcon;

    /**
     * 감성 텍스트
     * "긍정적인 후기예요", "보통이에요", "부정적인 후기예요"
     */
    private String sentimentText;

    /**
     * 상세 감성 확률
     */
    private SentimentDetail detail;

    /**
     * 상세 감성 확률
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentDetail {

        /**
         * 긍정 확률 (%)
         */
        private Double positivePercent;

        /**
         * 중립 확률 (%)
         */
        private Double neutralPercent;

        /**
         * 부정 확률 (%)
         */
        private Double negativePercent;
    }
}