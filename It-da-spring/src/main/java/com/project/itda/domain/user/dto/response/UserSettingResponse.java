package com.project.itda.domain.user.dto.response;

import com.project.itda.domain.user.entity.UserSetting;
import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class UserSettingResponse {
    private Long settingId;
    private Long userId;

    // 기본 알림 설정
    private Boolean notificationEnabled;
    private Boolean pushNotification;

    // 팔로우 관련 알림
    private Boolean followMeetingNotification;
    private Boolean followReviewNotification;
    private Boolean newFollowerNotification;

    // 모임 관련 알림
    private Boolean meetingReminderNotification;
    private Boolean meetingUpdateNotification;
    private Boolean meetingChatNotification;

    // 후기 관련 알림
    private Boolean reviewRequestNotification;
    private Boolean reviewReplyNotification;

    // 시스템 알림
    private Boolean badgeNotification;
    private Boolean systemNotification;

    // 개인정보 설정
    private Boolean locationTracking;
    private String profileVisibility;
    private String meetingHistoryVisibility;

    public static UserSettingResponse from(UserSetting setting) {
        return UserSettingResponse.builder()
                .settingId(setting.getSettingId())
                .userId(setting.getUser().getUserId())
                .notificationEnabled(setting.getNotificationEnabled())
                .pushNotification(setting.getPushNotification())
                .followMeetingNotification(setting.getFollowMeetingNotification())
                .followReviewNotification(setting.getFollowReviewNotification())
                .newFollowerNotification(setting.getNewFollowerNotification())
                .meetingReminderNotification(setting.getMeetingReminderNotification())
                .meetingUpdateNotification(setting.getMeetingUpdateNotification())
                .meetingChatNotification(setting.getMeetingChatNotification())
                .reviewRequestNotification(setting.getReviewRequestNotification())
                .reviewReplyNotification(setting.getReviewReplyNotification())
                .badgeNotification(setting.getBadgeNotification())
                .systemNotification(setting.getSystemNotification())
                .locationTracking(setting.getLocationTracking())
                .profileVisibility(setting.getProfileVisibility())
                .meetingHistoryVisibility(setting.getMeetingHistoryVisibility())
                .build();
    }
}