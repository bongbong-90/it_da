package com.project.itda.domain.admin.dto.response;

import com.project.itda.domain.admin.entity.Inquiry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@AllArgsConstructor
@Builder
public class InquiryDetailResponse {
    private Long inquiryId;          // 문의 ID
    private String category;         // 문의 유형
    private String email;            // 작성자 이메일
    private String username;         // 유저 이름
    private String title;            // 제목
    private String content;          // 내용
    private String fileUrl;          // 첨부파일 URL
    private String status;           // 상태
    private String answer;           // 답변
    private LocalDateTime createdAt; // 작성일
    private LocalDateTime answeredAt;// 답변일
    private Long answeredBy;         // 답변한 관리자 ID
    private String answeredByName;   // 답변 관리자 닉네임 (임시)

    // Entity → DTO 변환
    public static InquiryDetailResponse from(Inquiry inquiry) {
        return InquiryDetailResponse.builder()
                .inquiryId(inquiry.getInquiryId())
                .category(inquiry.getType().name())
                .email(inquiry.getEmail())
                .username("비회원")  // 임시값
                .title(inquiry.getTitle())
                .content(inquiry.getContent())
                .fileUrl(inquiry.getFileUrl())
                .status(inquiry.getStatus().name())
                .answer(inquiry.getAnswer())
                .createdAt(inquiry.getCreatedAt())
                .answeredAt(inquiry.getAnsweredAt())
                .answeredBy(inquiry.getAnsweredBy())
                .answeredByName(null)  // 임시값
                .build();
    }
}