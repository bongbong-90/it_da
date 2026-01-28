package com.project.itda.domain.admin.service;

import com.project.itda.domain.admin.dto.request.ReportCreateRequest;
import com.project.itda.domain.admin.dto.request.ReportStatusRequest;
import com.project.itda.domain.admin.dto.response.ReportResponse;
import com.project.itda.domain.admin.entity.AdminUser;
import com.project.itda.domain.admin.entity.Report;
import com.project.itda.domain.admin.enums.ReportStatus;
import com.project.itda.domain.admin.enums.ReportedType;
import com.project.itda.domain.admin.repository.AdminUserRepository;
import com.project.itda.domain.admin.repository.ReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ReportService {

    private final ReportRepository reportRepository;
    private final AdminUserRepository adminUserRepository;

    @Transactional
    public ReportResponse createReport(Long reporterId, ReportCreateRequest request) {
        Report report = new Report();
        report.setReporterId(reporterId);
        report.setReportedType(request.getReportedType());
        report.setReportedId(request.getReportedId());
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setStatus(ReportStatus.PENDING);

        Report saved = reportRepository.save(report);
        return ReportResponse.from(saved);
    }

    @Transactional
    public ReportResponse updateReportStatus(Long reportId, Long adminId, ReportStatusRequest request) {
        Report report = reportRepository.findByIdWithResolver(reportId)
                .orElseThrow(() -> new EntityNotFoundException("신고를 찾을 수 없습니다"));

        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));

        report.setStatus(request.getStatus());
        report.setAdminNote(request.getAdminNote());
        report.setResolvedBy(admin);

        if (request.getStatus() == ReportStatus.RESOLVED || request.getStatus() == ReportStatus.REJECTED) {
            report.setResolvedAt(LocalDateTime.now());
        }

        return ReportResponse.from(report);
    }

    public List<ReportResponse> getAllReports(ReportStatus status) {
        // N+1 방지
        return reportRepository.findAllByStatusWithResolver(status)
                .stream()
                .map(ReportResponse::from)
                .collect(Collectors.toList());
    }

    public Page<ReportResponse> getAllReportsPaged(Pageable pageable) {
        return reportRepository.findAllWithResolverPaged(pageable)
                .map(ReportResponse::from);
    }

    public ReportResponse getReportById(Long reportId) {
        Report report = reportRepository.findByIdWithResolver(reportId)
                .orElseThrow(() -> new EntityNotFoundException("신고를 찾을 수 없습니다"));
        return ReportResponse.from(report);
    }

    public List<ReportResponse> getReportsByTarget(ReportedType type, Long targetId) {
        return reportRepository.findByReportedTargetWithResolver(type, targetId)
                .stream()
                .map(ReportResponse::from)
                .collect(Collectors.toList());
    }
    public ReportResponse getMyReportDetail(Long reportId, Long userId) {
        Report report = reportRepository.findById(reportId)
                .orElseThrow(() -> new EntityNotFoundException("신고 내역을 찾을 수 없습니다."));

        // ✅ 보안 체크: 신고자가 본인이 맞는지 확인
        if (!report.getReporterId().equals(userId)) {
            throw new IllegalArgumentException("본인의 신고 내역만 확인할 수 있습니다.");
        }

        return ReportResponse.from(report);
    }
}