package com.project.itda.domain.participation.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/**
 * 참여자 목록 응답
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantListResponse {

    /**
     * 성공 여부
     */
    private Boolean success;

    /**
     * 메시지
     */
    private String message;

    /**
     * 참여자 목록
     */
    private List<ParticipationResponse> participants;

    /**
     * 총 개수
     */
    private Integer totalCount;

    /**
     * 상태별 통계
     */
    private StatusStats statusStats;

    /**
     * 상태별 통계
     */
    @Getter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StatusStats {
        private Long pendingCount;
        private Long approvedCount;
        private Long rejectedCount;
        private Long cancelledCount;
        private Long completedCount;
    }
}