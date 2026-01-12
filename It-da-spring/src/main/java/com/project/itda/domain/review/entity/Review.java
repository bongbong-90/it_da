package com.project.itda.domain.review.entity;

import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.participation.entity.Participation;
import com.project.itda.domain.review.enums.SentimentType;
import com.project.itda.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 후기 엔티티
 */
@Entity
@Table(name = "reviews")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    /**
     * 참여 정보
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participation_id", nullable = false)
    private Participation participation;

    /**
     * 작성자
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 모임
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    /**
     * 평점 (1~5)
     */
    @Column(nullable = false)
    private Integer rating;

    /**
     * 후기 내용
     */
    @Column(name = "review_text", columnDefinition = "TEXT", nullable = false)
    private String reviewText;

    // ========================================
    // AI 감성 분석 필드
    // ========================================

    /**
     * 감성 분석 결과
     * POSITIVE, NEUTRAL, NEGATIVE
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "sentiment", length = 20)
    private SentimentType sentiment;

    /**
     * 감성 점수 (0~1)
     */
    @Column(name = "sentiment_score")
    private Double sentimentScore;

    // ========================================

    /**
     * 공개 여부
     */
    @Column(name = "is_public", nullable = false)
    private Boolean isPublic;

    /**
     * 작성 일시
     */
    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    /**
     * 수정 일시
     */
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    /**
     * 삭제 일시 (소프트 삭제)
     */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    // ========================================
    // 비즈니스 메서드
    // ========================================

    /**
     * 후기 수정
     */
    public void update(Integer rating, String reviewText, Boolean isPublic) {
        this.rating = rating;
        this.reviewText = reviewText;
        this.isPublic = isPublic;
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * 감성 분석 결과 업데이트
     */
    public void updateSentiment(SentimentType sentiment, Double sentimentScore) {
        this.sentiment = sentiment;
        this.sentimentScore = sentimentScore;
    }

    /**
     * 소프트 삭제
     */
    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}