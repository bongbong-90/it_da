package com.project.itda.domain.ai.service;

import com.project.itda.domain.ai.dto.request.SatisfactionPredictionRequest;
import com.project.itda.domain.ai.dto.response.SatisfactionPredictionDTO;
import com.project.itda.domain.ai.dto.response.SatisfactionPredictionResponse;
import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import com.project.itda.domain.participation.repository.ParticipationRepository;
import com.project.itda.domain.review.repository.ReviewRepository;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.entity.UserPreference;
import com.project.itda.domain.user.repository.UserPreferenceRepository;
import com.project.itda.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

/**
 * AI 기반 만족도 예측 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SatisfactionPredictionService {

    private final AIServiceClient aiServiceClient;
    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final MeetingRepository meetingRepository;
    private final ReviewRepository reviewRepository;
    private final ParticipationRepository participationRepository;

    /**
     * 모임 상세 페이지 만족도 예측
     *
     * @param userId 사용자 ID
     * @param meetingId 모임 ID
     * @return 예측 만족도
     */
    public SatisfactionPredictionDTO predictSatisfaction(Long userId, Long meetingId) {
        log.info("🎯 만족도 예측 시작 - userId: {}, meetingId: {}", userId, meetingId);

        try {
            // 1. 사용자 정보 조회
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

            UserPreference userPref = userPreferenceRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자 성향을 찾을 수 없습니다: " + userId));

            // 2. 모임 정보 조회
            Meeting meeting = meetingRepository.findById(meetingId)
                    .orElseThrow(() -> new IllegalArgumentException("모임을 찾을 수 없습니다: " + meetingId));

            // 3. 사용자 통계 계산
            Double userAvgRating = reviewRepository.getAvgRatingByUserId(userId);
            if (userAvgRating == null) userAvgRating = 4.2; // 기본값

            Long userMeetingCount = participationRepository.countByUserIdAndStatus(
                    userId,
                    com.project.itda.domain.participation.enums.ParticipationStatus.COMPLETED
            );

            Double userRatingStd = reviewRepository.getRatingStdByUserId(userId);
            if (userRatingStd == null) userRatingStd = 0.3; // 기본값

            // 4. 모임 통계 계산
            Double meetingAvgRating = reviewRepository.getAvgRatingByMeetingId(meetingId);
            if (meetingAvgRating == null) meetingAvgRating = 4.1; // 기본값

            Long meetingRatingCount = reviewRepository.countByMeetingId(meetingId);

            // 5. FastAPI 요청 생성
            SatisfactionPredictionRequest request = SatisfactionPredictionRequest.builder()
                    // 기본 ID
                    .userId(userId.intValue())
                    .meetingId(meetingId.intValue())
                    // 사용자 피처
                    .userLat(user.getLatitude())
                    .userLng(user.getLongitude())
                    .userInterests(userPref.getInterests())
                    .userTimePreference(userPref.getTimePreference().toLowerCase())
                    .userLocationPref(userPref.getLocationType().toLowerCase())
                    .userBudgetType(userPref.getBudgetType().toLowerCase())
                    .userEnergyType(userPref.getEnergyType().toLowerCase())
                    .userPurposeType(userPref.getPurposeType().toLowerCase())
                    .userFrequencyType(userPref.getFrequencyType().toLowerCase())
                    .userLeadershipType(userPref.getLeadershipType().toLowerCase())
                    .userAvgRating(userAvgRating)
                    .userMeetingCount(userMeetingCount.intValue())
                    .userRatingStd(userRatingStd)
                    // 모임 피처
                    .meetingLat(meeting.getLatitude())
                    .meetingLng(meeting.getLongitude())
                    .meetingCategory(meeting.getCategory())
                    .meetingSubcategory(meeting.getSubcategory())
                    .meetingTimeSlot(meeting.getTimeSlot().name().toLowerCase())
                    .meetingLocationType(meeting.getLocationType().name().toLowerCase())
                    .meetingVibe(meeting.getVibe())
                    .meetingMaxParticipants(meeting.getMaxParticipants())
                    .meetingExpectedCost(meeting.getExpectedCost().doubleValue())
                    .meetingAvgRating(meetingAvgRating)
                    .meetingRatingCount(meetingRatingCount.intValue())
                    .meetingParticipantCount(meeting.getCurrentParticipants())
                    .build();

            // 6. FastAPI 호출
            SatisfactionPredictionResponse aiResponse = aiServiceClient.predictSatisfaction(request);

            if (!aiResponse.getSuccess()) {
                log.warn("⚠️ AI 만족도 예측 실패 - userId: {}, meetingId: {}", userId, meetingId);
                return buildErrorResponse(userId, meetingId);
            }

            // 7. 거리 계산
            Double distanceKm = calculateDistance(
                    user.getLatitude(), user.getLongitude(),
                    meeting.getLatitude(), meeting.getLongitude()
            );

            // 8. 응답 생성
            Double predictedRating = aiResponse.getPredictedRating();
            String ratingStars = generateRatingStars(predictedRating);
            String satisfactionLevel = getSatisfactionLevel(predictedRating);
            boolean recommended = predictedRating >= 4.0;

            List<SatisfactionPredictionDTO.ReasonItem> reasons = aiResponse.getReasons().stream()
                    .map(r -> SatisfactionPredictionDTO.ReasonItem.builder()
                            .icon(r.getIcon())
                            .text(r.getText())
                            .build())
                    .collect(Collectors.toList());

            log.info("✅ 만족도 예측 완료 - predictedRating: {}, recommended: {}",
                    predictedRating, recommended);

            return SatisfactionPredictionDTO.builder()
                    .success(true)
                    .message("만족도 예측 성공")
                    .userId(userId)
                    .meetingId(meetingId)
                    .predictedRating(predictedRating)
                    .ratingStars(ratingStars)
                    .satisfactionLevel(satisfactionLevel)
                    .recommended(recommended)
                    .reasons(reasons)
                    .distanceKm(distanceKm)
                    .build();

        } catch (Exception e) {
            log.error("❌ 만족도 예측 실패: {}", e.getMessage(), e);
            return buildErrorResponse(userId, meetingId);
        }
    }

    /**
     * 에러 응답 생성
     */
    private SatisfactionPredictionDTO buildErrorResponse(Long userId, Long meetingId) {
        return SatisfactionPredictionDTO.builder()
                .success(false)
                .message("만족도 예측 실패")
                .userId(userId)
                .meetingId(meetingId)
                .predictedRating(null)
                .build();
    }

    /**
     * 별점 문자열 생성
     */
    private String generateRatingStars(Double rating) {
        if (rating == null) return "";

        int fullStars = (int) Math.floor(rating);
        boolean hasHalfStar = (rating - fullStars) >= 0.5;

        StringBuilder stars = new StringBuilder();
        for (int i = 0; i < fullStars; i++) {
            stars.append("⭐");
        }
        if (hasHalfStar && fullStars < 5) {
            stars.append("✨");
        }

        return stars.toString();
    }

    /**
     * 만족도 수준 텍스트
     */
    private String getSatisfactionLevel(Double rating) {
        if (rating == null) return "알 수 없음";
        if (rating >= 4.5) return "매우 높음";
        if (rating >= 4.0) return "높음";
        if (rating >= 3.5) return "보통";
        if (rating >= 3.0) return "낮음";
        return "매우 낮음";
    }

    /**
     * 거리 계산 (Haversine)
     */
    private Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        final int R = 6371;
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}