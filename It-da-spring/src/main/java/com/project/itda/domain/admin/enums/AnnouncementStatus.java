package com.project.itda.domain.admin.enums;

public enum AnnouncementStatus {
    DRAFT("임시저장"),
    PUBLISHED("게시"),
    HIDDEN("숨김");

    private final String description;

    AnnouncementStatus(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}