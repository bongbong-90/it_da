package com.project.itda.domain.admin.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
public class ReportListResponse {

    private List<ReportResponse> content;

    private int currentPage;
    private int totalPages;
    private long totalElements;
}
