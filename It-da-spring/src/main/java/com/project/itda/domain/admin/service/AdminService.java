package com.project.itda.domain.admin.service;

import com.project.itda.domain.admin.dto.response.AdminDashboardResponse;
import com.project.itda.domain.admin.entity.AdminUser;
import com.project.itda.domain.admin.enums.ReportStatus;
import com.project.itda.domain.admin.repository.AdminUserRepository;
import com.project.itda.domain.admin.repository.AnnouncementRepository;
import com.project.itda.domain.admin.repository.ReportRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AdminService {

    private final AdminUserRepository adminUserRepository;
    private final ReportRepository reportRepository;
    private final AnnouncementRepository announcementRepository;

    public AdminDashboardResponse getDashboard(Long adminId) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));

        // 대기중인 신고 수
        Long pendingReportsCount = reportRepository.findAllByStatusWithResolver(ReportStatus.PENDING)
                .stream()
                .count();

        // 오늘 작성된 공지사항 수
        Long todayAnnouncementsCount = announcementRepository.findAll()
                .stream()
                .filter(a -> a.getCreatedAt().toLocalDate().equals(LocalDate.now()))
                .count();

        AdminDashboardResponse response = AdminDashboardResponse.from(admin);
        response.setPendingReportsCount(pendingReportsCount);
        response.setTodayAnnouncementsCount(todayAnnouncementsCount);

        return response;
    }

    public AdminUser findByEmail(String email) {
        return adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));
    }

    @Transactional
    public void updateLastLogin(Long adminId) {
        AdminUser admin = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));
        admin.setLastLoginAt(LocalDateTime.now());
    }
}