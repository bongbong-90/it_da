package com.project.itda.domain.participation.enums;

/**
 * 참여 상태
 */
public enum ParticipationStatus {

    /**
     * 대기 중
     */
    PENDING("대기 중"),

    /**
     * 승인됨
     */
    APPROVED("승인됨"),

    /**
     * 거절됨
     */
    REJECTED("거절됨"),

    /**
     * 취소됨 (사용자가 직접 취소)
     */
    CANCELLED("취소됨"),

    /**
     * 완료됨 (모임 종료 후)
     */
    COMPLETED("완료됨");

    private final String description;

    ParticipationStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}