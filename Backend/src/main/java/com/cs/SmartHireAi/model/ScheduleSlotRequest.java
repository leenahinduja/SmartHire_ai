package com.cs.SmartHireAi.model;

import lombok.Data;

@Data
public class ScheduleSlotRequest {
    private Long jobId;
    private String slotDate;      // e.g. "2026-08-20"
    private String startTime;     // e.g. "14:00"
    private String endTime;       // e.g. "18:00"
    private String meetingLink;   // Optional base meeting link
}
