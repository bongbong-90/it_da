package com.project.itda.domain.participation.service;

import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import com.project.itda.domain.participation.dto.request.ParticipationRequest;
import com.project.itda.domain.participation.dto.request.ParticipationStatusRequest;
import com.project.itda.domain.participation.dto.response.ParticipantListResponse;
import com.project.itda.domain.participation.dto.response.ParticipationResponse;
import com.project.itda.domain.participation.entity.Participation;
import com.project.itda.domain.participation.enums.ParticipationStatus;
import com.project.itda.domain.participation.repository.ParticipationRepository;
import com.project.itda.domain.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 참여 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ParticipationService {

    private final ParticipationRepository participationRepository;
    private final MeetingRepository meetingRepository;

    /**
     * 모임 참여 신청
     */
    @Transactional
    public ParticipationResponse applyParticipation(User user, ParticipationRequest request) {
        log.info("📝 모임 참여 신청 - userId: {}, meetingId: {}",
                user.getUserId(), request.getMeetingId());

        // 1. 모임 조회
        Meeting meeting = meetingRepository.findById(request.getMeetingId())
                .orElseThrow(() -> new IllegalArgumentException("모임을 찾을 수 없습니다"));

        // 2. 이미 신청했는지 확인
        if (participationRepository.existsByUserIdAndMeetingId(user.getUserId(), meeting.getMeetingId())) {
            throw new IllegalStateException("이미 신청한 모임입니다");
        }

        // 3. 주최자는 신청 불가
        if (meeting.isOrganizer(user.getUserId())) {
            throw new IllegalStateException("주최자는 참여 신청을 할 수 없습니다");
        }

        // 4. 모임 마감 확인
        if (meeting.isFull()) {
            throw new IllegalStateException("모임 정원이 마감되었습니다");
        }

        // 5. 거리 계산 (Haversine)
        Double distance = calculateDistance(
                user.getLatitude(), user.getLongitude(),
                meeting.getLatitude(), meeting.getLongitude()
        );

        // 6. 참여 엔티티 생성
        Participation participation = Participation.builder()
                .user(user)
                .meeting(meeting)
                .status(ParticipationStatus.PENDING)
                .applicationMessage(request.getApplicationMessage())
                .recommendationType(request.getRecommendationType())
                .distanceKm(distance)
                .build();

        Participation saved = participationRepository.save(participation);

        log.info("✅ 참여 신청 완료 - participationId: {}", saved.getParticipationId());

        return toParticipationResponse(saved);
    }

    /**
     * 참여 승인 (주최자만)
     */
    @Transactional
    public ParticipationResponse approveParticipation(User organizer, Long participationId) {
        log.info("✅ 참여 승인 - organizerId: {}, participationId: {}",
                organizer.getUserId(), participationId);

        Participation participation = findById(participationId);
        Meeting meeting = participation.getMeeting();

        // 주최자 확인
        if (!meeting.isOrganizer(organizer.getUserId())) {
            throw new IllegalStateException("주최자만 승인할 수 있습니다");
        }

        // 승인
        participation.approve();

        // 모임 참가자 수 증가
        meeting.addParticipant();

        log.info("✅ 참여 승인 완료 - participationId: {}", participationId);

        return toParticipationResponse(participation);
    }

    /**
     * 참여 거절 (주최자만)
     */
    @Transactional
    public ParticipationResponse rejectParticipation(
            User organizer,
            Long participationId,
            ParticipationStatusRequest request
    ) {
        log.info("❌ 참여 거절 - organizerId: {}, participationId: {}",
                organizer.getUserId(), participationId);

        Participation participation = findById(participationId);
        Meeting meeting = participation.getMeeting();

        // 주최자 확인
        if (!meeting.isOrganizer(organizer.getUserId())) {
            throw new IllegalStateException("주최자만 거절할 수 있습니다");
        }

        // 거절
        participation.reject(request.getRejectionReason());

        log.info("✅ 참여 거절 완료 - participationId: {}", participationId);

        return toParticipationResponse(participation);
    }

    /**
     * 참여 취소 (신청자 본인)
     */
    @Transactional
    public void cancelParticipation(User user, Long participationId) {
        log.info("🚫 참여 취소 - userId: {}, participationId: {}",
                user.getUserId(), participationId);

        Participation participation = findById(participationId);

        // 본인 확인
        if (!participation.getUser().getUserId().equals(user.getUserId())) {
            throw new IllegalStateException("본인만 취소할 수 있습니다");
        }

        // 승인된 상태였다면 모임 참가자 수 감소
        if (participation.getStatus() == ParticipationStatus.APPROVED) {
            Meeting meeting = participation.getMeeting();
            meeting.removeParticipant();
        }

        // 취소
        participation.cancel();

        log.info("✅ 참여 취소 완료 - participationId: {}", participationId);
    }

    /**
     * 모임의 참여자 목록 조회
     */
    @Transactional(readOnly = true)
    public ParticipantListResponse getParticipantsByMeetingId(Long meetingId) {
        log.info("📋 모임 참여자 목록 조회 - meetingId: {}", meetingId);

        List<Participation> participations = participationRepository.findByMeetingId(meetingId);

        List<ParticipationResponse> responses = participations.stream()
                .map(this::toParticipationResponse)
                .collect(Collectors.toList());

        // 상태별 통계
        long pendingCount = participations.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.PENDING)
                .count();
        long approvedCount = participations.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.APPROVED)
                .count();
        long rejectedCount = participations.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.REJECTED)
                .count();
        long cancelledCount = participations.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.CANCELLED)
                .count();
        long completedCount = participations.stream()
                .filter(p -> p.getStatus() == ParticipationStatus.COMPLETED)
                .count();

        return ParticipantListResponse.builder()
                .success(true)
                .message("참여자 목록 조회 성공")
                .participants(responses)
                .totalCount(participations.size())
                .statusStats(ParticipantListResponse.StatusStats.builder()
                        .pendingCount(pendingCount)
                        .approvedCount(approvedCount)
                        .rejectedCount(rejectedCount)
                        .cancelledCount(cancelledCount)
                        .completedCount(completedCount)
                        .build())
                .build();
    }

    /**
     * 사용자의 참여 목록 조회
     */
    @Transactional(readOnly = true)
    public List<ParticipationResponse> getParticipationsByUserId(Long userId) {
        log.info("📋 사용자 참여 목록 조회 - userId: {}", userId);

        List<Participation> participations = participationRepository.findByUserId(userId);

        return participations.stream()
                .map(this::toParticipationResponse)
                .collect(Collectors.toList());
    }

    /**
     * 참여 단건 조회
     */
    @Transactional(readOnly = true)
    public Participation findById(Long participationId) {
        return participationRepository.findById(participationId)
                .orElseThrow(() -> new IllegalArgumentException("참여 정보를 찾을 수 없습니다"));
    }

    /**
     * Haversine 공식으로 거리 계산 (km)
     */
    private Double calculateDistance(
            Double lat1, Double lon1,
            Double lat2, Double lon2
    ) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return null;
        }

        double R = 6371.0; // 지구 반지름 (km)

        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
                + Math.cos(Math.toRadians(lat1))
                * Math.cos(Math.toRadians(lat2))
                * Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        double distance = R * c;

        // 소수점 둘째 자리까지 반올림
        return Math.round(distance * 100.0) / 100.0;
    }

    /**
     * Participation → ParticipationResponse 변환
     */
    private ParticipationResponse toParticipationResponse(Participation participation) {
        return ParticipationResponse.builder()
                .participationId(participation.getParticipationId())
                .userId(participation.getUser().getUserId())
                .username(participation.getUser().getUsername())
                .userProfileImage(participation.getUser().getProfileImageUrl())
                .meetingId(participation.getMeeting().getMeetingId())
                .meetingTitle(participation.getMeeting().getTitle())
                .status(participation.getStatus().name())
                .applicationMessage(participation.getApplicationMessage())
                .rejectionReason(participation.getRejectionReason())
                .distanceKm(participation.getDistanceKmAsDouble())
                .recommendationType(participation.getRecommendationType())
                .predictedRating(participation.getPredictedRatingAsDouble())
                .appliedAt(participation.getAppliedAt())
                .approvedAt(participation.getApprovedAt())
                .completedAt(participation.getCompletedAt())
                .build();
    }
}