package com.project.itda.domain.admin.dto.response;

import com.project.itda.domain.admin.entity.Announcement;
import com.project.itda.domain.admin.enums.AnnouncementCategory;
import com.project.itda.domain.admin.enums.AnnouncementStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class AnnouncementResponse {
    private Long announcementId;
    private Long authorId;
    private String authorName;
    private AnnouncementCategory category;
    private String title;
    private String content;
    private Boolean isPinned;
    private Boolean isImportant;
    private Integer viewCount;
    private AnnouncementStatus status;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AnnouncementResponse from(Announcement announcement) {
        return AnnouncementResponse.builder()
                .announcementId(announcement.getAnnouncementId())
                .authorId(announcement.getAuthor().getAdminId())
                .authorName(announcement.getAuthor().getName())
                .category(announcement.getCategory())
                .title(announcement.getTitle())
                .content(announcement.getContent())
                .isPinned(announcement.getIsPinned())
                .isImportant(announcement.getIsImportant())
                .viewCount(announcement.getViewCount())
                .status(announcement.getStatus())
                .publishedAt(announcement.getPublishedAt())
                .createdAt(announcement.getCreatedAt())
                .updatedAt(announcement.getUpdatedAt())
                .build();
    }
}