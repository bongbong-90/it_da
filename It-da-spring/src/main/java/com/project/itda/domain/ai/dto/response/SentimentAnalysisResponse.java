package com.project.itda.domain.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.Map;

/**
 * 감성 분석 응답 (FastAPI에서 받음)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SentimentAnalysisResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 분석한 텍스트
     */
    private String text;

    /**
     * 감성 분석 결과
     * - positive: 긍정 확률
     * - neutral: 중립 확률
     * - negative: 부정 확률
     * - score: 종합 점수 (-1 ~ 1)
     */
    private SentimentScore sentiment;

    /**
     * 해석 결과
     * "긍정", "중립", "부정"
     */
    private String interpretation;

    /**
     * 감성 점수
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SentimentScore {

        /**
         * 긍정 확률 (0~1)
         */
        private Double positive;

        /**
         * 중립 확률 (0~1)
         */
        private Double neutral;

        /**
         * 부정 확률 (0~1)
         */
        private Double negative;

        /**
         * 종합 점수 (-1 ~ 1)
         * 양수: 긍정, 0: 중립, 음수: 부정
         */
        private Double score;
    }
}