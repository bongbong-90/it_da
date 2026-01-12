package com.project.itda.domain.admin.controller;

import com.project.itda.domain.admin.dto.request.AnnouncementCreateRequest;
import com.project.itda.domain.admin.dto.response.AnnouncementResponse;
import com.project.itda.domain.admin.enums.AnnouncementStatus;
import com.project.itda.domain.admin.service.AnnouncementService;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/announcements")
@RequiredArgsConstructor
public class AnnouncementController {

    private final AnnouncementService announcementService;

    @PostMapping
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @Valid @RequestBody AnnouncementCreateRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AnnouncementResponse response = announcementService.createAnnouncement(adminId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{announcementId}")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable Long announcementId,
            @Valid @RequestBody AnnouncementCreateRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AnnouncementResponse response = announcementService.updateAnnouncement(announcementId, request);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<List<AnnouncementResponse>> getAllAnnouncements(
            @RequestParam(required = false, defaultValue = "PUBLISHED") AnnouncementStatus status) {

        List<AnnouncementResponse> responses = announcementService.getAllAnnouncements(status);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/pinned")
    public ResponseEntity<List<AnnouncementResponse>> getPinnedAnnouncements() {
        List<AnnouncementResponse> responses = announcementService.getPinnedAnnouncements();
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/paged")
    public ResponseEntity<Page<AnnouncementResponse>> getAllAnnouncementsPaged(
            @RequestParam(required = false, defaultValue = "PUBLISHED") AnnouncementStatus status,
            @PageableDefault(size = 10, sort = "publishedAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<AnnouncementResponse> responses = announcementService.getAllAnnouncementsPaged(status, pageable);
        return ResponseEntity.ok(responses);
    }

    @GetMapping("/{announcementId}")
    public ResponseEntity<AnnouncementResponse> getAnnouncement(@PathVariable Long announcementId) {
        announcementService.incrementViewCount(announcementId);
        AnnouncementResponse response = announcementService.getAnnouncementById(announcementId);
        return ResponseEntity.ok(response);
    }
}
