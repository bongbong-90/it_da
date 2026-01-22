package com.project.itda.domain.meeting.controller;

import com.project.itda.domain.meeting.dto.request.MeetingSearchRequest;
import com.project.itda.domain.meeting.dto.response.MeetingSearchResponse;
import com.project.itda.domain.meeting.service.MeetingSearchService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 모임 검색 컨트롤러
 */
@Tag(name = "모임 검색", description = "모임 검색 API (키워드, 카테고리, 위치, 날짜)")
@RestController
@RequestMapping("/api/meetings/search")
@RequiredArgsConstructor
@Slf4j
public class MeetingSearchController {

    private final MeetingSearchService meetingSearchService;

    /**
     * 모임 검색 (종합)
     */
    @Operation(
            summary = "모임 검색",
            description = "키워드, 카테고리, 위치, 날짜 등 다양한 조건으로 모임을 검색합니다"
    )
    @GetMapping
    public ResponseEntity<MeetingSearchResponse> searchMeetings(
            @Parameter(description = "검색 키워드 (제목 + 설명)")
            @RequestParam(required = false) String keyword,

            @Parameter(description = "카테고리")
            @RequestParam(required = false) String category,

            @Parameter(description = "서브카테고리")
            @RequestParam(required = false) String subcategory,

            @Parameter(description = "시작 날짜 (yyyy-MM-dd HH:mm:ss)")
            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
            LocalDateTime startDate,

            @Parameter(description = "종료 날짜 (yyyy-MM-dd HH:mm:ss)")
            @RequestParam(required = false)
            @DateTimeFormat(pattern = "yyyy-MM-dd HH:mm:ss")
            LocalDateTime endDate,

            @Parameter(description = "위도 (위치 기반 검색)")
            @RequestParam(required = false) Double latitude,

            @Parameter(description = "경도 (위치 기반 검색)")
            @RequestParam(required = false) Double longitude,

            @Parameter(description = "검색 반경 (km)")
            @RequestParam(required = false) Double radius,

            @Parameter(description = "장소 유형 (indoor/outdoor)")
            @RequestParam(required = false) String locationType,

            @Parameter(description = "분위기 (active/chill/social)")
            @RequestParam(required = false) String vibe,

            @Parameter(description = "시간대 (morning/afternoon/evening/night)")
            @RequestParam(required = false) String timeSlot,

            @Parameter(description = "모임 상태 (RECRUITING/FULL/CANCELLED/COMPLETED)")
            @RequestParam(required = false) String status,

            @Parameter(description = "페이지 번호 (0부터 시작)")
            @RequestParam(defaultValue = "0") Integer page,

            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") Integer size,

            @Parameter(description = "정렬 기준 (createdAt/meetingTime/currentParticipants)")
            @RequestParam(defaultValue = "createdAt") String sortBy,

            @Parameter(description = "정렬 방향 (asc/desc)")
            @RequestParam(defaultValue = "desc") String sortDirection
    ) {

        log.info("🔥 HIT GeneralSearchController: /api/meetings/search");

        log.info("📍 GET /api/meetings/search - keyword: {}, category: {}, location: {},{}, radius: {}",
                keyword, category, latitude, longitude, radius);

        MeetingSearchRequest request = new MeetingSearchRequest(
                keyword, category, subcategory,
                startDate, endDate,
                latitude, longitude, radius,
                locationType, vibe, timeSlot, status,
                page, size, sortBy, sortDirection
        );

        MeetingSearchResponse response = meetingSearchService.searchMeetings(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 키워드 검색 (간편 API)
     */
    @Operation(
            summary = "키워드 검색",
            description = "키워드로 모임을 검색합니다 (제목 + 설명)"
    )
    @GetMapping("/keyword")
    public ResponseEntity<MeetingSearchResponse> searchByKeyword(
            @Parameter(description = "검색 키워드", required = true)
            @RequestParam String keyword,

            @Parameter(description = "페이지 번호")
            @RequestParam(defaultValue = "0") Integer page,

            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") Integer size
    ) {
        log.info("📍 GET /api/meetings/search/keyword - keyword: {}", keyword);

        MeetingSearchRequest request = new MeetingSearchRequest(
                keyword, null, null,
                null, null,
                null, null, null,
                null, null, null, null,
                page, size, "createdAt", "desc"
        );

        MeetingSearchResponse response = meetingSearchService.searchMeetings(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 위치 기반 검색 (간편 API)
     */
    @Operation(
            summary = "위치 기반 검색",
            description = "현재 위치 기준으로 가까운 모임을 검색합니다"
    )
    @GetMapping("/nearby")
    public ResponseEntity<MeetingSearchResponse> searchNearby(
            @Parameter(description = "위도", required = true)
            @RequestParam Double latitude,

            @Parameter(description = "경도", required = true)
            @RequestParam Double longitude,

            @Parameter(description = "검색 반경 (km)")
            @RequestParam(defaultValue = "5.0") Double radius,

            @Parameter(description = "페이지 번호")
            @RequestParam(defaultValue = "0") Integer page,

            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") Integer size
    ) {
        log.info("📍 GET /api/meetings/search/nearby - location: {},{}, radius: {}km",
                latitude, longitude, radius);

        MeetingSearchRequest request = new MeetingSearchRequest(
                null, null, null,
                null, null,
                latitude, longitude, radius,
                null, null, null, null,
                page, size, "createdAt", "desc"
        );

        MeetingSearchResponse response = meetingSearchService.searchMeetings(request);

        return ResponseEntity.ok(response);
    }

    /**
     * 카테고리 검색 (간편 API)
     */
    @Operation(
            summary = "카테고리 검색",
            description = "카테고리별로 모임을 검색합니다"
    )
    @GetMapping("/category/{category}")
    public ResponseEntity<MeetingSearchResponse> searchByCategory(
            @Parameter(description = "카테고리", required = true)
            @PathVariable String category,

            @Parameter(description = "서브카테고리")
            @RequestParam(required = false) String subcategory,

            @Parameter(description = "페이지 번호")
            @RequestParam(defaultValue = "0") Integer page,

            @Parameter(description = "페이지 크기")
            @RequestParam(defaultValue = "20") Integer size
    ) {
        log.info("📍 GET /api/meetings/search/category/{} - subcategory: {}",
                category, subcategory);

        MeetingSearchRequest request = new MeetingSearchRequest(
                null, category, subcategory,
                null, null,
                null, null, null,
                null, null, null, null,
                page, size, "createdAt", "desc"
        );

        MeetingSearchResponse response = meetingSearchService.searchMeetings(request);

        return ResponseEntity.ok(response);
    }
}