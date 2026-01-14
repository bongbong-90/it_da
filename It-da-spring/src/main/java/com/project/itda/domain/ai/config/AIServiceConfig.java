package com.project.itda.domain.ai.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * AI 서버(FastAPI) 설정
 */
@Component
@ConfigurationProperties(prefix = "ai.server")
@Getter
@Setter
public class AIServiceConfig {

    /**
     * FastAPI 서버 URL
     * 예: http://localhost:8000
     */
    private String url = "http://localhost:8000";

    /**
     * 요청 타임아웃 (밀리초)
     * 기본값: 30000 (30초)
     */
    private int timeout = 30000;

    /**
     * 최대 재시도 횟수
     * 기본값: 3
     */
    private int maxRetries = 3;

    /**
     * 캐시 활성화 여부
     * 기본값: true
     */
    private boolean enableCache = true;
}