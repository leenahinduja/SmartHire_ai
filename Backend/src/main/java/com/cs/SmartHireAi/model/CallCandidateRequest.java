package com.cs.SmartHireAi.model;

import lombok.Data;

@Data
public class CallCandidateRequest {
    private Long jobId;
    private Long applicantId;
    private String meetingLink;
}
