package com.project.itda.domain.ai.service;

import com.project.itda.domain.ai.dto.request.SentimentAnalysisRequest;
import com.project.itda.domain.ai.dto.response.SentimentAnalysisDTO;
import com.project.itda.domain.ai.dto.response.SentimentAnalysisResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

/**
 * AI 기반 감성 분석 서비스
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class SentimentAnalysisService {

    private final AIServiceClient aiServiceClient;

    /**
     * 후기 텍스트 감성 분석
     *
     * @param text 후기 내용
     * @return 감성 분석 결과
     */
    public SentimentAnalysisDTO analyzeSentiment(String text) {
        log.info("🎯 감성 분석 시작 - text length: {}", text.length());

        try {
            // 1. FastAPI 요청 생성
            SentimentAnalysisRequest request = SentimentAnalysisRequest.builder()
                    .text(text)
                    .build();

            // 2. FastAPI 호출
            SentimentAnalysisResponse aiResponse = aiServiceClient.analyzeSentiment(request);

            if (!aiResponse.getSuccess()) {
                log.warn("⚠️ 감성 분석 실패");
                return buildErrorResponse();
            }

            // 3. 응답 변환
            String interpretation = aiResponse.getInterpretation();
            SentimentAnalysisResponse.SentimentScore sentiment = aiResponse.getSentiment();

            String sentimentType = mapInterpretationToType(interpretation);
            String sentimentIcon = getSentimentIcon(sentimentType);
            String sentimentText = getSentimentText(sentimentType);

            Double sentimentScore = getSentimentScore(sentiment, sentimentType);

            log.info("✅ 감성 분석 완료 - type: {}, score: {}", sentimentType, sentimentScore);

            return SentimentAnalysisDTO.builder()
                    .success(true)
                    .message("감성 분석 성공")
                    .sentimentType(sentimentType)
                    .sentimentScore(sentimentScore)
                    .sentimentIcon(sentimentIcon)
                    .sentimentText(sentimentText)
                    .detail(SentimentAnalysisDTO.SentimentDetail.builder()
                            .positivePercent(sentiment.getPositive() * 100)
                            .neutralPercent(sentiment.getNeutral() * 100)
                            .negativePercent(sentiment.getNegative() * 100)
                            .build())
                    .build();

        } catch (Exception e) {
            log.error("❌ 감성 분석 실패: {}", e.getMessage(), e);
            return buildErrorResponse();
        }
    }

    /**
     * 에러 응답 생성
     */
    private SentimentAnalysisDTO buildErrorResponse() {
        return SentimentAnalysisDTO.builder()
                .success(false)
                .message("감성 분석 실패")
                .sentimentType("NEUTRAL")
                .sentimentScore(0.5)
                .sentimentIcon("😐")
                .sentimentText("분석 실패")
                .build();
    }

    /**
     * 해석 텍스트 → 감성 타입 변환
     */
    private String mapInterpretationToType(String interpretation) {
        if (interpretation == null) return "NEUTRAL";

        switch (interpretation) {
            case "긍정":
                return "POSITIVE";
            case "부정":
                return "NEGATIVE";
            case "중립":
            default:
                return "NEUTRAL";
        }
    }

    /**
     * 감성 아이콘
     */
    private String getSentimentIcon(String sentimentType) {
        switch (sentimentType) {
            case "POSITIVE":
                return "😊";
            case "NEGATIVE":
                return "😞";
            case "NEUTRAL":
            default:
                return "😐";
        }
    }

    /**
     * 감성 텍스트
     */
    private String getSentimentText(String sentimentType) {
        switch (sentimentType) {
            case "POSITIVE":
                return "긍정적인 후기예요";
            case "NEGATIVE":
                return "부정적인 후기예요";
            case "NEUTRAL":
            default:
                return "보통이에요";
        }
    }

    /**
     * 감성 점수 추출
     */
    private Double getSentimentScore(
            SentimentAnalysisResponse.SentimentScore sentiment,
            String sentimentType
    ) {
        switch (sentimentType) {
            case "POSITIVE":
                return sentiment.getPositive();
            case "NEGATIVE":
                return sentiment.getNegative();
            case "NEUTRAL":
            default:
                return sentiment.getNeutral();
        }
    }
}