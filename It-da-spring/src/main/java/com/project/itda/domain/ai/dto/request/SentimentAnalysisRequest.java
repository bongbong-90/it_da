package com.project.itda.domain.ai.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 감성 분석 요청 (FastAPI 호출용)
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SentimentAnalysisRequest {

    /**
     * 분석할 텍스트 (후기 내용)
     * 최소 1자, 최대 500자
     */
    @NotBlank(message = "분석할 텍스트는 필수입니다")
    @Size(min = 1, max = 500, message = "텍스트는 1~500자 사이여야 합니다")
    private String text;
}