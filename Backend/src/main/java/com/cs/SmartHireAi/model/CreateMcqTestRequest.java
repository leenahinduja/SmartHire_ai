package com.cs.SmartHireAi.model;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateMcqTestRequest {

    private Long jobId;

    private int durationMinutes;

    private int totalMarks;

    private LocalDateTime startTime;

    private LocalDateTime endTime;
}
