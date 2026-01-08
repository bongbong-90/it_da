package com.project.itda.domain.admin.dto.response;

import com.project.itda.domain.admin.entity.AdminUser;
import com.project.itda.domain.admin.enums.AdminRole;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class AdminDashboardResponse {
    private Long adminId;
    private String name;
    private String email;
    private AdminRole role;
    private LocalDateTime lastLoginAt;

    // 통계 정보
    private Long pendingReportsCount;
    private Long todayAnnouncementsCount;
    private Long activeUsersCount;

    public static AdminDashboardResponse from(AdminUser admin) {
        return AdminDashboardResponse.builder()
                .adminId(admin.getAdminId())
                .name(admin.getName())
                .email(admin.getEmail())
                .role(admin.getRole())
                .lastLoginAt(admin.getLastLoginAt())
                .build();
    }
}