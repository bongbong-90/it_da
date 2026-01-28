package com.project.itda.domain.admin.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class AnnouncementListResponse {
    private List<AnnouncementResponse> content;  // 기존 AnnouncementResponse 재사용
    private int currentPage;
    private int totalPages;
    private long totalElements;
}