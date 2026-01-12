package com.project.itda.domain.meeting.enums;

/**
 * 모임 시간대
 */
public enum MeetingTimeSlot {

    /**
     * 오전 (06:00~12:00)
     */
    MORNING("오전"),

    /**
     * 오후 (12:00~18:00)
     */
    AFTERNOON("오후"),

    /**
     * 저녁 (18:00~24:00)
     */
    EVENING("저녁"),

    /**
     * 심야 (00:00~06:00)
     */
    NIGHT("심야");

    private final String description;

    MeetingTimeSlot(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }

    /**
     * 시간으로 시간대 결정
     */
    public static MeetingTimeSlot fromHour(int hour) {
        if (hour >= 6 && hour < 12) {
            return MORNING;
        } else if (hour >= 12 && hour < 18) {
            return AFTERNOON;
        } else if (hour >= 18 && hour < 24) {
            return EVENING;
        } else {
            return NIGHT;
        }
    }
}