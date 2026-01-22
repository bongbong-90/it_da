package com.project.itda.domain.participation.controller;

import com.project.itda.domain.meeting.dto.response.MeetingDetailResponse;
import com.project.itda.domain.meeting.service.MeetingService;
import com.project.itda.domain.participation.dto.request.ParticipationRequest;
import com.project.itda.domain.participation.dto.request.ParticipationStatusRequest;
import com.project.itda.domain.participation.dto.response.ParticipantListResponse;
import com.project.itda.domain.participation.dto.response.ParticipationResponse;
import com.project.itda.domain.participation.service.ParticipationService;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 참여 컨트롤러
 */
@Tag(name = "참여", description = "모임 참여 신청/승인/거절 API")
@RestController
@RequestMapping("/api/participations")
@RequiredArgsConstructor
@Slf4j
public class ParticipationController {

    private final ParticipationService participationService;
    private final UserRepository userRepository;

    /**
     * 모임 참여 신청
     */
    @Operation(
            summary = "모임 참여 신청",
            description = "모임에 참여를 신청합니다"
    )
    @PostMapping
    public ResponseEntity<ParticipationResponse> applyParticipation(
            @AuthenticationPrincipal Long userId,  // ← 이건 null 올 수 있음
            @Valid @RequestBody ParticipationRequest request
    ) {
        log.info("📍 POST /api/participations - userId: {}, meetingId: {}",
                userId, request.getMeetingId());

        // ✅ userId가 null이면 request에서 가져오기
        Long actualUserId = userId != null ? userId : request.getUserId();

        if (actualUserId == null) {
            throw new IllegalArgumentException("로그인이 필요합니다.");
        }

        User user = userRepository.findById(actualUserId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ParticipationResponse response = participationService.applyParticipation(user, request);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * 참여 승인 (주최자만)
     */
    @Operation(
            summary = "참여 승인",
            description = "참여 신청을 승인합니다 (주최자만 가능)"
    )
    @PostMapping("/{participationId}/approve")
    public ResponseEntity<ParticipationResponse> approveParticipation(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "참여 ID", required = true)
            @PathVariable Long participationId
    ) {
        log.info("📍 POST /api/participations/{}/approve - userId: {}",
                participationId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ParticipationResponse response = participationService.approveParticipation(user, participationId);

        return ResponseEntity.ok(response);
    }

    /**
     * 참여 거절 (주최자만)
     */
    @Operation(
            summary = "참여 거절",
            description = "참여 신청을 거절합니다 (주최자만 가능)"
    )
    @PostMapping("/{participationId}/reject")
    public ResponseEntity<ParticipationResponse> rejectParticipation(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "참여 ID", required = true)
            @PathVariable Long participationId,
            @Valid @RequestBody ParticipationStatusRequest request
    ) {
        log.info("📍 POST /api/participations/{}/reject - userId: {}",
                participationId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        ParticipationResponse response = participationService.rejectParticipation(
                user, participationId, request
        );

        return ResponseEntity.ok(response);
    }

    /**
     * 참여 취소 (신청자 본인)
     */
    @Operation(
            summary = "참여 취소",
            description = "참여 신청을 취소합니다 (본인만 가능)"
    )
    @DeleteMapping("/{participationId}")
    public ResponseEntity<Void> cancelParticipation(
            @AuthenticationPrincipal Long userId,
            @Parameter(description = "참여 ID", required = true)
            @PathVariable Long participationId
    ) {
        log.info("📍 DELETE /api/participations/{} - userId: {}",
                participationId, userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        participationService.cancelParticipation(user, participationId);

        return ResponseEntity.noContent().build();
    }

    /**
     * 모임의 참여자 목록 조회
     */
    @Operation(
            summary = "모임 참여자 목록 조회",
            description = "모임의 참여자 목록을 조회합니다 (상태별 통계 포함)"
    )
    @GetMapping("/meeting/{meetingId}")
    public ResponseEntity<ParticipantListResponse> getParticipantsByMeetingId(
            @Parameter(description = "모임 ID", required = true)
            @PathVariable Long meetingId
    ) {
        log.info("📍 GET /api/participations/meeting/{}", meetingId);

        ParticipantListResponse response = participationService.getParticipantsByMeetingId(meetingId);

        return ResponseEntity.ok(response);
    }

    /**
     * 내가 신청한 참여 목록 조회
     */
    @Operation(
            summary = "내 참여 목록 조회",
            description = "로그인 사용자가 신청한 참여 목록을 조회합니다"
    )
    @GetMapping("/my")
    public ResponseEntity<List<ParticipationResponse>> getMyParticipations(
            @AuthenticationPrincipal Long userId
    ) {
        log.info("📍 GET /api/participations/my - userId: {}", userId);

        List<ParticipationResponse> responses = participationService.getParticipationsByUserId(userId);

        return ResponseEntity.ok(responses);
    }
}