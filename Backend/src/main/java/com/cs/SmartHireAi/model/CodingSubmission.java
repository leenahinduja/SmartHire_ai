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
public class CodingSubmission {
    private Long id;
    private Long userId;
    private Long problemId;
    private Long testId;
    private String code;
    private String language;
    private String status; // ACCEPTED, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, COMPILATION_ERROR, RUNTIME_ERROR
    private Integer passedTestCases;
    private Integer totalTestCases;
    private Long executionTimeMs;
    private String errorMessage;
    private LocalDateTime submittedAt;
}
