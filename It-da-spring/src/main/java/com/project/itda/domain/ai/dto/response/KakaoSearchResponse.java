package com.project.itda.domain.ai.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 카카오맵 키워드 검색 응답
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class KakaoSearchResponse {

    /**
     * 검색 결과 문서 목록
     */
    private List<KakaoPlace> documents;

    /**
     * 메타 정보
     */
    private KakaoMeta meta;

    /**
     * 카카오맵 장소 정보
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KakaoPlace {

        /**
         * 장소 ID
         */
        private String id;

        /**
         * 장소명
         */
        @JsonProperty("place_name")
        private String placeName;

        /**
         * 카테고리명
         */
        @JsonProperty("category_name")
        private String categoryName;

        /**
         * 전화번호
         */
        private String phone;

        /**
         * 지번 주소
         */
        @JsonProperty("address_name")
        private String addressName;

        /**
         * 도로명 주소
         */
        @JsonProperty("road_address_name")
        private String roadAddressName;

        /**
         * 경도 (X)
         */
        private String x;

        /**
         * 위도 (Y)
         */
        private String y;

        /**
         * 카카오맵 URL
         */
        @JsonProperty("place_url")
        private String placeUrl;

        /**
         * 중심좌표까지의 거리 (m)
         */
        private String distance;

        /**
         * 위도 (Double)
         */
        public Double getLatitude() {
            return Double.parseDouble(y);
        }

        /**
         * 경도 (Double)
         */
        public Double getLongitude() {
            return Double.parseDouble(x);
        }

        /**
         * 거리 (Double, m)
         */
        public Double getDistanceMeters() {
            try {
                return Double.parseDouble(distance);
            } catch (Exception e) {
                return null;
            }
        }
    }

    /**
     * 메타 정보
     */
    @Getter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class KakaoMeta {

        /**
         * 검색어에 검색된 문서 수
         */
        @JsonProperty("total_count")
        private Integer totalCount;

        /**
         * 페이지 가능한 문서 수
         */
        @JsonProperty("pageable_count")
        private Integer pageableCount;

        /**
         * 현재 페이지가 마지막인지 여부
         */
        @JsonProperty("is_end")
        private Boolean isEnd;
    }
}