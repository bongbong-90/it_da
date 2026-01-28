package com.project.itda.domain.admin.enums;

/**
 * 문의 처리 상태
 */
public enum InquiryStatus {
    PENDING("대기중"),
    ANSWERED("답변완료"),
    CLOSED("종료");

    private final String description;

    InquiryStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}