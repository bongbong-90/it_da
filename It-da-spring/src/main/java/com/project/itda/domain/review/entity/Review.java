package com.project.itda.domain.review.entity;

import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.participation.entity.Participation;
import com.project.itda.domain.review.enums.SentimentType;
import com.project.itda.domain.user.entity.User;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "participation_id", nullable = false)
    private Participation participation;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "meeting_id", nullable = false)
    private Meeting meeting;

    /**
     * 평점 (1~5) ✅
     */
    @Column(nullable = false)
    private Integer rating;

    /**
     * 후기 내용 ✅
     */
    @Column(name = "review_text", columnDefinition = "TEXT", nullable = false)
    private String reviewText;

    @Enumerated(EnumType.STRING)
    @Column(name = "sentiment", length = 20)
    private SentimentType sentiment;

    @Column(name = "sentiment_score")
    private Double sentimentScore;

    @Column(name = "is_public", nullable = false)
    @Builder.Default
    private Boolean isPublic = true;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (isPublic == null) {
            isPublic = true;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void update(Integer rating, String reviewText, Boolean isPublic) {
        this.rating = rating;
        this.reviewText = reviewText;
        this.isPublic = isPublic;
    }

    public void updateSentiment(SentimentType sentiment, Double sentimentScore) {
        this.sentiment = sentiment;
        this.sentimentScore = sentimentScore;
    }

    public void delete() {
        this.deletedAt = LocalDateTime.now();
    }
}