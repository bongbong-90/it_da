package com.project.itda.domain.ai.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 장소 추천 최종 응답 (클라이언트에게 반환)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaceRecommendationDTO {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 모임 ID
     */
    private Long meetingId;

    /**
     * 중간지점 정보
     */
    private CentroidInfo centroid;

    /**
     * 검색 반경 (m)
     */
    private Integer searchRadius;

    /**
     * 추천 장소 목록
     */
    private List<PlaceInfo> recommendations;

    /**
     * 총 추천 개수
     */
    private Integer totalCount;

    /**
     * 처리 시간 (ms)
     */
    private Long processingTimeMs;

    /**
     * 중간지점 정보
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CentroidInfo {
        private Double latitude;
        private Double longitude;
        private String address;
    }

    /**
     * 추천 장소 정보
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PlaceInfo {

        /**
         * 순위
         */
        private Integer rank;

        /**
         * 장소명
         */
        private String placeName;

        /**
         * 카테고리
         */
        private String category;

        /**
         * 주소
         */
        private String address;

        /**
         * 도로명 주소
         */
        private String roadAddress;

        /**
         * 위도
         */
        private Double latitude;

        /**
         * 경도
         */
        private Double longitude;

        /**
         * 중간지점에서 거리 (m)
         */
        private Double distanceFromCentroid;

        /**
         * 중간지점에서 거리 (km)
         */
        private Double distanceKm;

        /**
         * 전화번호
         */
        private String phone;

        /**
         * 카카오맵 URL
         */
        private String kakaoUrl;

        /**
         * 추천 이유
         */
        private List<String> matchReasons;
    }
}