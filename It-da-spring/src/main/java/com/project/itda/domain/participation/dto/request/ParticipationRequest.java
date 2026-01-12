package com.project.itda.domain.participation.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 참여 신청 요청
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ParticipationRequest {

    /**
     * 모임 ID
     */
    @NotNull(message = "모임 ID는 필수입니다")
    private Long meetingId;

    /**
     * 신청 메시지
     */
    @Size(max = 500, message = "신청 메시지는 500자 이하로 작성해주세요")
    private String applicationMessage;

    /**
     * 추천 유형 (AI/SEARCH/DIRECT)
     */
    private String recommendationType;
}