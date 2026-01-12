package com.project.itda.domain.meeting.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 모임 목록 응답 DTO
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MeetingListResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 모임 목록
     */
    private List<MeetingResponse> meetings;

    /**
     * 총 개수
     */
    private Integer totalCount;

    /**
     * 현재 페이지 (0부터 시작)
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
     * 다음 페이지 존재 여부
     */
    private Boolean hasNext;

    /**
     * 이전 페이지 존재 여부
     */
    private Boolean hasPrevious;
}