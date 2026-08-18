package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ScheduleInterviewRequest {
    private Long jobId;
    private Long applicantId;
    private String meetingLink;
    private String meetingTime; // e.g. "2026-08-22T15:30:00"
}
