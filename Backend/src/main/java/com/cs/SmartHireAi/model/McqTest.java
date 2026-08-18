package com.cs.SmartHireAi.model;

import lombok.Data;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDateTime;

@Getter
@Setter


@Data
public class McqTest {

    private Long id;
    private Long jobId;
    private int durationMinutes;
    private int totalMarks;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private boolean released;
}