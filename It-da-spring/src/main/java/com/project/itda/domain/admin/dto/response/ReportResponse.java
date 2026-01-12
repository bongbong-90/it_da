package com.project.itda.domain.admin.dto.response;

import com.project.itda.domain.admin.entity.Report;
import com.project.itda.domain.admin.enums.ReportStatus;
import com.project.itda.domain.admin.enums.ReportedType;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class ReportResponse {
    private Long reportId;
    private Long reporterId;
    private ReportedType reportedType;
    private Long reportedId;
    private String reason;
    private String description;
    private ReportStatus status;
    private String adminNote;
    private Long resolvedById;
    private String resolvedByName;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;

    public static ReportResponse from(Report report) {
        return ReportResponse.builder()
                .reportId(report.getReportId())
                .reporterId(report.getReporterId())
                .reportedType(report.getReportedType())
                .reportedId(report.getReportedId())
                .reason(report.getReason())
                .description(report.getDescription())
                .status(report.getStatus())
                .adminNote(report.getAdminNote())
                .resolvedById(report.getResolvedBy() != null ? report.getResolvedBy().getAdminId() : null)
                .resolvedByName(report.getResolvedBy() != null ? report.getResolvedBy().getName() : null)
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}