package com.project.itda.domain.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

/**
 * 만족도 예측 응답 (FastAPI에서 받음)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionPredictionResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * Raw 점수 (LightGBM 출력값)
     */
    @JsonProperty("raw_score")
    private Double rawScore;

    /**
     * 예측 평점 (1~5)
     */
    @JsonProperty("predicted_rating")
    private Double predictedRating;

    /**
     * 추천 이유 목록
     */
    private List<ReasonItem> reasons;

    /**
     * 디버그 정보
     */
    private Map<String, Object> debug;

    /**
     * 추천 이유 항목
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ReasonItem {
        /**
         * 아이콘
         */
        private String icon;

        /**
         * 텍스트
         */
        private String text;
    }
}