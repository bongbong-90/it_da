package com.project.itda.domain.social.dto.request;

import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

@Getter
@NoArgsConstructor
public class VoteActionRequest {
    private List<Long> selectedOptionIds; // 선택한 옵션 ID 목록 (중복 투표 가능 대비)
}