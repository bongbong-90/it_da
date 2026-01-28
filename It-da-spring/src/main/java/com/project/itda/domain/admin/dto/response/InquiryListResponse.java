package com.project.itda.domain.admin.dto.response;

import com.project.itda.domain.admin.entity.Inquiry;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@AllArgsConstructor
@Builder
public class InquiryListResponse {
    private List<InquiryItem> content;
    private int currentPage;
    private int totalPages;
    private long totalElements;

    @Getter
    @AllArgsConstructor
    @Builder
    public static class InquiryItem {
        private Long inquiryId;
        private String category;
        private String email;
        private String title;
        private String username;
        private String status;
        private LocalDateTime createdAt;
        private LocalDateTime answeredAt;
        private String answeredByName;

        // Entity → DTO 변환 (username, answeredByName은 나중에 설정)
        public static InquiryItem from(Inquiry inquiry) {
            return InquiryItem.builder()
                    .inquiryId(inquiry.getInquiryId())
                    .category(inquiry.getType().name())
                    .email(inquiry.getEmail())
                    .title(inquiry.getTitle())
                    .username("비회원")  // 임시값 (나중에 User 조인으로 변경 가능)
                    .status(inquiry.getStatus().name())
                    .createdAt(inquiry.getCreatedAt())
                    .answeredAt(inquiry.getAnsweredAt())
                    .answeredByName(null)  // 임시값 (나중에 AdminUser 조인으로 변경 가능)
                    .build();
        }
    }
}