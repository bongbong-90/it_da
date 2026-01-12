package com.project.itda.domain.participation.dto.request;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 참여 상태 변경 요청
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationStatusRequest {

    /**
     * 거절 사유 (거절 시)
     */
    @Size(max = 500, message = "거절 사유는 500자 이하로 작성해주세요")
    private String rejectionReason;
}