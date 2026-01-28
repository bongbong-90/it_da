package com.project.itda.domain.meeting.enums;

/**
 * 모임 상태
 */
public enum MeetingStatus {

    /**
     * 모집 중
     */
    RECRUITING("모집 중"),

    /**
     * 정원 마감
     */
    FULL("정원 마감"),

    /**
     * 취소됨
     */
    CANCELLED("취소됨"),

    /**
     * 완료됨
     */
    COMPLETED("완료됨"),

    /**
     * 삭제됨 (관리자용)
     */
    DELETED("삭제됨");

    private final String description;

    MeetingStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}