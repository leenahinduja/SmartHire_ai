package com.cs.SmartHireAi.model;

import lombok.Data;

@Data
public class RoundDecisionRequest {

    private Long jobId;

    private Long applicantId;
}