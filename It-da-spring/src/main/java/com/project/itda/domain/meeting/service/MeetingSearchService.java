package com.project.itda.domain.meeting.service;

import com.project.itda.domain.meeting.dto.request.MeetingSearchRequest;
import com.project.itda.domain.meeting.dto.response.MeetingResponse;
import com.project.itda.domain.meeting.dto.response.MeetingSearchResponse;
import com.project.itda.domain.meeting.entity.Meeting;
import com.project.itda.domain.meeting.enums.MeetingStatus;
import com.project.itda.domain.meeting.repository.MeetingRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 모임 검색 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MeetingSearchService {

    private final MeetingRepository meetingRepository;

    /**
     * 모임 검색 (종합)
     */
    public MeetingSearchResponse searchMeetings(MeetingSearchRequest request) {
        log.info("🔍 모임 검색 - keyword: {}, category: {}",
                request.getKeyword(), request.getCategory());

        // 페이징 설정
        int page = request.getPage() != null ? request.getPage() : 0;
        int size = request.getSize() != null ? request.getSize() : 20;
        String sortBy = request.getSortBy() != null ? request.getSortBy() : "createdAt";
        String sortDirection = request.getSortDirection() != null ? request.getSortDirection() : "desc";

        Sort sort = Sort.by(
                sortDirection.equalsIgnoreCase("asc") ? Sort.Direction.ASC : Sort.Direction.DESC,
                sortBy
        );

        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Meeting> meetingPage;

        // 위치 기반 검색
        if (request.getLatitude() != null && request.getLongitude() != null && request.getRadius() != null) {
            List<Meeting> nearbyMeetings = meetingRepository.findNearbyMeetings(
                    request.getLatitude(),
                    request.getLongitude(),
                    request.getRadius()
            );

            // 필터 적용
            List<Meeting> filteredMeetings = applyFilters(nearbyMeetings, request);

            // 페이징 처리
            int start = page * size;
            int end = Math.min(start + size, filteredMeetings.size());
            List<Meeting> pagedMeetings = filteredMeetings.subList(start, end);

            meetingPage = new org.springframework.data.domain.PageImpl<>(
                    pagedMeetings,
                    pageable,
                    filteredMeetings.size()
            );

        }
        // 키워드 검색
        else if (request.getKeyword() != null && !request.getKeyword().isEmpty()) {
            meetingPage = meetingRepository.searchByKeyword(request.getKeyword(), pageable);

        }
        // 날짜 범위 검색
        else if (request.getStartDate() != null && request.getEndDate() != null) {
            List<Meeting> dateMeetings = meetingRepository.findByMeetingTimeBetween(
                    request.getStartDate(),
                    request.getEndDate()
            );

            List<Meeting> filteredMeetings = applyFilters(dateMeetings, request);

            int start = page * size;
            int end = Math.min(start + size, filteredMeetings.size());
            List<Meeting> pagedMeetings = filteredMeetings.subList(start, end);

            meetingPage = new org.springframework.data.domain.PageImpl<>(
                    pagedMeetings,
                    pageable,
                    filteredMeetings.size()
            );

        }
        // 카테고리 검색
        else if (request.getCategory() != null) {
            List<Meeting> categoryMeetings = meetingRepository.findByCategoryAndStatusRecruiting(
                    request.getCategory()
            );

            List<Meeting> filteredMeetings = applyFilters(categoryMeetings, request);

            int start = page * size;
            int end = Math.min(start + size, filteredMeetings.size());
            List<Meeting> pagedMeetings = filteredMeetings.subList(start, end);

            meetingPage = new org.springframework.data.domain.PageImpl<>(
                    pagedMeetings,
                    pageable,
                    filteredMeetings.size()
            );

        }
        // 기본: 모집 중인 모임
        else {
            meetingPage = meetingRepository.findByStatus(MeetingStatus.RECRUITING, pageable);
        }

        // DTO 변환
        List<MeetingResponse> meetingResponses = meetingPage.getContent().stream()
                .map(this::toMeetingResponse)
                .collect(Collectors.toList());

        return MeetingSearchResponse.builder()
                .success(true)
                .message("검색 성공")
                .meetings(meetingResponses)
                .keyword(request.getKeyword())
                .filters(MeetingSearchResponse.SearchFilter.builder()
                        .category(request.getCategory())
                        .subcategory(request.getSubcategory())
                        .locationType(request.getLocationType())
                        .vibe(request.getVibe())
                        .timeSlot(request.getTimeSlot())
                        .status(request.getStatus())
                        .radius(request.getRadius())
                        .build())
                .totalCount((int) meetingPage.getTotalElements())
                .currentPage(page)
                .totalPages(meetingPage.getTotalPages())
                .pageSize(size)
                .build();
    }

    /**
     * 필터 적용
     */
    private List<Meeting> applyFilters(List<Meeting> meetings, MeetingSearchRequest request) {
        return meetings.stream()
                .filter(m -> request.getCategory() == null || m.getCategory().equals(request.getCategory()))
                .filter(m -> request.getSubcategory() == null || m.getSubcategory().equals(request.getSubcategory()))
                .filter(m -> request.getLocationType() == null || m.getLocationType().name().equalsIgnoreCase(request.getLocationType()))
                .filter(m -> request.getVibe() == null || m.getVibe().equals(request.getVibe()))
                .filter(m -> request.getTimeSlot() == null || m.getTimeSlot().name().equalsIgnoreCase(request.getTimeSlot()))
                .filter(m -> request.getStatus() == null || m.getStatus().name().equalsIgnoreCase(request.getStatus()))
                .filter(m -> matchesKeywordOrTokens(m, request.getKeyword()))
                .collect(Collectors.toList());
    }

    private boolean matchesKeywordOrTokens(Meeting m, String keyword) {
        if (keyword == null || keyword.isBlank()) return true;

        String hay = (m.getTitle() + " " +
                m.getDescription() + " " +
                m.getLocationName() + " " +
                m.getLocationAddress())
                .toLowerCase();

        for (String tok : keyword.toLowerCase().split("\\s+")) {
            if (tok.isBlank()) continue;
            if (hay.contains(tok)) return true; // OR 매칭
        }
        return false;
    }



    /**
     * Meeting → MeetingResponse 변환
     */
    private MeetingResponse toMeetingResponse(Meeting meeting) {
        long dDay = ChronoUnit.DAYS.between(LocalDateTime.now(), meeting.getMeetingTime());

        return MeetingResponse.builder()
                .meetingId(meeting.getMeetingId())
                .organizerId(meeting.getOrganizer().getUserId())
                .organizerUsername(meeting.getOrganizer().getUsername())
                .organizerProfileImage(meeting.getOrganizer().getProfileImageUrl())
                .title(meeting.getTitle())
                .description(meeting.getDescription())
                .category(meeting.getCategory())
                .subcategory(meeting.getSubcategory())
                .meetingTime(meeting.getMeetingTime())
                .timeSlot(meeting.getTimeSlot().name())
                .locationName(meeting.getLocationName())
                .locationAddress(meeting.getLocationAddress())
                .latitude(meeting.getLatitudeAsDouble())
                .longitude(meeting.getLongitudeAsDouble())
                .locationType(meeting.getLocationType().name())
                .vibe(meeting.getVibe())
                .currentParticipants(meeting.getCurrentParticipants())
                .maxParticipants(meeting.getMaxParticipants())
                .expectedCost(meeting.getExpectedCost())
                .imageUrl(meeting.getImageUrl())
                .status(meeting.getStatus().name())
                .createdAt(meeting.getCreatedAt())
                .updatedAt(meeting.getUpdatedAt())
                .isFull(meeting.isFull())
                .dDay(dDay)
                .build();
    }
}