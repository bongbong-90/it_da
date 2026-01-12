package com.project.itda.domain.meeting.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 모임 검색 요청
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingSearchRequest {

    /**
     * 키워드 (제목 + 설명)
     */
    private String keyword;

    /**
     * 카테고리
     */
    private String category;

    /**
     * 서브카테고리
     */
    private String subcategory;

    /**
     * 시작 날짜
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime startDate;

    /**
     * 종료 날짜
     */
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endDate;

    /**
     * 위치 기반 검색 - 위도
     */
    private Double latitude;

    /**
     * 위치 기반 검색 - 경도
     */
    private Double longitude;

    /**
     * 위치 기반 검색 - 반경 (km)
     */
    private Double radius;

    /**
     * 장소 유형
     */
    private String locationType;

    /**
     * 분위기
     */
    private String vibe;

    /**
     * 시간대
     */
    private String timeSlot;

    /**
     * 모임 상태
     */
    private String status;

    /**
     * 페이지 번호 (0부터 시작)
     */
    private Integer page;

    /**
     * 페이지 크기
     */
    private Integer size;

    /**
     * 정렬 기준 (createdAt, meetingTime, currentParticipants)
     */
    private String sortBy;

    /**
     * 정렬 방향 (asc, desc)
     */
    private String sortDirection;
}