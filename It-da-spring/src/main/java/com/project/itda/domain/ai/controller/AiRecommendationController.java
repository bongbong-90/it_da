package com.project.itda.domain.ai.controller;

import com.project.itda.domain.ai.dto.request.SentimentAnalysisRequest;
import com.project.itda.domain.ai.dto.response.*;
import com.project.itda.domain.ai.service.*;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * AI 추천 컨트롤러 (통합 완성)
 */
@Tag(name = "AI 추천", description = "AI 기반 모임 추천 API")
@RestController
@RequestMapping("/api/ai/recommendations")
@RequiredArgsConstructor
@Slf4j
public class AiRecommendationController {

    private final AiRecommendationService aiRecommendationService;
    private final SatisfactionPredictionService satisfactionPredictionService;
    private final PlaceRecommendService placeRecommendService;
    private final SentimentAnalysisService sentimentAnalysisService;
    private final AIServiceClient aiServiceClient;

    // ========================================================================
    // Step 2: SVD 모임 추천
    // ========================================================================

    /**
     * SVD 협업 필터링 기반 모임 추천
     *
     * GET /api/ai/recommendations/meetings?userId=3&topN=10
     */
    @Operation(
            summary = "AI 모임 추천",
            description = "SVD 협업 필터링을 사용하여 사용자 맞춤 모임을 추천합니다"
    )
    @GetMapping("/meetings")
    public ResponseEntity<AiRecommendListResponse> recommendMeetings(
            @Parameter(description = "사용자 ID", required = true)
            @RequestParam Long userId,

            @Parameter(description = "추천 개수 (기본: 10, 최대: 50)")
            @RequestParam(defaultValue = "10") Integer topN
    ) {
        log.info("📍 GET /api/ai/recommendations/meetings - userId: {}, topN: {}", userId, topN);

        if (topN > 50) {
            topN = 50;
        }

        AiRecommendListResponse response = aiRecommendationService.recommendMeetings(userId, topN);

        return ResponseEntity.ok(response);
    }

    // ========================================================================
    // Step 3: LightGBM 만족도 예측
    // ========================================================================

    /**
     * 모임 상세 페이지 만족도 예측
     *
     * GET /api/ai/recommendations/satisfaction?userId=3&meetingId=15
     */
    @Operation(
            summary = "모임 만족도 예측",
            description = "LightGBM Ranker를 사용하여 사용자의 모임 만족도를 예측합니다"
    )
    @GetMapping("/satisfaction")
    public ResponseEntity<SatisfactionPredictionDTO> predictSatisfaction(
            @Parameter(description = "사용자 ID", required = true)
            @RequestParam Long userId,

            @Parameter(description = "모임 ID", required = true)
            @RequestParam Long meetingId
    ) {
        log.info("📍 GET /api/ai/recommendations/satisfaction - userId: {}, meetingId: {}",
                userId, meetingId);

        SatisfactionPredictionDTO response = satisfactionPredictionService.predictSatisfaction(
                userId, meetingId
        );

        return ResponseEntity.ok(response);
    }

    // ========================================================================
    // Step 4: 장소 추천
    // ========================================================================

    /**
     * 모임 장소 추천 (중간지점 + 카카오맵)
     *
     * GET /api/ai/recommendations/place?meetingId=15
     */
    @Operation(
            summary = "모임 장소 추천",
            description = "참가자들의 중간지점을 계산하고 카카오맵으로 주변 장소를 추천합니다"
    )
    @GetMapping("/place")
    public ResponseEntity<PlaceRecommendationDTO> recommendPlace(
            @Parameter(description = "모임 ID", required = true)
            @RequestParam Long meetingId
    ) {
        log.info("📍 GET /api/ai/recommendations/place - meetingId: {}", meetingId);

        PlaceRecommendationDTO response = placeRecommendService.recommendPlace(meetingId);

        return ResponseEntity.ok(response);
    }

    // ========================================================================
    // Step 5: 감성 분석
    // ========================================================================

    /**
     * 감성 분석 테스트 (독립 API)
     *
     * POST /api/ai/recommendations/sentiment
     * Body: { "text": "이 모임 정말 좋았어요!" }
     */
    @Operation(
            summary = "감성 분석 테스트",
            description = "KcELECTRA를 사용하여 텍스트의 감성을 분석합니다 (테스트용)"
    )
    @PostMapping("/sentiment")
    public ResponseEntity<SentimentAnalysisDTO> analyzeSentiment(
            @Parameter(description = "분석할 텍스트", required = true)
            @RequestBody SentimentAnalysisRequest request
    ) {
        log.info("📍 POST /api/ai/recommendations/sentiment - text: {}",
                request.getText().substring(0, Math.min(request.getText().length(), 50)));

        SentimentAnalysisDTO response = sentimentAnalysisService.analyzeSentiment(
                request.getText()
        );

        return ResponseEntity.ok(response);
    }

    // ========================================================================
    // 헬스체크 & 모델 정보
    // ========================================================================

    /**
     * AI 서버 헬스체크
     *
     * GET /api/ai/recommendations/health
     */
    @Operation(
            summary = "AI 서버 헬스체크",
            description = "FastAPI AI 서버의 상태를 확인합니다"
    )
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> healthCheck() {
        log.info("📍 GET /api/ai/recommendations/health");

        Map<String, Object> health = aiServiceClient.healthCheck();

        return ResponseEntity.ok(health);
    }

    /**
     * AI 모델 정보 조회
     *
     * GET /api/ai/recommendations/models
     */
    @Operation(
            summary = "AI 모델 정보",
            description = "로드된 AI 모델의 정보를 조회합니다"
    )
    @GetMapping("/models")
    public ResponseEntity<Map<String, Object>> getModelsInfo() {
        log.info("📍 GET /api/ai/recommendations/models");

        Map<String, Object> modelsInfo = aiServiceClient.getModelsInfo();

        return ResponseEntity.ok(modelsInfo);
    }
}