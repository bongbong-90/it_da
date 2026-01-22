package com.project.itda.domain.user.service;

import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import com.project.itda.domain.notification.service.NotificationService;
import com.project.itda.domain.participation.entity.Participation;
import com.project.itda.domain.participation.enums.ParticipationStatus;
import com.project.itda.domain.participation.repository.ParticipationRepository;
import com.project.itda.domain.user.dto.request.ReviewCreateRequest;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.entity.UserReview;
import com.project.itda.domain.user.enums.SentimentType;
import com.project.itda.domain.user.repository.UserRepository;
import com.project.itda.domain.user.repository.UserReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserReviewService {

    private final UserRepository userRepository;
    private final MeetingRepository meetingRepository;
    private final ParticipationRepository participationRepository;
    private final UserReviewRepository userReviewRepository;
    private final SentimentAnalyzer sentimentAnalyzer;
    private final NotificationService notificationService;  // ✅ 추가!

    @Transactional
    public UserReview createReview(Long currentUserId, Long meetingId, ReviewCreateRequest request) {
        log.info("후기 작성 시작: userId={}, meetingId={}", currentUserId, meetingId);

        User user = userRepository.findById(currentUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));

        Meeting meeting = meetingRepository.findById(meetingId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "모임을 찾을 수 없습니다."));

        // ✅ Participation 테이블에서 조회!
        Participation participation = participationRepository
                .findByUserIdAndMeetingId(currentUserId, meetingId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "해당 모임에 참여 기록이 없습니다."));

        // ✅ COMPLETED 상태 확인
        if (participation.getStatus() != ParticipationStatus.COMPLETED) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "참여 완료된 모임만 후기를 작성할 수 있습니다. 현재 상태: " + participation.getStatus());
        }

        if (userReviewRepository.existsByUserUserIdAndMeetingMeetingId(currentUserId, meetingId)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "이미 후기를 작성했습니다.");
        }

        SentimentType sentiment = sentimentAnalyzer.analyze(request.getRating(), request.getContent());

        UserReview review = UserReview.builder()
                .user(user)
                .meeting(meeting)
                .participation(participation)
                .rating(request.getRating())
                .reviewText(request.getContent())
                .sentiment(sentiment)
                .isPublic(true)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        UserReview savedReview = userReviewRepository.save(review);
        log.info("✅ 후기 작성 완료: reviewId={}, sentiment={}", savedReview.getReviewId(), sentiment);

        // ✅ 팔로워들에게 후기 작성 알림 전송!
        try {
            notificationService.notifyFollowersAboutReview(
                    user,
                    savedReview.getReviewId(),
                    meetingId,
                    meeting.getTitle()
            );
            log.info("🔔 팔로워들에게 후기 작성 알림 전송 완료");
        } catch (Exception e) {
            log.error("❌ 팔로워 알림 전송 실패: {}", e.getMessage());
            // 알림 실패해도 후기 작성은 성공해야 함
        }

        return savedReview;
    }
}