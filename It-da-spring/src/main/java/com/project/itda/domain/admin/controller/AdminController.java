package com.project.itda.domain.admin.controller;

import com.project.itda.domain.admin.dto.response.AdminDashboardResponse;
import com.project.itda.domain.admin.entity.AdminUser;
import com.project.itda.domain.admin.repository.AdminUserRepository;
import com.project.itda.domain.admin.service.AdminService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;


    // ========== 임시 로그인 (개발용) ==========
    private final AdminUserRepository adminUserRepository;

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(
            @RequestBody Map<String, String> request,
            HttpSession session) {

        String email = request.get("email");

        AdminUser admin = adminUserRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("관리자를 찾을 수 없습니다"));

        // 세션에 adminId 저장
        session.setAttribute("adminId", admin.getAdminId());

        Map<String, Object> response = new HashMap<>();
        response.put("message", "로그인 성공");
        response.put("adminId", admin.getAdminId());
        response.put("name", admin.getName());
        response.put("email", admin.getEmail());
        response.put("role", admin.getRole());

        return ResponseEntity.ok(response);
    }

    //대시보드 조회 ==============================================================

    @GetMapping("/dashboard")
    public ResponseEntity<AdminDashboardResponse> getDashboard(HttpSession session) {

        Long adminId = (Long) session.getAttribute("adminId");
        if (adminId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        AdminDashboardResponse response = adminService.getDashboard(adminId);
        return ResponseEntity.ok(response);
    }
}