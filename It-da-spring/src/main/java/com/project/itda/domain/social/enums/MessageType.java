package com.project.itda.domain.social.enums;

/**
 * 채팅 메시지 유형 정의 [cite: 261, 272]
 */
public enum MessageType {
    TEXT,   // 텍스트 메시지 (기본값) [cite: 271, 272]
    IMAGE,  // 이미지 [cite: 272]
    FILE,   // 파일 [cite: 272]
    SYSTEM  // 시스템 메시지 (입장/퇴장 등) [cite: 272]
}