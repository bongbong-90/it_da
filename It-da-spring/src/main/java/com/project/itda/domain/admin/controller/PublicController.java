package com.project.itda.domain.admin.controller;

import com.project.itda.domain.admin.dto.response.AnnouncementListResponse;
import com.project.itda.domain.admin.dto.response.AnnouncementResponse;
import com.project.itda.domain.admin.service.AdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public")
@RequiredArgsConstructor
public class PublicController {

    private final AdminService adminService;

    /**
     * 공개 공지사항 목록 조회 (인증 불필요)
     */
    @GetMapping("/announcements")
    public ResponseEntity<AnnouncementListResponse> getPublicAnnouncementList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {

        // PUBLISHED 상태만 조회
        AnnouncementListResponse response = adminService.getAnnouncementList(page, size, "PUBLISHED");
        return ResponseEntity.ok(response);
    }

    /**
     * 공개 공지사항 상세 조회 (인증 불필요)
     */
    @GetMapping("/announcements/{announcementId}")
    public ResponseEntity<AnnouncementResponse> getPublicAnnouncementDetail(
            @PathVariable Long announcementId) {

        try {
            AnnouncementResponse response = adminService.getAnnouncementDetail(announcementId);

            String status = String.valueOf(response.getStatus());

            // PUBLISHED 상태가 아니면 404 반환
            if (!"PUBLISHED".equalsIgnoreCase(status)) {
                return ResponseEntity.notFound().build();
            }

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}