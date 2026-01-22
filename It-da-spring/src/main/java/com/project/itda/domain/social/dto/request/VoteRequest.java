package com.project.itda.domain.social.dto.request;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VoteRequest {
    private String title;             // 투표 제목
    private boolean isAnonymous;      // 익명 투표 여부
    private boolean isMultipleChoice; // 중복 선택 여부
    private List<String> options;     // 투표 선택지 목록 (예: "치킨", "피자")
}