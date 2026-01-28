package com.project.itda.domain.admin.enums;

public enum AnnouncementCategory {
    NOTICE("공지사항"),
    EVENT("이벤트"),
    UPDATE("업데이트"),
    MAINTENANCE("점검"),
    GUIDE("가이드");

    private final String description;

    AnnouncementCategory(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}