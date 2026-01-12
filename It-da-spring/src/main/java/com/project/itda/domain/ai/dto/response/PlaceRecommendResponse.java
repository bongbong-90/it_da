package com.project.itda.domain.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 장소 추천 응답 (FastAPI - 중간지점 정보만)
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class PlaceRecommendResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 중간지점 정보
     */
    private Centroid centroid;

    /**
     * 검색 반경 (m)
     */
    @JsonProperty("search_radius")
    private Integer searchRadius;

    /**
     * 추천 장소 목록 (FastAPI에서는 빈 리스트, Spring Boot에서 채움)
     */
    private List<RecommendedPlace> recommendations;

    /**
     * 처리 시간 (ms)
     */
    @JsonProperty("processing_time_ms")
    private Integer processingTimeMs;

    /**
     * 중간지점
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class Centroid {
        private Double latitude;
        private Double longitude;
        private String address;
    }

    /**
     * 추천 장소 (FastAPI에서는 사용 안 함, Spring Boot에서 채움)
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RecommendedPlace {
        private Integer rank;

        @JsonProperty("place_name")
        private String placeName;

        private String category;
        private String address;
        private Double latitude;
        private Double longitude;

        @JsonProperty("distance_from_centroid")
        private Double distanceFromCentroid;

        @JsonProperty("kakao_rating")
        private Double kakaoRating;

        @JsonProperty("review_count")
        private Integer reviewCount;

        private String phone;

        @JsonProperty("kakao_url")
        private String kakaoUrl;

        @JsonProperty("match_reasons")
        private List<String> matchReasons;
    }
}