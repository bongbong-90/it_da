package com.project.itda.domain.meeting.service;

import com.project.itda.domain.meeting.dto.request.AISearchRequest;
import com.project.itda.domain.meeting.dto.response.AISearchResponse;
import com.project.itda.domain.meeting.dto.response.AIMeetingDTO;
import com.project.itda.domain.meeting.dto.response.AIMeetingDTO.OrganizerInfo;
import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.enums.MeetingStatus;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * FastAPI AI 서버 전용 Service
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AISearchService {

    private final MeetingRepository meetingRepository;

    public AISearchResponse searchForAI(AISearchRequest request) {
        log.info("🤖 AI 검색: category={}, subcategory={}, timeSlot={}, locationType={}, location={}",
                request.getCategory(), request.getSubcategory(),
                request.getTimeSlot(), request.getLocationType(), request.getLocationQuery());

        List<Meeting> meetings = meetingRepository.findByStatus(
                MeetingStatus.RECRUITING,
                org.springframework.data.domain.Pageable.unpaged()
        ).getContent();

        // 1) 카테고리 필터 (0개면 유지)
        if (request.getCategory() != null && !request.getCategory().isBlank()) {
            String cat = request.getCategory().trim();
            List<Meeting> filtered = meetings.stream()
                    .filter(m -> m.getCategory() != null && m.getCategory().trim().equalsIgnoreCase(cat))
                    .toList();
            if (!filtered.isEmpty()) meetings = filtered;
        }

        // 2) 서브카테고리 필터 (0개면 유지)
        if (request.getSubcategory() != null && !request.getSubcategory().isBlank()) {
            String sub = request.getSubcategory().trim();
            List<Meeting> filtered = meetings.stream()
                    .filter(m -> m.getSubcategory() != null && m.getSubcategory().trim().equalsIgnoreCase(sub))
                    .toList();
            if (!filtered.isEmpty()) meetings = filtered;
        }

        // ✅ 3) locationType 필터 추가 (매우 중요!)
        if (request.getLocationType() != null && !request.getLocationType().isBlank()) {
            String requestedType = request.getLocationType().trim().toUpperCase();
            log.info("🏠 locationType 필터 적용: {}", requestedType);

            List<Meeting> filtered = meetings.stream()
                    .filter(m -> {
                        if (m.getLocationType() == null) {
                            return false;
                        }
                        return m.getLocationType().name().equals(requestedType);
                    })
                    .toList();

            if (!filtered.isEmpty()) {
                log.info("✅ locationType={} 필터 결과: {}개 -> {}개",
                        requestedType, meetings.size(), filtered.size());
                meetings = filtered;
            } else {
                // ✅ 수정: 0개여도 반대 타입 제외
                log.warn("⚠️ locationType={} 모임이 0개입니다. 반대 타입 제외 처리", requestedType);

                // OUTDOOR 요청인데 0개면 → INDOOR 모임 전부 제거
                // INDOOR 요청인데 0개면 → OUTDOOR 모임 전부 제거
                String oppositeType = requestedType.equals("OUTDOOR") ? "INDOOR" : "OUTDOOR";

                meetings = meetings.stream()
                        .filter(m -> m.getLocationType() == null ||
                                !m.getLocationType().name().equals(oppositeType))
                        .toList();

                log.info("🚫 반대 타입({}) 모임 제외 완료: {}개 남음", oppositeType, meetings.size());
            }
        }

        // 4) 시간대 필터 (허용 목록에 포함되거나 timeSlot null이면 통과)
        if (request.getTimeSlot() != null && !request.getTimeSlot().isBlank()) {
            Set<String> allowed = Arrays.stream(request.getTimeSlot().split(","))
                    .map(String::trim)
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            List<Meeting> filtered = meetings.stream()
                    .filter(m -> m.getTimeSlot() == null || allowed.contains(m.getTimeSlot().name()))
                    .toList();
            if (!filtered.isEmpty()) meetings = filtered;
        }

        // 5) 비용 필터
        if (request.getMaxCost() != null) {
            meetings = meetings.stream()
                    .filter(m -> m.getExpectedCost() <= request.getMaxCost())
                    .toList();
        }

        // 6) locationQuery는 "소프트 필터"로 통일
        meetings = applyLocationQuerySoftFilter(meetings, request.getLocationQuery());

        // 7) 키워드 필터 (0개면 유지)
        if (request.getKeywords() != null && !request.getKeywords().isEmpty()) {
            List<String> kws = request.getKeywords().stream()
                    .filter(k -> k != null && !k.isBlank())
                    .map(k -> k.toLowerCase().trim())
                    .toList();

            if (!kws.isEmpty()) {
                List<Meeting> filtered = meetings.stream()
                        .filter(m -> {
                            String hay = (
                                    (m.getTitle() == null ? "" : m.getTitle()) + " " +
                                            (m.getDescription() == null ? "" : m.getDescription()) + " " +
                                            (m.getLocationName() == null ? "" : m.getLocationName()) + " " +
                                            (m.getLocationAddress() == null ? "" : m.getLocationAddress())
                            ).toLowerCase();
                            return kws.stream().anyMatch(hay::contains);
                        })
                        .toList();

                if (!filtered.isEmpty()) meetings = filtered;
            }
        }

        // 8) 거리 계산 + (nearMe OR ambiguous)일 때 거리정렬
        boolean nearMe = request.getLocationQuery() != null && isNearMePhrase(request.getLocationQuery());
        boolean ambiguous = isAmbiguous(request);

        if (request.getUserLocation() != null
                && request.getUserLocation().getLatitude() != null
                && request.getUserLocation().getLongitude() != null) {

            // distanceKm 계산
            meetings.forEach(m -> {
                if (m.getLatitudeAsDouble() != null && m.getLongitudeAsDouble() != null) {
                    double d = calculateDistance(
                            request.getUserLocation().getLatitude(),
                            request.getUserLocation().getLongitude(),
                            m.getLatitudeAsDouble(),
                            m.getLongitudeAsDouble()
                    );
                    m.setDistanceKm(d);
                }
            });

            // ✅ ambiguous이거나 locationQuery가 있으면 무조건 거리 정렬
            if (nearMe || ambiguous || (request.getLocationQuery() != null && !request.getLocationQuery().isBlank())) {
                meetings = meetings.stream()
                        .sorted(Comparator.comparing(Meeting::getDistanceKm,
                                Comparator.nullsLast(Comparator.naturalOrder())))
                        .toList();
                log.info("🔄 거리 기준 정렬 완료 (nearMe={}, ambiguous={}, locationQuery={})",
                        nearMe, ambiguous, request.getLocationQuery());
            }
        }

        List<AIMeetingDTO> meetingDTOs = meetings.stream()
                .map(this::convertToDTO)
                .toList();

// ✅ 추가: 디버깅용 로그
        log.info("✅ AI 검색 완료: {}개 모임 발견 (nearMe={}, ambiguous={}, locationType={})",
                meetingDTOs.size(), nearMe, ambiguous, request.getLocationType());

// ✅ 추가: 상위 5개 모임 ID 출력
        if (!meetingDTOs.isEmpty()) {
            String top5 = meetingDTOs.stream()
                    .limit(5)
                    .map(m -> String.valueOf(m.getMeetingId()))
                    .collect(Collectors.joining(", "));
            log.info("🔝 상위 5개 모임 ID: [{}]", top5);
        }

        return AISearchResponse.builder()
                .meetings(meetingDTOs)
                .totalCount(meetingDTOs.size())
                .build();
    }

    /**
     * 모임 일괄 조회
     */
    public AISearchResponse getMeetingsBatch(List<Long> meetingIds) {
        log.info("📦 모임 일괄 조회: {} IDs", meetingIds.size());

        List<Meeting> meetings = meetingRepository.findAllById(meetingIds);

        List<AIMeetingDTO> meetingDTOs = meetings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        return AISearchResponse.builder()
                .meetings(meetingDTOs)
                .totalCount(meetingDTOs.size())
                .build();
    }

    // ✅ 애매하면(카테고리/키워드 없음) "근처 추천"처럼 거리정렬만 켜기
    private boolean isAmbiguous(AISearchRequest request) {
        boolean noCategory = request.getCategory() == null || request.getCategory().isBlank();
        boolean noKeywords = request.getKeywords() == null || request.getKeywords().isEmpty();

        // ✅ 시간 키워드만 있으면 애매한 걸로 처리 (거리 정렬)
        boolean onlyTimeKeyword = false;
        if (request.getKeywords() != null && !request.getKeywords().isEmpty()) {
            Set<String> timeKeywords = Set.of("주말", "토요일", "일요일", "평일", "주중");
            onlyTimeKeyword = request.getKeywords().stream()
                    .allMatch(k -> timeKeywords.contains(k.toLowerCase()));
        }

        return (noCategory && noKeywords) || (noCategory && onlyTimeKeyword);
    }


    /**
     * Meeting → AIMeetingDTO 변환
     */
    private AIMeetingDTO convertToDTO(Meeting meeting) {
        return AIMeetingDTO.builder()
                .meetingId(meeting.getMeetingId())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .category(meeting.getCategory())
                .subcategory(meeting.getSubcategory())
                .meetingTime(meeting.getMeetingTime())
                .locationName(meeting.getLocationName())
                .locationAddress(meeting.getLocationAddress())
                .latitude(meeting.getLatitudeAsDouble())
                .longitude(meeting.getLongitudeAsDouble())
                .locationType(meeting.getLocationType() != null ? meeting.getLocationType().name() : null)
                .vibe(meeting.getVibe())
                .timeSlot(meeting.getTimeSlot() != null ? meeting.getTimeSlot().name() : null)
                .maxParticipants(meeting.getMaxParticipants())
                .currentParticipants(meeting.getCurrentParticipants())
                .expectedCost(meeting.getExpectedCost())
                .status(meeting.getStatus() != null ? meeting.getStatus().name() : null)
                .imageUrl(meeting.getImageUrl())
                .avgRating(meeting.getAvgRating())
                .ratingCount(meeting.getRatingCount())
                .distanceKm(meeting.getDistanceKm())
                .organizer(convertOrganizerInfo(meeting))
                .build();
    }

    /**
     * 주최자 정보 변환
     */
    private OrganizerInfo convertOrganizerInfo(Meeting meeting) {
        if (meeting.getOrganizer() == null) {
            return null;
        }

        return OrganizerInfo.builder()
                .userId(meeting.getOrganizer().getUserId())
                .nickname(meeting.getOrganizer().getUsername())
                .rating(meeting.getOrganizer().getRating())
                .meetingCount(meeting.getOrganizer().getMeetingCount())
                .build();
    }

    /**
     * 거리 계산 (Haversine formula)
     */
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // 지구 반지름 (km)

        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

    private boolean isNearMePhrase(String q) {
        if (q == null) return false;
        String s = q.toLowerCase();
        return s.contains("근처") || s.contains("주변") || s.contains("집");
    }

    // locationQuery(예: "송파", "잠실") 텍스트 필터 - ✅ 소프트 필터
    private List<Meeting> applyLocationQuerySoftFilter(List<Meeting> meetings, String locationQuery) {
        if (locationQuery == null || locationQuery.isBlank()) return meetings;

        String q = locationQuery.trim().toLowerCase();

        // "근처/주변/집"은 거리 기반이므로 텍스트 필터 스킵
        if (isNearMePhrase(q)) return meetings;

        // ✅ 지역명 필터링 (소프트 - 최소 5개 이상일 때만)
        List<Meeting> filtered = meetings.stream()
                .filter(m ->
                        (m.getLocationName() != null && m.getLocationName().toLowerCase().contains(q)) ||
                                (m.getLocationAddress() != null && m.getLocationAddress().toLowerCase().contains(q))
                )
                .toList();

        // ✅ 필터 결과가 5개 이상이면 적용
        if (filtered.size() >= 5) {
            log.info("✅ locationQuery='{}' 필터 적용: {} -> {}개", q, meetings.size(), filtered.size());
            return filtered;
        }

        // ✅ 5개 미만이면 필터 스킵 (너무 좁혀지는 거 방지)
        log.info("⚠️ locationQuery='{}' 필터 결과 {}개(<5)라서 스킵", q, filtered.size());
        return meetings;
    }

}