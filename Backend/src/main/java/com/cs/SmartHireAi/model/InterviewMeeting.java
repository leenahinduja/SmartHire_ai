package com.cs.SmartHireAi.model;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class InterviewMeeting {
    private Long id;
    private Long jobId;
    private Long applicantId;
    private String meetingLink;
    private LocalDateTime meetingTime;
    private String slotDate;
    private String slotStartTime;
    private String slotEndTime;
    private String interviewStatus;
}
