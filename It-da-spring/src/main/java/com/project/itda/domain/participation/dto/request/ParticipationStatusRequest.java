package com.project.itda.domain.participation.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationStatusRequest {
    private String status;           // APPROVED, REJECTED 등
    private String rejectionReason;  // 거절 사유
}