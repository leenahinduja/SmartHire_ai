package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter @Setter
public class McqResult {
    private Long id;
    private Long applicantId;
    private Long testId;
    private Integer score;
    private LocalDateTime submittedAt;
}
