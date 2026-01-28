package com.project.itda.domain.admin.controller;

import com.project.itda.domain.admin.dto.request.*;
import com.project.itda.domain.admin.dto.response.*;
import com.project.itda.domain.admin.entity.AdminUser;
import com.project.itda.domain.admin.repository.AdminUserRepository;
import com.project.itda.domain.admin.service.AdminService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.project.itda.domain.admin.dto.response.InquiryListResponse;
import com.project.itda.domain.admin.dto.response.InquiryDetailResponse;
import com.project.itda.domain.admin.dto.response.AnnouncementResponse;
import com.project.itda.domain.admin.dto.response.AnnouncementListResponse;
import jakarta.validation.Valid;
import com.project.itda.domain.admin.dto.request.ReportStatusRequest;
import com.project.itda.domain.admin.dto.response.ReportResponse;
import com.project.itda.domain.admin.dto.response.ReportListResponse;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;
    private final AdminUserRepository adminUserRepository;

    // ===== 기존 로그인 메서드 (그대로 유지) =====
    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> request,
            HttpSession session) {

        String email = request.get("email");

        AdminUser admin = adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));

        session.setAttribute("adminId", admin.getAdminId());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "로그인 성공");
        response.put("adminId", admin.getAdminId());
        response.put("name", admin.getName());
        response.put("email", admin.getEmail());
        response.put("role", admin.getRole());

        return ResponseEntity.ok(response);
    }


    /**
     * 로그아웃
     */
    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(HttpSession session) {
        session.invalidate();
        Map<String, String> response = new HashMap<>();
        response.put("message", "로그아웃 성공");
        return ResponseEntity.ok(response);
    }

    /**
     * 세션 체크
     */
    @GetMapping("/check")
    public ResponseEntity<Map<String, Object>> checkSession(HttpSession session) {
        Long adminId = (Long) session.getAttribute("adminId");

        Map<String, Object> response = new HashMap<>();
        if (adminId == null) {
            response.put("isAuthenticated", false);
            return ResponseEntity.ok(response);
        }

        AdminUser admin = adminUserRepository.findById(adminId).orElse(null);

        if (admin == null) {
            response.put("isAuthenticated", false);
            return ResponseEntity.ok(response);
        }

        response.put("isAuthenticated", true);
        response.put("adminId", admin.getAdminId());
        response.put("name", admin.getName());
        response.put("email", admin.getEmail());
        response.put("role", admin.getRole());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/dashboard")
    public ResponseEntity<Map<String, Object>> getDashboard(HttpSession session) {
        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }


        AdminDashboardResponse dashboard = adminService.getDashboard(adminId);
        List<RecentUserResponse> recentUsers = adminService.getRecentUsers(10);
        List<RecentMeetingResponse> recentMeetings = adminService.getRecentMeetings(10);

        Map<String, Object> response = new HashMap<>();
        response.put("dashboard", dashboard);
        response.put("recentUsers", recentUsers);
        response.put("recentMeetings", recentMeetings);

        return ResponseEntity.ok(response);
    }

    /**
     * 회원 목록 조회
     */
    @GetMapping("/users")
    public ResponseEntity<UserListResponse> getUserList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserListResponse response = adminService.getUserList(page, size, search);
        return ResponseEntity.ok(response);
    }

    /**
     * 회원 상세 조회
     */
    @GetMapping("/users/{userId}")
    public ResponseEntity<UserManageResponse> getUserDetail(
            @PathVariable Long userId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserManageResponse response = adminService.getUserDetail(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * 회원 상태 변경
     */
    @PatchMapping("/users/{userId}/status")
    public ResponseEntity<String> updateUserStatus(
            @PathVariable Long userId,
            @RequestBody UserStatusRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        adminService.updateUserStatus(userId, request);
        return ResponseEntity.ok("회원 상태가 변경되었습니다.");
    }

    // ========== 모임 관리 ==========

    /**
     * 모임 목록 조회
     */
    @GetMapping("/meetings")
    public ResponseEntity<MeetingListResponse> getMeetingList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String status,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MeetingListResponse response = adminService.getMeetingList(page, size, search, category, status);
        return ResponseEntity.ok(response);
    }

    /**
     * 모임 상세 조회
     */
    @GetMapping("/meetings/{meetingId}")
    public ResponseEntity<MeetingManageResponse> getMeetingDetail(
            @PathVariable Long meetingId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        MeetingManageResponse response = adminService.getMeetingDetail(meetingId);
        return ResponseEntity.ok(response);
    }

    /**
     * 모임 상태 변경
     */
    @PatchMapping("/meetings/{meetingId}/status")
    public ResponseEntity<String> updateMeetingStatus(
            @PathVariable Long meetingId,
            @RequestBody MeetingStatusRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        adminService.updateMeetingStatus(meetingId, request);
        return ResponseEntity.ok("모임 상태가 변경되었습니다.");
    }

    /**
     * 문의 목록 조회
     */
    @GetMapping("/inquiries")  // 또는 "/inqu_ed"
    public ResponseEntity<InquiryListResponse> getInquiryList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // TODO: Service에서 문의 목록 조회 로직 구현
        InquiryListResponse response = adminService.getInquiryList(page, size, search);
        return ResponseEntity.ok(response);
    }

    /**
     * 문의 상세 조회
     */
    @GetMapping("/inquiries/{inquiryId}")
    public ResponseEntity<InquiryDetailResponse> getInquiryDetail(
            @PathVariable Long inquiryId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        InquiryDetailResponse response = adminService.getInquiryDetail(inquiryId);
        return ResponseEntity.ok(response);
    }

    // ========== 공지사항 관리 ==========

    /**
     * 공지사항 목록 조회
     */
    @GetMapping("/announcements")
    public ResponseEntity<AnnouncementListResponse> getAnnouncementList(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false, defaultValue = "PUBLISHED") String status,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AnnouncementListResponse response = adminService.getAnnouncementList(page, size, status);
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항 상세 조회
     */
    @GetMapping("/announcements/{announcementId}")
    public ResponseEntity<AnnouncementResponse> getAnnouncementDetail(
            @PathVariable Long announcementId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AnnouncementResponse response = adminService.getAnnouncementDetail(announcementId);
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항 생성
     */
    @PostMapping("/announcements")
    public ResponseEntity<AnnouncementResponse> createAnnouncement(
            @Valid @RequestBody AnnouncementCreateRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AnnouncementResponse response = adminService.createAnnouncement(request, adminId);
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항 수정
     */
    @PutMapping("/announcements/{announcementId}")
    public ResponseEntity<AnnouncementResponse> updateAnnouncement(
            @PathVariable Long announcementId,
            @Valid @RequestBody AnnouncementUpdateRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AnnouncementResponse response = adminService.updateAnnouncement(announcementId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 공지사항 삭제
     */
    @DeleteMapping("/announcements/{announcementId}")
    public ResponseEntity<String> deleteAnnouncement(
            @PathVariable Long announcementId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        adminService.deleteAnnouncement(announcementId);
        return ResponseEntity.ok("공지사항이 삭제되었습니다.");
    }

    /**
     * 공지사항 상단 고정 토글
     */
    @PatchMapping("/announcements/{announcementId}/pin")
    public ResponseEntity<String> toggleAnnouncementPin(
            @PathVariable Long announcementId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        adminService.toggleAnnouncementPin(announcementId);
        return ResponseEntity.ok("고정 상태가 변경되었습니다.");
    }


// ========== 신고 관리 ==========

    /**
     * 신고 목록 조회 (페이징)
     */
    @GetMapping("/reports/paged")
    public ResponseEntity<ReportListResponse> getReportsPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ReportListResponse response = adminService.getReportsPaged(page, size, status);
        return ResponseEntity.ok(response);
    }

    /**
     * 신고 상세 조회
     */
    @GetMapping("/reports/{reportId}")
    public ResponseEntity<ReportResponse> getReportDetail(
            @PathVariable Long reportId,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        ReportResponse response = adminService.getReportDetail(reportId);
        return ResponseEntity.ok(response);
    }

    /**
     * 신고 상태 업데이트
     */
    @PatchMapping("/reports/{reportId}/status")
    public ResponseEntity<String> updateReportStatus(
            @PathVariable Long reportId,
            @RequestBody ReportStatusRequest request,
            HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        adminService.updateReportStatus(reportId, request, adminId);
        return ResponseEntity.ok("신고 상태가 변경되었습니다.");
    }
}
