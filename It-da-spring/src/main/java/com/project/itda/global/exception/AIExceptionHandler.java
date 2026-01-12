package com.project.itda.global.exception;

import com.project.itda.domain.ai.exception.AIServiceException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * AI 서비스 전역 예외 핸들러
 */
@RestControllerAdvice
@Slf4j
public class AIExceptionHandler {

    /**
     * AI 서비스 예외 처리
     */
    @ExceptionHandler(AIServiceException.class)
    public ResponseEntity<Map<String, Object>> handleAIServiceException(AIServiceException e) {
        log.error("🚨 AI 서비스 예외: {} - {}", e.getErrorCode(), e.getMessage());

        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        errorResponse.put("error", "AI_SERVICE_ERROR");
        errorResponse.put("errorCode", e.getErrorCode());
        errorResponse.put("message", e.getMessage());
        errorResponse.put("aiService", e.getAiService());
        errorResponse.put("timestamp", LocalDateTime.now());

        // 에러 코드별 HTTP 상태 결정
        HttpStatus status = determineHttpStatus(e.getErrorCode());

        return ResponseEntity.status(status).body(errorResponse);
    }

    /**
     * 에러 코드별 HTTP 상태 결정
     */
    private HttpStatus determineHttpStatus(String errorCode) {
        if (errorCode == null) {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }

        if (errorCode.startsWith("HTTP_4")) {
            return HttpStatus.BAD_REQUEST;
        } else if (errorCode.startsWith("HTTP_5")) {
            return HttpStatus.SERVICE_UNAVAILABLE;
        } else if (errorCode.equals("CONNECTION_TIMEOUT")) {
            return HttpStatus.GATEWAY_TIMEOUT;
        } else {
            return HttpStatus.INTERNAL_SERVER_ERROR;
        }
    }
}