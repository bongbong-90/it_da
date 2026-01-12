package com.project.itda.domain.social.controller;

import com.project.itda.domain.auth.dto.SessionUser;
import com.project.itda.domain.social.service.FollowService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/social/follow")
@RequiredArgsConstructor
public class FollowController {

    private final FollowService followService;
    private final HttpSession httpSession;

    @PostMapping("/{followingId}")
    public ResponseEntity<Void> follow(@PathVariable Long followingId) {
        SessionUser user = (SessionUser) httpSession.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).build();

        followService.follow(user.getEmail(), followingId);
        return ResponseEntity.noContent().build(); // 204 No Content
    }

    @DeleteMapping("/{followingId}")
    public ResponseEntity<Void> unfollow(@PathVariable Long followingId) {
        SessionUser user = (SessionUser) httpSession.getAttribute("user");
        if (user == null) return ResponseEntity.status(401).build();

        followService.unfollow(user.getEmail(), followingId);
        return ResponseEntity.noContent().build();
    }
}