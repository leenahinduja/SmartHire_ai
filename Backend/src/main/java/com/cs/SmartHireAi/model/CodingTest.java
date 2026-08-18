package com.cs.SmartHireAi.model;

import lombok.Getter;
import lombok.Setter;

@Getter @Setter
public class CodingTest {
    private Long id;
    private Long jobId;
    private String problemStatement;
    private Integer durationMinutes;
    private Long createdBy;
}
