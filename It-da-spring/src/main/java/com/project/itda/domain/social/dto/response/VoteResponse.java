package com.project.itda.domain.social.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;

import java.util.List;

@Getter
@Builder
@AllArgsConstructor
public class VoteResponse {
    private Long voteId;
    private String title;
    private boolean isAnonymous;
    private boolean isMultipleChoice;
    private Long creatorId;
    private String creatorNickname;
    private List<VoteOptionResponse> options;

    @Getter
    @Builder
    public static class VoteOptionResponse {
        private Long optionId;
        private String content;
        private int voteCount;              // 해당 항목 투표 수
        private List<Long> voterIds;        // 투표한 유저 ID 목록 (익명이 아닐 때 활용)
    }
}