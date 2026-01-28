package com.project.itda.domain.admin.dto.request;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class InquiryStatusRequest {
    private String status;   // 상태 (PENDING, IN_PROGRESS, COMPLETED)
    private String answer;   // 답변 내용 (선택사항)
}