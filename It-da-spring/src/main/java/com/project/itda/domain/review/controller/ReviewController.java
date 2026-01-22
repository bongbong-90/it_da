package com.project.itda.domain.review.controller;

import com.project.itda.domain.review.dto.request.ReviewCreateRequest;
import com.project.itda.domain.review.dto.request.ReviewUpdateRequest;
import com.project.itda.domain.review.dto.response.ReviewListResponse;
import com.project.itda.domain.review.dto.response.ReviewResponse;
import com.project.itda.domain.review.dto.response.UserReviewDTO;
import com.project.itda.domain.review.service.ReviewService;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.repository.UserRepository;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
@Slf4j
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173", "http://localhost:8000"})
public class ReviewController {

    private final ReviewService reviewService;
    private final UserRepository userRepository;

    /**
     * 세션에서 사용자 조회
     */
    private User getLoginUser(HttpSession session) {
        Long userId = (Long) session.getAttribute("userId");
        if (userId == null) {
            throw new IllegalStateException("로그인이 필요합니다");
        }
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalStateException("사용자를 찾을 수 없습니다"));
    }

    /**
     * 후기 작성
     * POST /api/reviews
     */
    @PostMapping
    public ResponseEntity<ReviewResponse> createReview(
            HttpSession session,
            @Valid @RequestBody ReviewCreateRequest request
    ) {
        User user = getLoginUser(session);
        log.info("📝 후기 작성 요청 - userId: {}, meetingId: {}", user.getUserId(), request.getMeetingId());
        ReviewResponse response = reviewService.createReview(user, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 후기 수정
     * PUT /api/reviews/{reviewId}
     */
    @PutMapping("/{reviewId}")
    public ResponseEntity<ReviewResponse> updateReview(
            HttpSession session,
            @PathVariable Long reviewId,
            @Valid @RequestBody ReviewUpdateRequest request
    ) {
        User user = getLoginUser(session);
        log.info("✏️ 후기 수정 요청 - userId: {}, reviewId: {}", user.getUserId(), reviewId);
        ReviewResponse response = reviewService.updateReview(user, reviewId, request);
        return ResponseEntity.ok(response);
    }

    /**
     * 후기 삭제
     * DELETE /api/reviews/{reviewId}
     */
    @DeleteMapping("/{reviewId}")
    public ResponseEntity<Void> deleteReview(
            HttpSession session,
            @PathVariable Long reviewId
    ) {
        User user = getLoginUser(session);
        log.info("🗑️ 후기 삭제 요청 - userId: {}, reviewId: {}", user.getUserId(), reviewId);
        reviewService.deleteReview(user, reviewId);
        return ResponseEntity.ok().build();
    }

    /**
     * ✅ 모임의 후기 목록 조회 (모달용)
     * GET /api/reviews/meeting/{meetingId}
     */
    @GetMapping("/meeting/{meetingId}")
    public ResponseEntity<List<ReviewResponse>> getReviewsByMeeting(@PathVariable Long meetingId) {
        log.info("📋 모임 후기 목록 조회 - meetingId: {}", meetingId);
        List<ReviewResponse> reviews = reviewService.getReviewListByMeetingId(meetingId);
        return ResponseEntity.ok(reviews);
    }

    /**
     * 모임의 후기 목록 조회 (통계 포함)
     * GET /api/reviews/meeting/{meetingId}/stats
     */
    @GetMapping("/meeting/{meetingId}/stats")
    public ResponseEntity<ReviewListResponse> getReviewsWithStats(@PathVariable Long meetingId) {
        log.info("📊 모임 후기 통계 조회 - meetingId: {}", meetingId);
        ReviewListResponse response = reviewService.getReviewsByMeetingId(meetingId);
        return ResponseEntity.ok(response);
    }

    /**
     * ✅ 사용자가 작성한 후기 목록 조회
     * GET /api/reviews/user/{userId}/written
     */
    @GetMapping("/user/{userId}/written")
    public ResponseEntity<List<ReviewResponse>> getReviewsByUser(@PathVariable Long userId) {
        log.info("📋 사용자 후기 목록 조회 - userId: {}", userId);
        List<ReviewResponse> reviews = reviewService.getReviewsByUserId(userId);
        return ResponseEntity.ok(reviews);
    }

    /**
     * 사용자 리뷰 목록 조회 (FastAPI AI 서버 - SVD용)
     * GET /api/reviews/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserReviewDTO>> getUserReviews(@PathVariable Long userId) {
        log.info("🔍 AI용 사용자 리뷰 조회 - userId: {}", userId);
        List<UserReviewDTO> reviews = reviewService.getUserReviews(userId);
        return ResponseEntity.ok(reviews);
    }
}