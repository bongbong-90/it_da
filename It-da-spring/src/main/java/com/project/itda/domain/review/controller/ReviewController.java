package com.project.itda.domain.review.controller;

import com.project.itda.domain.review.dto.response.UserReviewDTO;
import com.project.itda.domain.review.entity.Review;
import com.project.itda.domain.review.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewRepository reviewRepository;

    /**
     * 사용자의 모든 리뷰 조회 (AI 추천용)
     *
     * GET /api/reviews/user/{userId}
     */
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<UserReviewDTO>> getUserReviews(@PathVariable Long userId) {
        List<Review> reviews = reviewRepository.findByUser_UserId(userId);

        List<UserReviewDTO> dtos = reviews.stream()
                .map(review -> UserReviewDTO.builder()
                        .meetingId(review.getMeeting().getMeetingId())
                        .rating(review.getRating().doubleValue()) // ✅ Integer → Double 변환
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(dtos);
    }
}