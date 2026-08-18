package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter
public class Application {
    private Long id;
    private Long job_id;
    private Long applicantId;
    private String round1_status = "PENDING";
    private String round2_status = "PENDING";
    private String round3_status = "PENDING";
    private String round4_status = "PENDING";
    private LocalDateTime appliedAt;
}
