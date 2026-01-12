package com.project.itda.domain.meeting.dto.request;

import com.fasterxml.jackson.annotation.JsonFormat;
import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 모임 수정 요청
 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class MeetingUpdateRequest {

    /**
     * 모임 제목
     */
    @NotBlank(message = "모임 제목은 필수입니다")
    @Size(max = 200, message = "제목은 200자 이하로 입력해주세요")
    private String title;

    /**
     * 모임 설명
     */
    @NotBlank(message = "모임 설명은 필수입니다")
    private String description;

    /**
     * 모임 일시
     */
    @NotNull(message = "모임 일시는 필수입니다")
    @Future(message = "모임 일시는 현재 시간 이후여야 합니다")
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime meetingTime;

    /**
     * 장소명
     */
    @NotBlank(message = "장소명은 필수입니다")
    @Size(max = 200)
    private String locationName;

    /**
     * 상세 주소
     */
    @NotBlank(message = "상세 주소는 필수입니다")
    @Size(max = 500)
    private String locationAddress;

    /**
     * 위도
     */
    @NotNull(message = "위도는 필수입니다")
    @DecimalMin(value = "-90.0")
    @DecimalMax(value = "90.0")
    private Double latitude;

    /**
     * 경도
     */
    @NotNull(message = "경도는 필수입니다")
    @DecimalMin(value = "-180.0")
    @DecimalMax(value = "180.0")
    private Double longitude;

    /**
     * 장소 유형
     */
    @NotBlank(message = "장소 유형은 필수입니다")
    private String locationType;

    /**
     * 분위기
     */
    @NotBlank(message = "분위기는 필수입니다")
    @Size(max = 50)
    private String vibe;

    /**
     * 최대 인원
     */
    @NotNull(message = "최대 인원은 필수입니다")
    @Min(value = 2, message = "최대 인원은 2명 이상이어야 합니다")
    @Max(value = 100, message = "최대 인원은 100명 이하여야 합니다")
    private Integer maxParticipants;

    /**
     * 예상 비용
     */
    @Min(value = 0, message = "예상 비용은 0원 이상이어야 합니다")
    private Integer expectedCost;

    /**
     * 대표 이미지 URL
     */
    @Size(max = 500)
    private String imageUrl;

    /**
     * 태그
     */
    private String tags;
}