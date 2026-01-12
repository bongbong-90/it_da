package com.project.itda.domain.admin.controller;

import com.project.itda.domain.admin.dto.request.ReportCreateRequest;
import com.project.itda.domain.admin.dto.request.ReportStatusRequest;
import com.project.itda.domain.admin.dto.response.ReportResponse;
import com.project.itda.domain.admin.enums.ReportStatus;
import com.project.itda.domain.admin.enums.ReportedType;
import com.project.itda.domain.admin.service.ReportService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<ReportResponse> createReport(
            @Valid @RequestBody ReportCreateRequest request,
            HttpSession session) {

        Long reporterId = (Long) session.getAttribute("userId");
        if (reporterId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ReportResponse response = reportService.createReport(reporterId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PatchMapping("/{reportId}/status")
    public ResponseEntity<ReportResponse> updateReportStatus(
            @PathVariable Long reportId,
            @Valid @RequestBody ReportStatusRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ReportResponse response = reportService.updateReportStatus(reportId, adminId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<ReportResponse>> getAllReports(
            @RequestParam(required = false) ReportStatus status) {

        List<ReportResponse> responses = status != null
                ? reportService.getAllReports(status)
                : reportService.getAllReportsPaged(PageRequest.of(0, 100)).getContent();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<ReportResponse>> getAllReportsPaged(
            @PageableDefault(size = 10, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<ReportResponse> responses = reportService.getAllReportsPaged(pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{reportId}")
    public ResponseEntity<ReportResponse> getReport(@PathVariable Long reportId) {
        ReportResponse response = reportService.getReportById(reportId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/target/{type}/{targetId}")
    public ResponseEntity<List<ReportResponse>> getReportsByTarget(
            @PathVariable ReportedType type,
            @PathVariable Long targetId) {

        List<ReportResponse> responses = reportService.getReportsByTarget(type, targetId);
        return ResponseEntity.ok(responses);
    }
}