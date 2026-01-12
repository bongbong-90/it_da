package com.project.itda.domain.meeting.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 모임 검색 결과 응답
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingSearchResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 검색 결과 (모임 목록)
     */
    private List<MeetingResponse> meetings;

    /**
     * 검색 키워드
     */
    private String keyword;

    /**
     * 필터 정보
     */
    private SearchFilter filters;

    /**
     * 총 검색 결과 수
     */
    private Integer totalCount;

    /**
     * 현재 페이지
     */
    private Integer currentPage;

    /**
     * 전체 페이지 수
     */
    private Integer totalPages;

    /**
     * 페이지 크기
     */
    private Integer pageSize;

    /**
     * 검색 필터 정보
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SearchFilter {
        private String category;
        private String subcategory;
        private String locationType;
        private String vibe;
        private String timeSlot;
        private String status;
        private Double radius;
    }
}