package com.project.itda.domain.meeting.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
public class MeetingLocationUpdateDto {
    private String locationName;    // 장소명
    private String locationAddress; // 주소
    private Double latitude;        // 위도
    private Double longitude;       // 경도
}
