package com.project.itda.domain.user.dto.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserContextResponse {

    @JsonProperty("user_id")
    private Long userId;

    @JsonProperty("latitude")
    private Double latitude;

    @JsonProperty("longitude")
    private Double longitude;

    @JsonProperty("interests")
    private String interests;

    @JsonProperty("time_preference")
    private String timePreference;

    @JsonProperty("budget_type")
    private String budgetType;

    @JsonProperty("user_avg_rating")
    private Double userAvgRating;

    @JsonProperty("user_meeting_count")
    private Integer userMeetingCount;

    @JsonProperty("user_rating_std")
    private Double userRatingStd;
}