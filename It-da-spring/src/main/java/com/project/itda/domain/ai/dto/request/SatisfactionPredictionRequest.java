package com.project.itda.domain.ai.dto.request;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 만족도 예측 요청 (FastAPI 호출용)
 * LightGBM Ranker 모델 사용
 */
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SatisfactionPredictionRequest {

    // ========================================
    // 기본 ID
    // ========================================

    @NotNull
    @JsonProperty("userId")
    private Integer userId;

    @NotNull
    @JsonProperty("meetingId")
    private Integer meetingId;

    // ========================================
    // 사용자 피처 (13개)
    // ========================================

    @NotNull
    @JsonProperty("user_lat")
    private Double userLat;

    @NotNull
    @JsonProperty("user_lng")
    private Double userLng;

    @NotNull
    @JsonProperty("user_interests")
    private String userInterests;

    @NotNull
    @JsonProperty("user_time_preference")
    private String userTimePreference;

    @NotNull
    @JsonProperty("user_location_pref")
    private String userLocationPref;

    @NotNull
    @JsonProperty("user_budget_type")
    private String userBudgetType;

    @NotNull
    @JsonProperty("user_energy_type")
    private String userEnergyType;

    @NotNull
    @JsonProperty("user_purpose_type")
    private String userPurposeType;

    @NotNull
    @JsonProperty("user_frequency_type")
    private String userFrequencyType;

    @NotNull
    @JsonProperty("user_leadership_type")
    private String userLeadershipType;

    @NotNull
    @JsonProperty("user_avg_rating")
    private Double userAvgRating;

    @NotNull
    @JsonProperty("user_meeting_count")
    private Integer userMeetingCount;

    @NotNull
    @JsonProperty("user_rating_std")
    private Double userRatingStd;

    // ========================================
    // 모임 피처 (12개)
    // ========================================

    @NotNull
    @JsonProperty("meeting_lat")
    private Double meetingLat;

    @NotNull
    @JsonProperty("meeting_lng")
    private Double meetingLng;

    @NotNull
    @JsonProperty("meeting_category")
    private String meetingCategory;

    @NotNull
    @JsonProperty("meeting_subcategory")
    private String meetingSubcategory;

    @NotNull
    @JsonProperty("meeting_time_slot")
    private String meetingTimeSlot;

    @NotNull
    @JsonProperty("meeting_location_type")
    private String meetingLocationType;

    @NotNull
    @JsonProperty("meeting_vibe")
    private String meetingVibe;

    @NotNull
    @JsonProperty("meeting_max_participants")
    private Integer meetingMaxParticipants;

    @NotNull
    @JsonProperty("meeting_expected_cost")
    private Double meetingExpectedCost;

    @NotNull
    @JsonProperty("meeting_avg_rating")
    private Double meetingAvgRating;

    @NotNull
    @JsonProperty("meeting_rating_count")
    private Integer meetingRatingCount;

    @NotNull
    @JsonProperty("meeting_participant_count")
    private Integer meetingParticipantCount;
}