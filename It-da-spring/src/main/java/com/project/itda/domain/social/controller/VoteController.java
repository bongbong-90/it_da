package com.project.itda.domain.social.controller;

import com.project.itda.domain.auth.dto.SessionUser;
import com.project.itda.domain.social.dto.request.VoteActionRequest;
import com.project.itda.domain.social.dto.request.VoteRequest;
import com.project.itda.domain.social.dto.response.VoteResponse;
import com.project.itda.domain.social.service.VoteService;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/votes")
@RequiredArgsConstructor
@Slf4j
public class VoteController {

    private final VoteService voteService;
    private final HttpSession httpSession;

    /**
     * 투표 생성
     */
    @PostMapping("/{roomId}")
    public ResponseEntity<VoteResponse> createVote(
            @PathVariable Long roomId,
            @RequestBody VoteRequest request) {

        log.info("📥 투표 생성 요청 - roomId: {}, request: {}", roomId, request);
        log.info("🔍 세션 ID: {}", httpSession.getId());

        SessionUser user = (SessionUser) httpSession.getAttribute("user");
        log.info("🔍 세션에서 가져온 user: {}", user);

        if (user == null) {
            log.error("❌ 세션에 user 정보 없음");
            return ResponseEntity.status(401).body(null);
        }

        log.info("✅ 인증된 사용자: {}", user.getEmail());
        return ResponseEntity.ok(voteService.createVote(request, user.getEmail(), roomId));
    }

    /**
     * 투표하기 (항목 선택)
     */
    // VoteController.java 수정 제안
    @PostMapping("/{voteId}/cast")
    public ResponseEntity<VoteResponse> castVote(
            @PathVariable Long voteId,
            @RequestBody VoteActionRequest request,
            @SessionAttribute(name = "user", required = false) SessionUser user) { // @SessionAttribute 사용

        log.info("📥 투표 전송 요청 - voteId: {}, request: {}", voteId, request);
        log.info("🔍 세션에서 가져온 user: {}", user);

        if (user == null) {
            log.error("❌ 세션에 유저 정보가 없습니다. 로그인이 필요합니다.");
            return ResponseEntity.status(401).build();
        }

        return ResponseEntity.ok(voteService.castVote(voteId, request, user.getEmail()));
    }
}