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
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AISearchService {

    private final MeetingRepository meetingRepository;

    // ✅ 핵심: 어떤 필터든 이 개수 미만이면 "필터 스킵"
    private static final int MIN_CANDIDATES = 30; // 데이터 적으면 10~20으로 낮춰도 됨

    public AISearchResponse searchForAI(AISearchRequest request) {
        log.info("🤖 AI 검색: category={}, subcategory={}, timeSlot={}, locationQuery={}, locationType={}, maxCost={}, keywords={}",
                request.getCategory(), request.getSubcategory(), request.getTimeSlot(),
                request.getLocationQuery(), request.getLocationType(),
                request.getMaxCost(), request.getKeywords());

        // 0) 기본 후보군: RECRUITING 전체
        List<Meeting> base = meetingRepository.findByStatus(
                MeetingStatus.RECRUITING, Pageable.unpaged()
        ).getContent();

        List<Meeting> meetings = base;

        // 1) category (소프트)
        if (hasText(request.getCategory())) {
            String cat = request.getCategory().trim();
            meetings = applySoftFilter(
                    meetings,
                    m -> m.getCategory() != null && m.getCategory().trim().equalsIgnoreCase(cat),
                    "category=" + cat
            );
        }

        // 2) subcategory (소프트)
        if (hasText(request.getSubcategory())) {
            String sub = request.getSubcategory().trim();
            meetings = applySoftFilter(
                    meetings,
                    m -> m.getSubcategory() != null && m.getSubcategory().trim().equalsIgnoreCase(sub),
                    "subcategory=" + sub
            );
        }

        // 3) locationType (소프트)  ※ DTO에 string일 수도 enum일 수도 있어서 safe하게 비교
        if (hasText(request.getLocationType())) {
            String lt = request.getLocationType().trim().toUpperCase();
            meetings = applySoftFilter(
                    meetings,
                    m -> m.getLocationType() != null && m.getLocationType().name().equalsIgnoreCase(lt),
                    "locationType=" + lt
            );
        }

        // 4) timeSlot (소프트)
        if (hasText(request.getTimeSlot())) {
            Set<String> allowed = Arrays.stream(request.getTimeSlot().split(","))
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .map(String::toUpperCase)
                    .collect(Collectors.toSet());

            if (!allowed.isEmpty()) {
                meetings = applySoftFilter(
                        meetings,
                        m -> m.getTimeSlot() != null && allowed.contains(m.getTimeSlot().name()),
                        "timeSlot in " + allowed
                );
            }
        }

        // 5) maxCost (소프트)
        if (request.getMaxCost() != null) {
            Integer max = request.getMaxCost();
            meetings = applySoftFilter(
                    meetings,
                    m -> m.getExpectedCost() != null && m.getExpectedCost() <= max,
                    "maxCost<=" + max
            );
        }

        // 6) locationQuery 텍스트 필터 (소프트) - nearMe phrase면 텍스트 필터 스킵
        if (hasText(request.getLocationQuery()) && !isNearMePhrase(request.getLocationQuery())) {
            String q = request.getLocationQuery().trim().toLowerCase();
            meetings = applySoftFilter(
                    meetings,
                    m -> containsIgnoreCase(m.getLocationName(), q) || containsIgnoreCase(m.getLocationAddress(), q),
                    "locationQuery contains '" + q + "'"
            );
        }

        // 7) keywords 텍스트 필터 (소프트)
        if (request.getKeywords() != null && !request.getKeywords().isEmpty()) {
            List<String> kws = request.getKeywords().stream()
                    .filter(Objects::nonNull)
                    .map(String::trim)
                    .filter(s -> !s.isBlank())
                    .map(String::toLowerCase)
                    .distinct()
                    .toList();

            if (!kws.isEmpty()) {
                meetings = applySoftFilter(
                        meetings,
                        m -> {
                            String hay = buildHaystack(m);
                            for (String kw : kws) {
                                if (hay.contains(kw)) return true;
                            }
                            return false;
                        },
                        "keywords anyMatch " + kws
                );
            }
        }

        // 8) 거리 계산 + nearMe일 때만 radius 적용/정렬
        meetings = applyDistanceLogic(meetings, request);

        // DTO 변환
        List<AIMeetingDTO> meetingDTOs = meetings.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList());

        log.info("✅ AI 검색 완료: {}개 모임 반환", meetingDTOs.size());

        return AISearchResponse.builder()
                .meetings(meetingDTOs)
                .totalCount(meetingDTOs.size())
                .build();
    }

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

    // =========================
    // ✅ 핵심 유틸: "필터 적용" vs "스킵"
    // =========================
    private List<Meeting> applySoftFilter(List<Meeting> current, Predicate<Meeting> predicate, String label) {
        if (current == null || current.isEmpty()) return current;

        List<Meeting> filtered = current.stream().filter(predicate).toList();

        // 0개면 스킵 (원본 유지)
        if (filtered.isEmpty()) {
            log.info("⚠️ [{}] 결과 0개 → 필터 스킵 (원본 {} 유지)", label, current.size());
            return current;
        }

        // ✅ 너무 줄어들면 스킵 (최소 후보수 보장)
        if (filtered.size() < Math.min(MIN_CANDIDATES, current.size())) {
            log.info("⚠️ [{}] 결과 {}개(<{}) → 필터 스킵 (원본 {} 유지)",
                    label, filtered.size(), Math.min(MIN_CANDIDATES, current.size()), current.size());
            return current;
        }

        log.info("✅ [{}] 적용: {} -> {}", label, current.size(), filtered.size());
        return filtered;
    }

    // =========================
    // 거리 로직
    // =========================
    private List<Meeting> applyDistanceLogic(List<Meeting> meetings, AISearchRequest request) {
        if (meetings == null || meetings.isEmpty()) return meetings;
        if (request.getUserLocation() == null) return meetings;
        if (request.getUserLocation().getLatitude() == null || request.getUserLocation().getLongitude() == null) return meetings;

        Double userLat = request.getUserLocation().getLatitude();
        Double userLng = request.getUserLocation().getLongitude();

        boolean nearMe = hasText(request.getLocationQuery()) && isNearMePhrase(request.getLocationQuery());

        Double radius = request.getRadius();
        if (nearMe && radius == null) radius = 10.0; // nearMe 기본 반경

        // distanceKm 채우기
        for (Meeting m : meetings) {
            if (m.getLatitudeAsDouble() != null && m.getLongitudeAsDouble() != null) {
                double d = calculateDistance(userLat, userLng, m.getLatitudeAsDouble(), m.getLongitudeAsDouble());
                m.setDistanceKm(d);
            }
        }

        // radius 필터는 nearMe일 때만 의미있게
        if (nearMe && radius != null) {
            double r = radius;
            List<Meeting> filtered = meetings.stream()
                    .filter(m -> m.getDistanceKm() != null && m.getDistanceKm() <= r)
                    .toList();

            // ✅ radius도 소프트 처리: 너무 줄면 스킵
            if (!filtered.isEmpty() && filtered.size() >= Math.min(MIN_CANDIDATES, meetings.size())) {
                log.info("✅ [radius<={}km] 적용: {} -> {}", r, meetings.size(), filtered.size());
                meetings = filtered;
            } else {
                log.info("⚠️ [radius<={}km] 결과 {}개 → 스킵 (원본 {} 유지)",
                        r, filtered.size(), meetings.size());
            }
        }

        // nearMe면 거리순 정렬
        if (nearMe) {
            meetings = meetings.stream()
                    .sorted(Comparator.comparing(Meeting::getDistanceKm, Comparator.nullsLast(Comparator.naturalOrder())))
                    .toList();
        }

        return meetings;
    }

    // =========================
    // DTO 변환
    // =========================
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

    private OrganizerInfo convertOrganizerInfo(Meeting meeting) {
        if (meeting.getOrganizer() == null) return null;

        return OrganizerInfo.builder()
                .userId(meeting.getOrganizer().getUserId())
                .nickname(meeting.getOrganizer().getUsername())
                .rating(meeting.getOrganizer().getRating())
                .meetingCount(meeting.getOrganizer().getMeetingCount())
                .build();
    }

    // =========================
    // Helpers
    // =========================
    private boolean isNearMePhrase(String q) {
        if (q == null) return false;
        String s = q.toLowerCase();
        return s.contains("근처") || s.contains("주변") || s.contains("집");
    }

    private boolean hasText(String s) {
        return s != null && !s.trim().isBlank();
    }

    private boolean containsIgnoreCase(String field, String qLower) {
        if (field == null) return false;
        return field.toLowerCase().contains(qLower);
    }

    private String buildHaystack(Meeting m) {
        return (
                safe(m.getTitle()) + " " +
                        safe(m.getDescription()) + " " +
                        safe(m.getLocationName()) + " " +
                        safe(m.getLocationAddress())
        ).toLowerCase();
    }

    private String safe(String s) {
        return s == null ? "" : s;
    }

    // Haversine
    private double calculateDistance(double lat1, double lon1, double lat2, double lon2) {
        final int R = 6371; // km
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);

        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
