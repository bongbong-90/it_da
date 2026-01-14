package com.project.itda.domain.ai.service;

import com.project.itda.domain.ai.dto.request.MeetingRecommendRequest;
import com.project.itda.domain.ai.dto.response.AiRecommendListResponse;
import com.project.itda.domain.ai.dto.response.MeetingRecommendResponse;
import com.project.itda.domain.ai.dto.response.RecommendedMeetingDTO;
import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import com.project.itda.domain.user.entity.User;
import com.project.itda.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI 기반 모임 추천 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiRecommendationService {

    private final AIServiceClient aiServiceClient;
    private final MeetingRepository meetingRepository;
    private final UserRepository userRepository;

    /**
     * SVD 협업 필터링 기반 모임 추천
     *
     * @param userId 사용자 ID
     * @param topN 추천 개수
     * @return 추천 모임 목록
     */
    @Transactional(readOnly = true)
    public AiRecommendListResponse recommendMeetings(Long userId, Integer topN) {
        long startTime = System.currentTimeMillis();
        log.info("🎯 AI 모임 추천 시작 - userId: {}, topN: {}", userId, topN);

        // 0) 입력값 방어
        if (userId == null) {
            throw new IllegalArgumentException("userId는 null일 수 없습니다.");
        }
        int safeTopN = (topN == null || topN <= 0) ? 10 : Math.min(topN, 50); // ✅ 상한도 여기서 처리

        try {
            // 1) 사용자 조회 (distance 계산/검증용이면 유지, 아니면 제거 가능)
            User user = userRepository.findById(userId)
                    .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다: " + userId));

            // 2) FastAPI로 AI 추천 요청 ✅ request를 실제로 사용
            MeetingRecommendRequest request = MeetingRecommendRequest.builder()
                    .userId(userId.intValue())
                    .topN(safeTopN)
                    .build();

            // ✅ 여기: request를 보내는 메서드로 호출 (AIServiceClient에 post 메서드가 있어야 함)
            MeetingRecommendResponse aiResponse = aiServiceClient.recommendMeetings(request);

            if (aiResponse == null
                    || !Boolean.TRUE.equals(aiResponse.getSuccess())
                    || aiResponse.getRecommendations() == null
                    || aiResponse.getRecommendations().isEmpty()) {
                log.warn("⚠️ AI 추천 결과 없음 - userId: {}", userId);
                return buildEmptyResponse(userId, startTime);
            }

            // 3) 추천된 모임 ID 리스트(중복 제거, 순서 유지)
            List<Long> meetingIds = aiResponse.getRecommendations().stream()
                    .map(r -> r.getMeetingId() == null ? null : r.getMeetingId().longValue())
                    .filter(Objects::nonNull)
                    .collect(Collectors.collectingAndThen(
                            Collectors.toCollection(LinkedHashSet::new), // ✅ 순서 유지 + 중복 제거
                            ArrayList::new
                    ));

            if (meetingIds.isEmpty()) {
                log.warn("⚠️ AI 추천 meetingIds 비어있음 - userId: {}", userId);
                return buildEmptyResponse(userId, startTime);
            }

            log.info("📋 AI 추천 모임 IDs: {}", meetingIds);

            // 4) DB에서 모임 조회
            List<Meeting> meetings = meetingRepository.findAllById(meetingIds);
            if (meetings == null || meetings.isEmpty()) {
                log.warn("⚠️ DB에서 모임을 찾을 수 없음 - meetingIds: {}", meetingIds);
                return buildEmptyResponse(userId, startTime);
            }

            // 5) meetingId -> Meeting 맵
            Map<Long, Meeting> meetingMap = meetings.stream()
                    .filter(Objects::nonNull)
                    .collect(Collectors.toMap(Meeting::getMeetingId, m -> m, (a, b) -> a));

            // 6) meetingId -> score/rank 맵
            Map<Long, MeetingRecommendResponse.RecommendedMeeting> scoreMap =
                    aiResponse.getRecommendations().stream()
                            .filter(r -> r != null && r.getMeetingId() != null)
                            .collect(Collectors.toMap(
                                    r -> r.getMeetingId().longValue(),
                                    r -> r,
                                    (a, b) -> a
                            ));

            // 7) DB에 없는 ID 로깅
            List<Long> missingIds = meetingIds.stream()
                    .filter(id -> !meetingMap.containsKey(id))
                    .toList();
            if (!missingIds.isEmpty()) {
                log.warn("⚠️ AI 추천 ID 중 DB에 없는 항목: {}", missingIds);
            }

            // 8) DTO 변환 (AI 순서 유지)
            List<RecommendedMeetingDTO> recommendations = meetingIds.stream()
                    .map(meetingId -> {
                        Meeting meeting = meetingMap.get(meetingId);
                        MeetingRecommendResponse.RecommendedMeeting aiMeeting = scoreMap.get(meetingId);
                        if (meeting == null || aiMeeting == null) return null;

                        Double distanceKm = null;
                        if (user.getLatitude() != null && user.getLongitude() != null
                                && meeting.getLatitude() != null && meeting.getLongitude() != null) {
                            distanceKm = calculateDistance(
                                    user.getLatitude(),
                                    user.getLongitude(),
                                    meeting.getLatitude(),
                                    meeting.getLongitude()
                            );
                        }

                        Double score = aiMeeting.getScore();
                        String reason = generateRecommendReason(score, distanceKm);

                        User organizer = meeting.getOrganizer();

                        return RecommendedMeetingDTO.builder()
                                .meetingId(meeting.getMeetingId())
                                .title(meeting.getTitle())
                                .description(meeting.getDescription())
                                .category(meeting.getCategory())
                                .subcategory(meeting.getSubcategory())
                                .meetingTime(meeting.getMeetingTime())
                                .locationName(meeting.getLocationName())
                                .locationAddress(meeting.getLocationAddress())
                                .latitude(meeting.getLatitude())
                                .longitude(meeting.getLongitude())
                                .vibe(meeting.getVibe())
                                .currentParticipants(meeting.getCurrentParticipants())
                                .maxParticipants(meeting.getMaxParticipants())
                                .expectedCost(meeting.getExpectedCost())
                                .imageUrl(meeting.getImageUrl())
                                .status(meeting.getStatus() != null ? meeting.getStatus().name() : null)

                                .aiScore(score)
                                .rank(aiMeeting.getRank())
                                .distanceKm(distanceKm)
                                .recommendReason(reason)

                                .organizerId(organizer != null ? organizer.getUserId() : null)
                                .organizerUsername(organizer != null ? organizer.getUsername() : null)
                                .organizerProfileImage(organizer != null ? organizer.getProfileImageUrl() : null)
                                .build();
                    })
                    .filter(Objects::nonNull)
                    .toList();

            long processingTime = System.currentTimeMillis() - startTime;

            Map<String, Object> modelInfoMap = Map.of();
            if (aiResponse.getModelInfo() != null) {
                Map<String, Object> tmp = new HashMap<>();
                tmp.put("rmse", aiResponse.getModelInfo().getRmse());
                tmp.put("mae", aiResponse.getModelInfo().getMae());
                tmp.put("accuracy", aiResponse.getModelInfo().getAccuracy());
                modelInfoMap = tmp;
            }

            log.info("✅ AI 추천 완료 - userId: {}, 추천 개수: {}, 처리 시간: {}ms",
                    userId, recommendations.size(), processingTime);

            return AiRecommendListResponse.builder()
                    .success(true)
                    .message("AI 추천 성공")
                    .userId(userId)
                    .recommendations(recommendations)
                    .totalCount(recommendations.size())
                    .modelInfo(modelInfoMap)
                    .processingTimeMs(processingTime)
                    .build();

        } catch (IllegalArgumentException e) {
            log.warn("⚠️ AI 추천 요청 오류: {}", e.getMessage());
            throw e;
        } catch (Exception e) {
            log.error("❌ AI 추천 실패: {}", e.getMessage(), e);
            throw new RuntimeException("AI 추천 처리 중 오류 발생: " + e.getMessage(), e);
        }
    }



    /**
     * 빈 응답 생성(처리시간 포함)
     */
    private AiRecommendListResponse buildEmptyResponse(Long userId, long startTime) {
        long processingTime = System.currentTimeMillis() - startTime;
        return AiRecommendListResponse.builder()
                .success(true)
                .message("추천 결과 없음")
                .userId(userId)
                .recommendations(List.of())
                .totalCount(0)
                .modelInfo(Map.of())
                .processingTimeMs(processingTime)
                .build();
    }

    /**
     * 거리 계산 (Haversine 공식)
     */
    private Double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        final int R = 6371; // 지구 반경 (km)

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c; // km
    }

    /**
     * 추천 이유 생성
     */
    private String generateRecommendReason(Double score, Double distanceKm) {
        StringBuilder reason = new StringBuilder();

        if (score >= 4.5) {
            reason.append("매우 높은 만족도 예상");
        } else if (score >= 4.0) {
            reason.append("높은 만족도 예상");
        } else if (score >= 3.5) {
            reason.append("적절한 만족도 예상");
        } else {
            reason.append("AI 추천");
        }

        if (distanceKm != null && distanceKm <= 5.0) {
            reason.append(", 가까운 거리 (").append(String.format("%.1f", distanceKm)).append("km)");
        }

        return reason.toString();
    }
}