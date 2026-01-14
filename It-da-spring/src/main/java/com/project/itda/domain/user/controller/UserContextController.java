package com.project.itda.domain.user.controller;

import com.project.itda.domain.user.dto.request.UserContextDTO;
import com.project.itda.domain.user.dto.response.UserContextResponse;
import com.project.itda.domain.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
public class UserContextController {

    private final UserService userService;

    // ✅ PathVariable로 변경
    @GetMapping("/{userId}/context")
    public ResponseEntity<UserContextResponse> getUserContext(
            @PathVariable Long userId
    ) {
        log.info("📊 사용자 컨텍스트 조회: userId={}", userId);
        UserContextResponse context = userService.getUserContext(userId);
        return ResponseEntity.ok(context);
    }
}